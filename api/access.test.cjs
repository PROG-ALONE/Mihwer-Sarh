"use strict";

process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createAccessHandler, activationCodeHash } = require("./_lib/access");
const { createTestIdentityProvider } = require("./_lib/identity");

const environment = {
  MIHWAR_SUPABASE_URL: "https://mihwar.test.invalid",
  MIHWAR_SUPABASE_ANON_KEY: "public-test-key"
};

function request(method, action, body) {
  return {
    method,
    headers: { authorization: "Bearer test-token-user-a" },
    query: { action },
    body
  };
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" }
  });
}

test("access status uses the verified database identity and fixed RPC", async () => {
  let url;
  let options;
  const handler = await createAccessHandler({
    provider: createTestIdentityProvider(),
    env: environment,
    fetchImpl: async (target, init) => {
      url = new URL(target);
      options = init;
      return jsonResponse({ status: "trial_not_started" });
    }
  });
  const result = await handler(request("GET", "status"));
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.data, { status: "trial_not_started" });
  assert.equal(url.pathname, "/rest/v1/rpc/get_own_access_status");
  assert.equal(options.headers.authorization, "Bearer test-database-token-a");
});

test("trial start and code redemption call server-side transactional RPCs", async () => {
  const calls = [];
  const handler = await createAccessHandler({
    provider: createTestIdentityProvider(),
    env: environment,
    fetchImpl: async (url, options) => {
      calls.push({ url: new URL(url), options });
      return jsonResponse({ status: "trial_active" });
    }
  });
  assert.equal((await handler(request("POST", "start", {}))).status, 200);
  assert.equal((await handler(request("POST", "redeem", { code: "ABCD-EFGH-JK23" }))).status, 200);
  assert.equal(calls[0].url.pathname, "/rest/v1/rpc/start_own_trial");
  assert.equal(calls[1].url.pathname, "/rest/v1/rpc/redeem_activation_code");
  const sent = JSON.parse(calls[1].options.body);
  assert.deepEqual(Object.keys(sent), ["p_code_hash"]);
  assert.equal(sent.p_code_hash, activationCodeHash("abcd-efgh-jk23"));
  assert.doesNotMatch(calls[1].options.body, /ABCD-EFGH-JK23/);
});

test("invalid redemption input and unsupported methods never reach the database", async () => {
  let calls = 0;
  const handler = await createAccessHandler({
    provider: createTestIdentityProvider(),
    env: environment,
    fetchImpl: async () => { calls += 1; return jsonResponse({}); }
  });
  assert.equal((await handler(request("POST", "redeem", { code: "too-short" }))).status, 400);
  assert.equal((await handler(request("DELETE", "status", {}))).status, 405);
  assert.equal(calls, 0);
});

test("redemption failures are presented as one non-enumerating rejection", async () => {
  const handler = await createAccessHandler({
    provider: createTestIdentityProvider(),
    env: environment,
    fetchImpl: async () => jsonResponse({ message: "code is disabled" }, 400)
  });
  const result = await handler(request("POST", "redeem", { code: "ABCD-EFGH-JK23" }));
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: { code: "activation_code_rejected" } });
});

test("access endpoint remains closed when the trusted identity adapter is unavailable", async () => {
  const { SarhIdentityProvider } = require("./_lib/identity");
  const handler = await createAccessHandler({ provider: new SarhIdentityProvider() });
  const result = await handler(request("GET", "status"));
  assert.equal(result.status, 503);
  assert.equal(result.body.error.code, "sarh_identity_contract_unavailable");
});
