"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { ApiError, createApiClient } = require("./api-client");

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
