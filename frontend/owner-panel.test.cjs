"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createOwnerPanel } = require("./owner-panel");

function fakeClient(handlers) {
  const calls = [];
  return {
    calls,
    async request(resource, options) {
      calls.push({ resource, ...options });
      const handler = handlers[options.query.action];
      if (!handler) throw Object.assign(new Error("unexpected"), { status: 500 });
      return handler(options);
    }
  };
}

const ownerData = {
  "admin-status": () => ({ is_owner: true }),
  "admin-overview": () => [
    { owner_id: "00000000-0000-4000-8000-000000000301", status: "trial_active" },
    { owner_id: "00000000-0000-4000-8000-000000000302", status: "suspended" }
  ],
  "admin-codes": () => [{ id: "00000000-0000-4000-8000-000000000401", status: "active", duration_days: 30, use_count: 0, max_uses: 1 }],
  "admin-discounts": () => [{ id: "00000000-0000-4000-8000-000000000501", label: "<img src=x onerror=alert(1)>", discount_kind: "percent", amount: 20, status: "active", use_count: 0, max_uses: 5 }],
  "admin-redemptions": () => [],
  "admin-audit": () => [{ action: "activation_code_issued", target_id: "00000000-0000-4000-8000-000000000401" }]
};

test("the owner panel stays hidden unless the server confirms owner rights", async () => {
  const client = fakeClient({ "admin-status": () => ({ is_owner: false }) });
  const panel = createOwnerPanel({ client });
  await panel.load();
  assert.equal(panel.render(), "");
  assert.deepEqual(client.calls.map((c) => c.query.action), ["admin-status"]);
});

test("server refusals and missing identity keep the panel hidden", async () => {
  for (const status of [401, 403, 503]) {
    const panel = createOwnerPanel({
      client: fakeClient({ "admin-status": () => { throw Object.assign(new Error("x"), { status, code: "owner_required" }); } })
    });
    await panel.load();
    assert.equal(panel.render(), "", `status ${status}`);
  }
});

test("a verified owner sees access, codes, discounts and audit sections with escaped data", async () => {
  const panel = createOwnerPanel({ client: fakeClient(ownerData), locale: () => "en" });
  await panel.load();
  const html = panel.render();
  for (const label of ["Owner console", "Activation codes", "Discount codes", "Access management", "Redemption log", "Admin audit log"]) {
    assert.match(html, new RegExp(label));
  }
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img src=x/);
  assert.match(html, /data-owner-action="admin-disable-code"/);
  assert.match(html, /data-owner-suspend="false"/);
});

test("an issued code is shown once and cleared after the next action", async () => {
  let issued = 0;
  const client = fakeClient({
    ...ownerData,
    "admin-issue-code": () => ({ id: "00000000-0000-4000-8000-000000000402", code: `ABCDE-FGHJK-LMNPQ-RSTU${++issued}` }),
    "admin-disable-code": () => ({ id: "00000000-0000-4000-8000-000000000402" })
  });
  const panel = createOwnerPanel({ client });
  await panel.load();
  await panel.perform("admin-issue-code", { duration_days: 30, max_uses: 1 });
  assert.match(panel.render(), /data-owner-code>ABCDE-FGHJK-LMNPQ-RSTU1</);
  await panel.perform("admin-disable-code", { code_id: "00000000-0000-4000-8000-000000000402" });
  assert.doesNotMatch(panel.render(), /data-owner-code/);
  const posts = client.calls.filter((c) => c.method === "POST");
  assert.deepEqual(posts.map((c) => c.query.action), ["admin-issue-code", "admin-disable-code"]);
  for (const post of posts) assert.equal(Object.hasOwn(post.body, "owner_id"), false);
});

test("failed admin actions report a safe error and do not claim success", async () => {
  const client = fakeClient({
    ...ownerData,
    "admin-suspend": () => { throw Object.assign(new Error("x"), { status: 400, code: "cannot_suspend_self" }); }
  });
  const panel = createOwnerPanel({ client, locale: () => "en" });
  await panel.load();
  await panel.perform("admin-suspend", { user_id: "00000000-0000-4000-8000-000000000301", suspended: true });
  const html = panel.render();
  assert.match(html, /The owner account cannot be suspended/);
  assert.doesNotMatch(html, /Saved on the server/);
});
