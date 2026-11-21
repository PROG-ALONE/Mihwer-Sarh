"use strict";

process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const {
  IdentityError,
  SarhIdentityProvider,
  createTestIdentityProvider,
  getAuthenticatedUser,
  requirePermission,
  resolveMihwarProfile
} = require("./_lib/identity");
const { RESOURCES, createHandler } = require("./_lib/mihwar-data");

const userA = "00000000-0000-4000-8000-000000000001";

function request(method, resource, { token = "test-token-user-a", query = {}, body } = {}) {
  return {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    query: { resource, ...query },
    body
  };
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" }
  });
}

test("Sarh identity adapter fails closed until an approved contract exists", async () => {
  const provider = new SarhIdentityProvider();
  await assert.rejects(provider.verifyIdentity("anything"), (error) =>
    error instanceof IdentityError &&
    error.code === "sarh_identity_contract_unavailable" &&
    error.status === 503
  );
});

test("test identities are not selectable outside test mode", () => {
  const original = process.env.NODE_ENV;
  const originalVercel = process.env.VERCEL;
  process.env.NODE_ENV = "production";
  try {
    assert.throws(() => createTestIdentityProvider(), /test_identity_provider_is_test_only/);
  } finally {
    process.env.NODE_ENV = original;
  }

  process.env.NODE_ENV = "test";
  process.env.VERCEL = "1";
  try {
    assert.throws(() => createTestIdentityProvider(), /test_identity_provider_is_test_only/);
  } finally {
    process.env.NODE_ENV = original;
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
  }
});

test("identity uses only verified provider output, not caller-supplied user ids", async () => {
  const provider = createTestIdentityProvider();
  const identity = await getAuthenticatedUser({
    headers: { authorization: "Bearer test-token-user-a", "x-user-id": "arbitrary" }
  }, provider);
  assert.equal(identity.mihwarUserId, userA);
  assert.equal(identity.subject, "user-a");
  assert.equal(identity.databaseAccessToken, "test-database-token-a");
});

test("authentication and permission checks reject missing credentials and grants", async () => {
  const provider = createTestIdentityProvider();
  await assert.rejects(getAuthenticatedUser({ headers: {} }, provider), (error) => error.code === "unauthenticated");
  const identity = await getAuthenticatedUser({ headers: { authorization: "Bearer test-token-user-a" } }, provider);
  assert.throws(() => requirePermission(identity, "admin"), (error) => error.code === "forbidden");
});

test("profile lookup uses the database token and fails unless an active matching profile exists", async () => {
  const provider = createTestIdentityProvider();
  const identity = await getAuthenticatedUser({ headers: { authorization: "Bearer test-token-user-a" } }, provider);
  let calledUrl;
  let calledHeaders;
  const profile = await resolveMihwarProfile(identity, {
    MIHWAR_SUPABASE_URL: "https://mihwar.test.invalid",
    MIHWAR_SUPABASE_ANON_KEY: "public-test-key"
  }, async (url, options) => {
    calledUrl = new URL(url);
    calledHeaders = options.headers;
    return jsonResponse([{ id: userA, status: "active" }]);
  });
  assert.deepEqual(profile, { id: userA, status: "active" });
  assert.equal(calledUrl.searchParams.get("id"), `eq.${userA}`);
  assert.equal(calledHeaders.authorization, "Bearer test-database-token-a");
  assert.equal(calledHeaders.apikey, "public-test-key");

  await assert.rejects(resolveMihwarProfile(identity, {
    MIHWAR_SUPABASE_URL: "https://mihwar.test.invalid",
    MIHWAR_SUPABASE_ANON_KEY: "public-test-key"
  }, async () => jsonResponse([{ id: userA, status: "disabled" }])), (error) => error.code === "profile_unavailable");
});

test("resource API scopes reads to the verified profile and bounds pagination", async () => {
  const provider = createTestIdentityProvider();
  let requestUrl;
  let requestOptions;
  const handler = await createHandler({
    provider,
    profileResolver: async () => ({ id: userA, status: "active" }),
    env: { MIHWAR_SUPABASE_URL: "https://mihwar.test.invalid", MIHWAR_SUPABASE_ANON_KEY: "public-test-key" },
    fetchImpl: async (url, options) => {
      requestUrl = new URL(url);
      requestOptions = options;
      return jsonResponse([{ id: "00000000-0000-4000-8000-000000000003", owner_id: userA }]);
    }
  });
  const result = await handler(request("GET", "tasks", { query: { limit: "25" } }));
  assert.equal(result.status, 200);
  assert.equal(requestUrl.pathname, "/rest/v1/tasks");
  assert.equal(requestUrl.searchParams.get("owner_id"), `eq.${userA}`);
  assert.equal(requestUrl.searchParams.get("limit"), "25");
  assert.equal(requestOptions.headers.authorization, "Bearer test-database-token-a");

  const invalid = await handler(request("GET", "tasks", { query: { limit: "5000" } }));
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error.code, "invalid_limit");
});

test("task cursor and date filters remain owner-scoped and reject malformed ranges", async () => {
  let requestUrl;
  const handler = await createHandler({
    provider: createTestIdentityProvider(),
    profileResolver: async () => ({ id: userA, status: "active" }),
    env: { MIHWAR_SUPABASE_URL: "https://mihwar.test.invalid", MIHWAR_SUPABASE_ANON_KEY: "public-test-key" },
    fetchImpl: async (url) => {
      requestUrl = new URL(url);
      return jsonResponse([]);
    }
  });
  const before = "00000000-0000-4000-8000-000000000003";
  const result = await handler(request("GET", "tasks", { query: {
    before_id: before, start_date_from: "2026-11-01", start_date_to: "2026-11-30"
  } }));
  assert.equal(result.status, 200);
  assert.equal(requestUrl.searchParams.get("owner_id"), `eq.${userA}`);
  assert.equal(requestUrl.searchParams.get("id"), `lt.${before}`);
  assert.equal(requestUrl.searchParams.get("order"), "id.desc");
  assert.equal(requestUrl.searchParams.get("and"), "(start_date.gte.2026-11-01,start_date.lte.2026-11-30)");

  for (const query of [
    { before_id: "bad" },
    { before_id: "" },
    { id: before, before_id: before },
    { start_date_from: "2026-02-31", start_date_to: "2026-03-01" },
    { start_date_from: "2026-11-30", start_date_to: "2026-11-01" },
    { start_date_from: "2026-11-01" }
  ]) {
    assert.equal((await handler(request("GET", "tasks", { query }))).status, 400);
  }
  assert.equal((await handler(request("GET", "user-preferences", { query: { before_id: before } }))).status, 400);
  assert.equal((await handler(request("GET", "notes", { query: {
    start_date_from: "2026-11-01", start_date_to: "2026-11-30"
  } }))).status, 400);
});

test("daily habit and calendar windows are validated and remain owner-scoped", async () => {
  let requestUrl;
  const handler = await createHandler({
    provider: createTestIdentityProvider(),
    profileResolver: async () => ({ id: userA, status: "active" }),
    env: { MIHWAR_SUPABASE_URL: "https://mihwar.test.invalid", MIHWAR_SUPABASE_ANON_KEY: "public-test-key" },
    fetchImpl: async (url) => {
      requestUrl = new URL(url);
      return jsonResponse([]);
    }
  });

  const journeyId = "00000000-0000-4000-8000-000000000011";
  const habitRange = { journey_id: journeyId, local_date_from: "2026-10-23", local_date_to: "2026-11-21" };
  assert.equal((await handler(request("GET", "habit-records", { query: habitRange }))).status, 200);
  assert.equal(requestUrl.searchParams.get("owner_id"), `eq.${userA}`);
  assert.equal(requestUrl.searchParams.get("and"), "(local_date.gte.2026-10-23,local_date.lte.2026-11-21)");
  assert.equal(requestUrl.searchParams.get("select"), "*,habits!inner(journey_id)");
  assert.equal(requestUrl.searchParams.get("habits.journey_id"), `eq.${journeyId}`);

  assert.equal((await handler(request("GET", "habit-revisions", { query: {
    journey_id: journeyId, effective_date_to: "2026-11-21"
  } }))).status, 200);
  assert.equal(requestUrl.searchParams.get("effective_date"), "lte.2026-11-21");
  assert.equal(requestUrl.searchParams.get("habits.journey_id"), `eq.${journeyId}`);

  const eventRange = { overlap_from: "2026-11-20T00:00:00.000Z", overlap_to: "2026-11-23T00:00:00.000Z" };
  assert.equal((await handler(request("GET", "calendar-events", { query: eventRange }))).status, 200);
  assert.equal(requestUrl.searchParams.get("and"),
    "(start_at.lt.2026-11-23T00:00:00.000Z,end_at.gt.2026-11-20T00:00:00.000Z)");

  for (const [resource, query] of [
    ["habit-records", { journey_id: "" }],
    ["habit-records", { journey_id: [journeyId, journeyId] }],
    ["habit-records", { ...habitRange, local_date_from: ["2026-10-23", "2026-10-24"] }],
    ["habit-records", { local_date_from: "2026-11-22", local_date_to: "2026-11-21" }],
    ["habit-records", { local_date_from: "2025-01-01", local_date_to: "2026-11-21" }],
    ["habit-revisions", { effective_date_to: "2026-02-31" }],
    ["habits", { effective_date_to: "2026-11-21" }],
    ["tasks", habitRange],
    ["calendar-events", { overlap_from: "2026-02-31T00:00:00.000Z", overlap_to: eventRange.overlap_to }],
    ["calendar-events", { overlap_from: eventRange.overlap_to, overlap_to: eventRange.overlap_from }],
    ["calendar-events", { overlap_from: "2026-01-01T00:00:00.000Z", overlap_to: "2026-02-01T00:00:00.000Z" }],
    ["habits", eventRange]
  ]) {
    assert.equal((await handler(request("GET", resource, { query }))).status, 400);
  }
});

test("habit progress updates only allowed fields with owner and version constraints", async () => {
  const id = "00000000-0000-4000-8000-000000000063";
  let url;
  let sent;
  let calls = 0;
  const handler = await createHandler({
    provider: createTestIdentityProvider(),
    profileResolver: async () => ({ id: userA, status: "active" }),
    env: { MIHWAR_SUPABASE_URL: "https://mihwar.test.invalid", MIHWAR_SUPABASE_ANON_KEY: "public-test-key" },
    fetchImpl: async (target, options) => {
      calls += 1;
      url = new URL(target);
      sent = JSON.parse(options.body);
      return jsonResponse([{ id, version: 2 }]);
    }
  });
  const query = { id, expected_version: "1" };
  assert.equal((await handler(request("PATCH", "habit-records", { query, body: { status: "completed" } }))).status, 200);
  assert.equal(url.searchParams.get("owner_id"), `eq.${userA}`);
  assert.equal(url.searchParams.get("id"), `eq.${id}`);
  assert.equal(url.searchParams.get("version"), "eq.1");
  assert.deepEqual(sent, { status: "completed" });
  for (const body of [
    { habit_id: "00000000-0000-4000-8000-000000000030" },
    { local_date: "2026-11-20" },
    { recorded_at: "2026-11-20T00:00:00Z" }
  ]) {
    assert.equal((await handler(request("PATCH", "habit-records", { query, body }))).status, 400);
  }
  assert.equal(calls, 1);
});

test("duplicate daily habit records return a conflict instead of a second success", async () => {
  const handler = await createHandler({
    provider: createTestIdentityProvider(),
    profileResolver: async () => ({ id: userA, status: "active" }),
    env: { MIHWAR_SUPABASE_URL: "https://mihwar.test.invalid", MIHWAR_SUPABASE_ANON_KEY: "public-test-key" },
    fetchImpl: async () => jsonResponse({ code: "23505" }, 409)
  });
  const result = await handler(request("POST", "habit-records", { body: {
    habit_id: "00000000-0000-4000-8000-000000000030",
    local_date: "2026-11-21",
    status: "completed"
  } }));
  assert.equal(result.status, 409);
  assert.equal(result.body.error.code, "version_conflict");
});

test("create forces the verified owner and rejects attempts to supply ownership", async () => {
  const provider = createTestIdentityProvider();
  let posted;
  const handler = await createHandler({
    provider,
    profileResolver: async () => ({ id: userA, status: "active" }),
    env: { MIHWAR_SUPABASE_URL: "https://mihwar.test.invalid", MIHWAR_SUPABASE_ANON_KEY: "public-test-key" },
    fetchImpl: async (_url, options) => {
      posted = JSON.parse(options.body);
      return jsonResponse([posted], 201);
    }
  });
  const created = await handler(request("POST", "notes", { body: { kind: "note", title: "Test", body: "Body" } }));
  assert.equal(created.status, 201);
  assert.equal(posted.owner_id, userA);

  const spoofed = await handler(request("POST", "notes", { body: { owner_id: "00000000-0000-4000-8000-000000000002", kind: "note", body: "x" } }));
  assert.equal(spoofed.status, 400);
  assert.equal(spoofed.body.error.code, "owner_fields_are_server_managed");
  for (const key of ["user_id", "mihwer_user_id", "mihwar_user_id"]) {
    const forged = await handler(request("POST", "notes", { body: { [key]: userA, kind: "note", body: "x" } }));
    assert.equal(forged.status, 400);
    assert.equal(forged.body.error.code, "owner_fields_are_server_managed");
  }
});

test("updates require an expected version and report conflicts without overwriting", async () => {
  const provider = createTestIdentityProvider();
  let requestUrl;
  const handler = await createHandler({
    provider,
    profileResolver: async () => ({ id: userA, status: "active" }),
    env: { MIHWAR_SUPABASE_URL: "https://mihwar.test.invalid", MIHWAR_SUPABASE_ANON_KEY: "public-test-key" },
    fetchImpl: async (url) => {
      requestUrl = new URL(url);
      return jsonResponse([]);
    }
  });
  const result = await handler(request("PATCH", "tasks", {
    query: { id: "00000000-0000-4000-8000-000000000003", expected_version: "2" },
    body: { title: "Updated" }
  }));
  assert.equal(result.status, 409);
  assert.equal(result.body.error.code, "version_conflict");
  assert.equal(requestUrl.searchParams.get("version"), "eq.2");
});

test("owner-keyed preferences can be version-updated without a client-selected profile id", async () => {
  const provider = createTestIdentityProvider();
  let requestUrl;
  const handler = await createHandler({
    provider,
    profileResolver: async () => ({ id: userA, status: "active" }),
    env: { MIHWAR_SUPABASE_URL: "https://mihwar.test.invalid", MIHWAR_SUPABASE_ANON_KEY: "public-test-key" },
    fetchImpl: async (url) => {
      requestUrl = new URL(url);
      return jsonResponse([{ owner_id: userA, locale: "ar", version: 3 }]);
    }
  });
  const result = await handler(request("PATCH", "user-preferences", {
    query: { expected_version: "2" },
    body: { locale: "ar" }
  }));
  assert.equal(result.status, 200);
  assert.equal(requestUrl.searchParams.get("owner_id"), `eq.${userA}`);
  assert.equal(requestUrl.searchParams.get("version"), "eq.2");
  assert.equal(requestUrl.searchParams.has("id"), false);
});

test("sensitive-data deletion uses fixed owner-derived RPCs only", async () => {
  const provider = createTestIdentityProvider();
  let requestUrl;
  let requestOptions;
  const handler = await createHandler({
    provider,
    profileResolver: async () => ({ id: userA, status: "active" }),
    env: { MIHWAR_SUPABASE_URL: "https://mihwar.test.invalid", MIHWAR_SUPABASE_ANON_KEY: "public-test-key" },
    fetchImpl: async (url, options) => {
      requestUrl = new URL(url);
      requestOptions = options;
      return jsonResponse(2);
    }
  });
  const result = await handler(request("POST", "delete-prayer-records", { body: { owner_id: "spoof" } }));
  assert.equal(result.status, 200);
  assert.equal(requestUrl.pathname, "/rest/v1/rpc/delete_own_prayer_records");
  assert.equal(requestOptions.body, "{}");
  assert.equal((await handler(request("GET", "delete-prayer-records"))).status, 405);
});

test("financial writes, attachment writes, hard deletes, and unknown resources are denied", async () => {
  const provider = createTestIdentityProvider();
  const handler = await createHandler({
    provider,
    profileResolver: async () => ({ id: userA, status: "active" }),
    env: { MIHWAR_SUPABASE_URL: "https://mihwar.test.invalid", MIHWAR_SUPABASE_ANON_KEY: "public-test-key" },
    fetchImpl: async () => jsonResponse([])
  });
  assert.equal((await handler(request("POST", "financial-transactions", { body: { amount: 10 } }))).status, 403);
  assert.equal((await handler(request("POST", "attachments", { body: { object_key: "x" } }))).status, 403);
  assert.equal((await handler(request("DELETE", "tasks"))).status, 405);
  assert.equal((await handler(request("GET", "arbitrary-table"))).status, 404);
  assert.equal(RESOURCES["financial-transactions"].mode, "read-only");
});

test("production handler does not allow access through the Sarh adapter placeholder", async () => {
  const handler = await createHandler({
    provider: new SarhIdentityProvider(),
    profileResolver: async () => ({ id: userA, status: "active" })
  });
  const result = await handler(request("GET", "tasks"));
  assert.equal(result.status, 503);
  assert.equal(result.body.error.code, "sarh_identity_contract_unavailable");
});

test("initial migration declares owner-scoped tables and fail-closed RLS guards", () => {
  const migration = readFileSync(join(__dirname, "../supabase/migrations/20261120210000_mihwar_core.sql"), "utf8");
  const declarations = [...migration.matchAll(/create table public\.([a-z_]+)\s*\(([\s\S]*?)\n\);/gi)];
  assert.equal(declarations.length, 47);
  for (const [, table, definition] of declarations) {
    if (table === "mihwer_users") {
      assert.match(definition, /\bid\s+uuid\s+primary key\b/);
    } else {
      assert.match(definition, /\bowner_id\s+uuid\b/, `${table} must carry an owner principal`);
    }
  }
  assert.match(migration, /auth\.jwt\(\)\s*->>\s*'mihwer_user_id'/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /force row level security/);
  assert.match(migration, /return null;/);
  assert.match(migration, /grant select, insert, update, delete on table public\.prayer_records/);
  assert.match(migration, /prayer_recording_consent_at is not null/);
});

test("trial access migration gates protected rows and stores only activation hashes", () => {
  const migration = readFileSync(join(__dirname, "../supabase/migrations/20261121210000_trial_access.sql"), "utf8");
  assert.match(migration, /trial_started_at\s*\+\s*interval '72 hours'/);
  assert.match(migration, /mihwer_private\.access_status\(principal\) not in \('trial_active', 'activated'\)/);
  assert.match(migration, /code_hash bytea not null unique check \(octet_length\(code_hash\) = 32\)/);
  assert.match(migration, /update public\.activation_codes c[\s\S]*c\.use_count < c\.max_uses/);
  assert.match(migration, /max_uses/);
  assert.match(migration, /revoke all on table public\.user_access, public\.activation_codes, public\.activation_redemptions/);
  assert.doesNotMatch(migration, /\bcode\s+text\b/i);
});
