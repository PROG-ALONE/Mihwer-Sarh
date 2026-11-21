"use strict";

(function attachMihwerApiClient(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MihwerApiClient = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  class ApiError extends Error {
    constructor(code, status = 0, details = null) {
      super(code);
      this.name = "ApiError";
      this.code = code;
      this.status = status;
      this.details = details;
    }
  }

  const allowedMethods = new Set(["GET", "POST", "PATCH"]);
  const retryableStatuses = new Set([502, 503, 504]);

  function parseJson(text, contentType) {
    if (!text) return null;
    if (!contentType?.toLowerCase().includes("application/json")) {
      throw new ApiError("invalid_response_content_type", 502);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError("invalid_json_response", 502);
    }
  }

  function createApiClient({
    baseUrl = "/api/v1",
    fetchImpl = globalThis.fetch,
    sessionProvider = null,
    timeoutMs = 12_000,
    maxGetRetries = 1,
    onAuthStateChange = () => {}
  } = {}) {
    if (typeof fetchImpl !== "function") throw new TypeError("fetch implementation is required");
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new TypeError("timeoutMs must be a positive integer");
    if (!Number.isInteger(maxGetRetries) || maxGetRetries < 0 || maxGetRetries > 3) {
      throw new TypeError("maxGetRetries must be an integer between 0 and 3");
    }

    let activeSessionProvider = sessionProvider;

    function setSessionProvider(provider) {
      if (provider !== null && typeof provider?.getAccessToken !== "function") {
        throw new TypeError("session provider must implement getAccessToken()");
      }
      activeSessionProvider = provider;
    }

    async function getAccessToken() {
      if (!activeSessionProvider) return null;
      try {
        const token = await activeSessionProvider.getAccessToken();
        return typeof token === "string" && token.trim() ? token : null;
      } catch (error) {
        throw new ApiError("session_unavailable", 503, error);
      }
    }

    async function request(resource, {
      method = "GET",
      query = {},
      body,
      signal,
      expectedVersion
    } = {}) {
      const verb = String(method).toUpperCase();
      if (!allowedMethods.has(verb)) throw new ApiError("method_not_allowed", 405);
      if (typeof resource !== "string" || !/^[a-z][a-z0-9-]*$/.test(resource)) {
        throw new ApiError("invalid_resource", 400);
      }
      if (verb !== "GET" && !body) throw new ApiError("request_body_required", 400);
      const token = await getAccessToken();
      if (!token) {
        onAuthStateChange("unauthenticated");
        throw new ApiError("unauthenticated", 401);
      }

      const url = new URL(`${baseUrl.replace(/\/$/, "")}/${resource}`, globalThis.location?.origin || "http://localhost");
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
      }
      if (expectedVersion !== undefined) url.searchParams.set("expected_version", String(expectedVersion));

      const attempts = verb === "GET" ? maxGetRetries + 1 : 1;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const controller = new AbortController();
        const onAbort = () => controller.abort(signal?.reason);
        if (signal?.aborted) onAbort();
        else signal?.addEventListener("abort", onAbort, { once: true });
        const timeout = setTimeout(() => controller.abort(new Error("request_timeout")), timeoutMs);

        try {
          if (controller.signal.aborted) throw new ApiError("request_aborted", 0);
          const response = await fetchImpl(url, {
            method: verb,
            headers: {
              authorization: `Bearer ${token}`,
              accept: "application/json",
              ...(body === undefined ? {} : { "content-type": "application/json" })
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: controller.signal
          });
          const text = await response.text();
          if (controller.signal.aborted) {
            const code = signal?.aborted ? "request_aborted" :
              controller.signal.reason?.message === "request_timeout" ? "request_timeout" : "request_aborted";
            throw new ApiError(code, 0);
          }
          const payload = parseJson(text, response.headers?.get?.("content-type"));

          if (!response.ok) {
            const code = typeof payload?.error?.code === "string" ? payload.error.code : "request_failed";
            if (response.status === 401) onAuthStateChange("expired");
            if (response.status >= 500) onAuthStateChange("unavailable");
            const error = new ApiError(code, response.status, payload?.error || null);
            if (verb === "GET" && retryableStatuses.has(response.status) && attempt + 1 < attempts) continue;
            throw error;
          }
          return payload?.data;
        } catch (error) {
          if (error instanceof ApiError) throw error;
          if (signal?.aborted) throw new ApiError("request_aborted", 0);
          if (controller.signal.aborted) {
            const code = controller.signal.reason?.message === "request_timeout" ? "request_timeout" : "request_aborted";
            throw new ApiError(code, 0);
          }
          if (verb === "GET" && attempt + 1 < attempts) continue;
          throw new ApiError("network_error", 0, error);
        } finally {
          clearTimeout(timeout);
          signal?.removeEventListener("abort", onAbort);
        }
      }
      throw new ApiError("network_error", 0);
    }

    return Object.freeze({ request, setSessionProvider });
  }

  return Object.freeze({ ApiError, createApiClient });
});
