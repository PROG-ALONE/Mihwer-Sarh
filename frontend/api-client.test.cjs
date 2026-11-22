"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto, createHash } = require("node:crypto");
const { ApiError, createApiClient } = require("./api-client");

globalThis.crypto ||= webcrypto;

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" }
  });
}

test("API client sends the session bearer token and validates JSON responses", async () => {
  let calledUrl;
  let calledOptions;
  const client = createApiClient({
    baseUrl: "https://mihwar.test/api/v1",
    sessionProvider: { async getAccessToken() { return "session-token"; } },
    fetchImpl: async (url, options) => {
      calledUrl = new URL(url);
      calledOptions = options;
      return jsonResponse({ data: [{ id: "task-1" }] });
    }
  });

  const data = await client.request("tasks", { query: { journey_id: "journey-1", limit: 10 } });
  assert.deepEqual(data, [{ id: "task-1" }]);
  assert.equal(calledUrl.pathname, "/api/v1/tasks");
  assert.equal(calledUrl.searchParams.get("journey_id"), "journey-1");
  assert.equal(calledOptions.headers.authorization, "Bearer session-token");
  assert.equal(calledOptions.signal instanceof AbortSignal, true);
});

test("missing session never makes a request and reports unauthenticated", async () => {
  let fetchCount = 0;
  let authState;
  const client = createApiClient({
    fetchImpl: async () => { fetchCount += 1; return jsonResponse({ data: [] }); },
    onAuthStateChange: state => { authState = state; }
  });
  await assert.rejects(client.request("tasks"), error =>
    error instanceof ApiError && error.code === "unauthenticated" && error.status === 401
  );
  assert.equal(fetchCount, 0);
  assert.equal(authState, "unauthenticated");
});

test("expired sessions are surfaced to the auth-state listener", async () => {
  let authState;
  const client = createApiClient({
    sessionProvider: { async getAccessToken() { return "expired-token"; } },
    fetchImpl: async () => jsonResponse({ error: { code: "unauthenticated" } }, 401),
    onAuthStateChange: state => { authState = state; }
  });
  await assert.rejects(client.request("tasks"), error => error.status === 401);
  assert.equal(authState, "expired");
});

test("only idempotent GET requests retry transient failures", async () => {
  let reads = 0;
  let writes = 0;
  const client = createApiClient({
    sessionProvider: { async getAccessToken() { return "token"; } },
    fetchImpl: async (_url, options) => {
      if (options.method === "GET") {
        reads += 1;
        if (reads === 1) throw new TypeError("transient network failure");
        return jsonResponse({ data: [] });
      }
      writes += 1;
      return jsonResponse({ error: { code: "unavailable" } }, 503);
    }
  });
  assert.deepEqual(await client.request("tasks"), []);
  await assert.rejects(client.request("tasks", { method: "POST", body: { title: "once" } }));
  assert.equal(reads, 2);
  assert.equal(writes, 1);
});

test("attachment upload uses a short-lived signed URL, verifies server completion and never sends the session token to Storage", async () => {
    const bytes = Buffer.from("safe attachment");
    const file = new Blob([bytes], { type: "text/plain" });
    const phases = [];
    const calls = [];
    const client = createApiClient({
      baseUrl: "https://mihwar.test/api/v1",
      sessionProvider: { async getAccessToken() { return "sarh-session-token"; } },
      fetchImpl: async (input, options) => {
        const url = new URL(input);
        calls.push({ url, options });
        if (url.pathname === "/api/v1/attachments" && url.searchParams.get("action") === "prepare") {
          return jsonResponse({ data: {
            id: "00000000-0000-4000-8000-000000000001",
            upload_url: "https://mihwar.test/storage/v1/object/upload/sign/mihwer-private/a.txt?token=short-lived"
          } }, 201);
        }
        if (url.pathname.includes("/object/upload/sign/")) return jsonResponse({ Key: "uploaded" });
        if (url.pathname === "/api/v1/attachments" && url.searchParams.get("action") === "finalize") {
          return jsonResponse({ data: { id: "00000000-0000-4000-8000-000000000001", state: "ready" } });
        }
        throw new Error(`unexpected request ${options.method} ${url.pathname}`);
      }
    });
    const result = await client.uploadAttachment(file, {
      noteId: "00000000-0000-4000-8000-000000000002",
      onProgress: phase => phases.push(phase)
    });
    assert.equal(result.state, "ready");
    assert.deepEqual(phases, ["preparing", "uploading", "verifying"]);
    const storageCall = calls.find(call => call.options.method === "PUT");
    assert.equal(storageCall.options.headers.authorization, undefined);
    assert.equal(storageCall.options.headers["x-upsert"], "false");
    assert.equal(storageCall.options.headers["content-type"], "text/plain");
    const prepareCall = calls.find(call => call.url.searchParams.get("action") === "prepare");
    const prepareBody = JSON.parse(prepareCall.options.body);
    assert.equal(prepareBody.note_id, "00000000-0000-4000-8000-000000000002");
    assert.equal(prepareBody.checksum, createHash("sha256").update(bytes).digest("hex"));
    const finalizeCall = calls.find(call => call.url.searchParams.get("action") === "finalize");
    assert.equal(finalizeCall.options.headers.authorization, "Bearer sarh-session-token");
});

test("attachment upload cleans pending metadata when finalization fails", async () => {
  const file = new Blob(["cleanup"], { type: "text/plain" });
  let aborts = 0;
  const client = createApiClient({
    baseUrl: "https://mihwar.test/api/v1",
    sessionProvider: { async getAccessToken() { return "session-token"; } },
    fetchImpl: async (input, options) => {
      const url = new URL(input);
      if (url.searchParams.get("action") === "prepare") {
        return jsonResponse({ data: {
          id: "00000000-0000-4000-8000-000000000011",
          upload_url: "https://mihwar.test/storage/v1/object/upload/sign/mihwer-private/a.txt?token=short-lived"
        } }, 201);
      }
      if (url.pathname.includes("/object/upload/sign/")) return jsonResponse({ Key: "uploaded" });
      if (url.searchParams.get("action") === "finalize") {
        return jsonResponse({ error: { code: "temporarily_unavailable" } }, 503);
      }
      if (url.searchParams.get("action") === "abort") {
        aborts += 1;
        return jsonResponse({ data: { aborted: true } });
      }
      if (url.pathname === "/api/v1/attachments") return jsonResponse({ data: [] });
      throw new Error(`unexpected request ${options.method} ${url.pathname}`);
    }
  });
  await assert.rejects(client.uploadAttachment(file), error => error.code === "temporarily_unavailable");
  assert.equal(aborts, 1);
});

test("attachment upload recovers a ready record if the finalize response is lost", async () => {
  const file = new Blob(["saved"], { type: "text/plain" });
  let aborts = 0;
  const client = createApiClient({
    baseUrl: "https://mihwar.test/api/v1",
    sessionProvider: { async getAccessToken() { return "session-token"; } },
    fetchImpl: async (input, options) => {
      const url = new URL(input);
      if (url.searchParams.get("action") === "prepare") {
        return jsonResponse({ data: {
          id: "00000000-0000-4000-8000-000000000012",
          upload_url: "https://mihwar.test/storage/v1/object/upload/sign/mihwer-private/a.txt?token=short-lived"
        } }, 201);
      }
      if (url.pathname.includes("/object/upload/sign/")) return jsonResponse({ Key: "uploaded" });
      if (url.searchParams.get("action") === "finalize") {
        return jsonResponse({ error: { code: "temporarily_unavailable" } }, 503);
      }
      if (url.searchParams.get("action") === "abort") {
        aborts += 1;
        return jsonResponse({ data: { aborted: true } });
      }
      if (url.pathname === "/api/v1/attachments") {
        return jsonResponse({ data: {
          id: "00000000-0000-4000-8000-000000000012",
          state: "ready"
        } });
      }
      throw new Error(`unexpected request ${options.method} ${url.pathname}`);
    }
  });
  const saved = await client.uploadAttachment(file);
  assert.equal(saved.id, "00000000-0000-4000-8000-000000000012");
  assert.equal(saved.state, "ready");
  assert.equal(aborts, 0);
});

test("malformed server JSON is rejected rather than treated as success", async () => {
  const client = createApiClient({
    sessionProvider: { async getAccessToken() { return "token"; } },
    fetchImpl: async () => new Response("{", { status: 200, headers: { "content-type": "application/json" } })
  });
  await assert.rejects(client.request("tasks"), error => error.code === "invalid_json_response");
});

test("timed-out requests are surfaced explicitly", async () => {
  const client = createApiClient({
    timeoutMs: 10,
    sessionProvider: { async getAccessToken() { return "token"; } },
    fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    })
  });
  await assert.rejects(client.request("tasks"), error => error.code === "request_timeout");
});

test("external cancellation aborts the request without retrying", async () => {
  let attempts = 0;
  const client = createApiClient({
    sessionProvider: { async getAccessToken() { return "token"; } },
    fetchImpl: async () => {
      attempts += 1;
      return jsonResponse({ data: [] });
    }
  });
  const controller = new AbortController();
  const request = client.request("tasks", { signal: controller.signal });
  controller.abort();
  await assert.rejects(request, error => error.code === "request_aborted");
  assert.equal(attempts, 0);
});

test("a late unauthorized response from an aborted request does not expire a new session", async () => {
  let release;
  let started = false;
  const states = [];
  const client = createApiClient({
    sessionProvider: { async getAccessToken() { return "old-token"; } },
    fetchImpl: async () => {
      started = true;
      return new Promise(resolve => { release = resolve; });
    },
    onAuthStateChange: state => states.push(state)
  });
  const controller = new AbortController();
  const pending = client.request("tasks", { signal: controller.signal });
  while (!started) await new Promise(resolve => setImmediate(resolve));
  controller.abort();
  release(jsonResponse({ error: { code: "unauthenticated" } }, 401));
  await assert.rejects(pending, error => error.code === "request_aborted");
  assert.deepEqual(states, []);
});
