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

function adminRequest(method, action, body, query = {}) {
  const base = request(method, action, body);
  return { ...base, query: { ...base.query, ...query } };
}

test("admin actions call fixed owner RPCs with validated, server-shaped parameters", async () => {
  const calls = [];
  const handler = await createAccessHandler({
    provider: createTestIdentityProvider(),
    env: environment,
    fetchImpl: async (url, options) => {
      calls.push({ url: new URL(url), body: JSON.parse(options.body) });
      return jsonResponse({ ok: true });
    }
  });
  const userId = "00000000-0000-4000-8000-000000000999";
  assert.equal((await handler(adminRequest("GET", "admin-status"))).status, 200);
  assert.equal((await handler(adminRequest("GET", "admin-codes", undefined, { status: "active", limit: "20" }))).status, 200);
  assert.equal((await handler(adminRequest("POST", "admin-issue-code", { duration_days: 30, max_uses: 5, owner_id: userId }))).status, 200);
  assert.equal((await handler(adminRequest("POST", "admin-grant", { user_id: userId, days: 14, role: "owner" }))).status, 200);
  assert.equal((await handler(adminRequest("POST", "admin-suspend", { user_id: userId, suspended: true }))).status, 200);
  assert.equal((await handler(adminRequest("POST", "admin-issue-discount", {
    label: "Launch", kind: "fixed", amount: 25, currency: "sar", max_uses: 100
  }))).status, 200);
  assert.deepEqual(calls.map((call) => call.url.pathname), [
    "/rest/v1/rpc/get_own_owner_status",
    "/rest/v1/rpc/admin_list_activation_codes",
    "/rest/v1/rpc/admin_issue_activation_code",
    "/rest/v1/rpc/admin_grant_access",
    "/rest/v1/rpc/admin_set_suspension",
    "/rest/v1/rpc/admin_issue_discount_code"
  ]);
  assert.deepEqual(calls[1].body, { p_status: "active", p_limit: 20 });
  assert.deepEqual(calls[2].body, { p_duration_days: 30, p_max_uses: 5, p_valid_until: null });
  assert.deepEqual(calls[3].body, { p_owner: userId, p_days: 14 });
  assert.equal(calls[5].body.p_currency, "SAR");
  assert.equal(calls[5].body.p_per_user_limit, 1);
  for (const call of calls) {
    assert.equal(Object.hasOwn(call.body, "owner_id"), false);
    assert.equal(Object.hasOwn(call.body, "role"), false);
  }
});

test("invalid admin input and wrong methods never reach the database", async () => {
  let calls = 0;
  const handler = await createAccessHandler({
    provider: createTestIdentityProvider(),
    env: environment,
    fetchImpl: async () => { calls += 1; return jsonResponse({}); }
  });
  const rejected = [
    adminRequest("GET", "admin-issue-code"),
    adminRequest("POST", "admin-status", {}),
    adminRequest("POST", "admin-issue-code", { duration_days: 0, max_uses: 1 }),
    adminRequest("POST", "admin-issue-code", { duration_days: 30, max_uses: 1.5 }),
    adminRequest("POST", "admin-grant", { user_id: "not-a-uuid", days: 10 }),
    adminRequest("POST", "admin-suspend", { user_id: "00000000-0000-4000-8000-000000000999", suspended: "yes" }),
    adminRequest("POST", "admin-issue-discount", { label: "x", kind: "free", amount: 10, max_uses: 1 }),
    adminRequest("POST", "admin-issue-discount", { label: "x", kind: "fixed", amount: 10, currency: "RIYAL", max_uses: 1 }),
    adminRequest("POST", "admin-disable-code", "{not json"),
    adminRequest("GET", "admin-codes", undefined, { status: "everything" }),
    adminRequest("GET", "admin-audit", undefined, { limit: "5000" }),
    adminRequest("GET", "__proto__"),
    adminRequest("GET", "constructor")
  ];
  for (const item of rejected) {
    const result = await handler(item);
    assert.ok([400, 405].includes(result.status), `${item.query.action} -> ${result.status}`);
  }
  assert.equal(calls, 0);
});

test("non-owner database refusals are reported as owner_required without details", async () => {
  const handler = await createAccessHandler({
    provider: createTestIdentityProvider(),
    env: environment,
    fetchImpl: async () => jsonResponse({ code: "42501", message: "owner_required" }, 403)
  });
  const result = await handler(adminRequest("GET", "admin-overview"));
  assert.equal(result.status, 403);
  assert.deepEqual(result.body, { error: { code: "owner_required" } });
});

test("admin endpoint stays closed without the trusted Sarh identity contract", async () => {
  const { SarhIdentityProvider } = require("./_lib/identity");
  const handler = await createAccessHandler({ provider: new SarhIdentityProvider() });
  const result = await handler(adminRequest("POST", "admin-issue-code", { duration_days: 30, max_uses: 1 }));
  assert.equal(result.status, 503);
  assert.equal(result.body.error.code, "sarh_identity_contract_unavailable");
});
