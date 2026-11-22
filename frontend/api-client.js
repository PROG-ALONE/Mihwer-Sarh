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

  const allowedMethods = new Set(["GET", "POST", "PATCH", "DELETE"]);
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
      if (["POST", "PATCH"].includes(verb) && !body) throw new ApiError("request_body_required", 400);
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

    async function uploadAttachment(file, { noteId, signal, onProgress = () => {} } = {}) {
      if (!file || typeof file.arrayBuffer !== "function" || !Number.isSafeInteger(file.size) || file.size < 1 ||
          file.size > 20 * 1024 * 1024 || typeof file.type !== "string" || !file.type) {
        throw new ApiError("validation_failed", 400);
      }
      if (!globalThis.crypto?.subtle) throw new ApiError("checksum_unavailable", 503);
      const digest = await globalThis.crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const checksum = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      const body = { content_type: file.type, byte_size: file.size, checksum };
      if (noteId) body.note_id = noteId;
      onProgress("preparing");
      const prepared = await request("attachments", {
        method: "POST",
        query: { action: "prepare" },
        body,
        signal
      });

      const controller = new AbortController();
      const abortUpload = () => controller.abort(signal?.reason);
      if (signal?.aborted) abortUpload();
      else signal?.addEventListener("abort", abortUpload, { once: true });
      const timeout = setTimeout(() => controller.abort(new Error("request_timeout")), 120_000);
      try {
        onProgress("uploading");
        const uploadResponse = await fetchImpl(prepared.upload_url, {
          method: "PUT",
          headers: { "content-type": file.type, "x-upsert": "false" },
          body: file,
          signal: controller.signal
        });
        if (!uploadResponse.ok) {
          throw new ApiError("storage_upload_failed", uploadResponse.status);
        }
      } catch (error) {
        try {
          await request("attachments", {
            method: "POST",
            query: { action: "abort" },
            body: { id: prepared.id }
          });
        } catch (cleanupError) {
          throw new ApiError("attachment_cleanup_failed", 502, cleanupError);
        }
        if (error instanceof ApiError) throw error;
        if (signal?.aborted) throw new ApiError("request_aborted", 0);
        if (controller.signal.aborted) {
          throw new ApiError(controller.signal.reason?.message === "request_timeout" ? "request_timeout" : "request_aborted", 0);
        }
        throw new ApiError("network_error", 0, error);
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", abortUpload);
      }

      onProgress("verifying");
      const readFinalizedAttachment = async () => {
        const row = await request("attachments", {
          query: { action: "metadata", id: prepared.id }
        });
        return row?.id === prepared.id && row.state === "ready" ? row : null;
      };
      try {
        return await request("attachments", {
          method: "POST",
          query: { action: "finalize" },
          body: { id: prepared.id },
          signal
        });
      } catch (error) {
        let recovered;
        try {
          recovered = await readFinalizedAttachment();
        } catch {
          recovered = null;
        }
        if (recovered) return recovered;
        try {
          await request("attachments", {
            method: "POST",
            query: { action: "abort" },
            body: { id: prepared.id }
          });
        } catch (cleanupError) {
          if (cleanupError?.code !== "invalid_attachment_state") {
            throw new ApiError("attachment_cleanup_failed", 502, cleanupError);
          }
          try {
            recovered = await readFinalizedAttachment();
          } catch (stateError) {
            throw new ApiError("attachment_state_unavailable", 502, stateError);
          }
          if (recovered) return recovered;
        }
        throw error;
      }
    }

    return Object.freeze({ request, uploadAttachment, setSessionProvider });
  }

  return Object.freeze({ ApiError, createApiClient });
});
