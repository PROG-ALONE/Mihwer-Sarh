"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MODULES, buildPayload, createModuleRecordsController, zonedLocalToUtc, utcToZonedLocal, rangeQuery
} = require("./module-records");

const JOURNEY = "00000000-0000-4000-8000-000000000a01";
const ctx = { journeyId: JOURNEY, timeZone: "Asia/Riyadh", today: "2026-11-22", language: "ar" };
const def = key => MODULES.find(item => item.key === key);
const flush = async () => { for (let i = 0; i < 8; i += 1) await new Promise(resolve => setTimeout(resolve, 0)); };

function fakeClient(routes) {
  const calls = [];
  return {
    calls,
    async request(resource, options = {}) {
      const call = { resource, method: options.method || "GET", query: options.query || {}, body: options.body, expectedVersion: options.expectedVersion };
      calls.push(call);
      const handler = routes[`${call.method} ${resource}`];
      if (!handler) throw Object.assign(new Error("unexpected"), { status: 500, code: "unexpected" });
      return handler(call);
    }
  };
}

function fakeForm(draft) {
  const elements = {};
  const boxes = [];
  for (const [name, value] of Object.entries(draft)) {
    if (Array.isArray(value)) for (const day of [0, 1, 2, 3, 4, 5, 6]) boxes.push({ name, value: String(day), checked: value.includes(day) });
    else elements[name] = typeof value === "boolean" ? { checked: value } : { value: String(value) };
  }
  return { elements, querySelectorAll: selector => boxes.filter(box => selector === `[name="${box.name}"]`) };
}

const preferences = { owner_id: "x", version: 1, time_zone: "Asia/Riyadh", health_data_consent_at: null, prayer_recording_consent_at: null };

test("time zone conversion is exact, DST-aware and rejects non-existent local times", () => {
  assert.equal(zonedLocalToUtc("2026-11-22T08:30", "Asia/Riyadh"), "2026-11-22T05:30:00.000Z");
  assert.equal(utcToZonedLocal("2026-11-22T05:30:00.000Z", "Asia/Riyadh"), "2026-11-22T08:30");
  assert.equal(zonedLocalToUtc("2026-07-01T09:00", "America/New_York"), "2026-07-01T13:00:00.000Z");
  assert.equal(zonedLocalToUtc("2026-12-01T09:00", "America/New_York"), "2026-12-01T14:00:00.000Z");
  assert.equal(zonedLocalToUtc("2026-03-08T02:30", "America/New_York"), null);
  assert.equal(zonedLocalToUtc("bad", "Asia/Riyadh"), null);
  assert.deepEqual(rangeQuery(def("meal-logs"), { start: "2026-11-22", end: "2026-11-22" }, "Asia/Riyadh"),
    { range_from: "2026-11-21T21:00:00.000Z", range_to: "2026-11-22T21:00:00.000Z" });
  for (const definition of MODULES.filter(item => item.timeline)) {
    assert.ok(["date", "timestamp"].includes(definition.range), `${definition.key} must declare its API range kind`);
  }
  assert.deepEqual(rangeQuery(def("daily-reflections"), { start: "2026-11-22", end: "2026-11-22" }, "Asia/Riyadh"),
    { range_from: "2026-11-22", range_to: "2026-11-22" });
  assert.deepEqual(rangeQuery(def("sleep-records"), { start: "2026-11-01", end: "2026-11-30" }, "Asia/Riyadh"),
    { range_from: "2026-11-01", range_to: "2026-11-30" });
});

test("payloads never carry identity fields and validate source constraints", () => {
  const created = buildPayload(def("meal-logs"), { occurred_at: "2026-11-22T13:00", meal_type: "lunch", description: "أرز" }, { record: null, ctx });
  assert.deepEqual(created.payload, {
    occurred_at: "2026-11-22T10:00:00.000Z", meal_type: "lunch", description: "أرز", journey_id: JOURNEY, time_zone: "Asia/Riyadh"
  });
  for (const payload of [created.payload]) {
    for (const forbidden of ["owner_id", "user_id", "mihwer_user_id", "id", "version"]) assert.equal(Object.hasOwn(payload, forbidden), false);
  }
  assert.equal(buildPayload(def("goals"), { title: "x", description: "", time_horizon: "short", start_date: "2026-11-22", target_date: "", status: "active" }, { record: null, ctx }).payload.journey_id, undefined);
  assert.equal(buildPayload(def("meal-logs"), { occurred_at: "", meal_type: "lunch", description: "x" }, { record: null, ctx }).error, "occurred_at");
  assert.ok(buildPayload(def("prayer-records"), { local_date: "2026-11-22", prayer_key: "fajr", fard_units: "3", target_fard: "2", before_units: "0", target_before: "0", after_units: "0", target_after: "0" }, { record: null, ctx }).error);
  assert.ok(buildPayload(def("calendar-events"), { title: "x", details: "", start_at: "2026-11-22T10:00", end_at: "2026-11-22T09:00", recurrence_rule: "" }, { record: null, ctx }).error);
  assert.ok(buildPayload(def("notes"), { kind: "link", title: "", body: "x", url: "javascript:alert(1)", note_date: "" }, { record: null, ctx }).error);
  assert.ok(buildPayload(def("financial-accounts"), { name: "x", currency: "sar", opening_balance: "0", status: "active" }, { record: null, ctx }).error);
  const record = { id: "r", version: 4, title: "Old", description: null, start_date: null, target_date: null, status: "active" };
  assert.deepEqual(buildPayload(def("projects"), { title: "New", description: "", start_date: "", target_date: "", status: "active" }, { record, ctx }).payload, { title: "New" });
});

test("lists load from the original resource with journey scope and render escaped server data", async () => {
  const client = fakeClient({
    "GET user-preferences": () => [preferences],
    "GET notes": () => [{ id: "n1", version: 1, kind: "idea", title: "<img src=x onerror=alert(1)>", body: "b", note_date: "2026-11-20" }]
  });
  let renders = 0;
  const controller = createModuleRecordsController({ getClient: () => client, notify: () => { renders += 1; } });
  controller.state.active = "notes";
  assert.match(controller.render(ctx), /جارٍ التحميل/);
  await flush();
  const html = controller.render(ctx);
  assert.ok(renders > 0);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
  const call = client.calls.find(item => item.resource === "notes");
  assert.deepEqual(call.query, { limit: 100, journey_id: JOURNEY });
  assert.equal(client.calls.some(item => item.method !== "GET"), false);
});

test("empty, error and consent states are explicit and never call gated resources", async () => {
  const client = fakeClient({ "GET user-preferences": () => [preferences], "GET projects": () => [] });
  const controller = createModuleRecordsController({ getClient: () => client });
  controller.state.active = "projects";
  controller.render(ctx);
  await flush();
  assert.match(controller.render(ctx), /لا توجد سجلات محفوظة بعد/);
  controller.state.active = "sleep-records";
  await controller.loadList("sleep-records");
  assert.match(controller.render(ctx), /موافقتك على حفظ بيانات الصحة/);
  controller.state.active = "prayer-records";
  await controller.loadList("prayer-records");
  assert.match(controller.render(ctx), /سجل الصلاة اختياري/);
  assert.equal(client.calls.some(item => ["sleep-records", "prayer-records"].includes(item.resource)), false);
  const failing = fakeClient({ "GET user-preferences": () => [preferences], "GET goals": () => { throw Object.assign(new Error("x"), { status: 0, code: "network_error" }); } });
  const offline = createModuleRecordsController({ getClient: () => failing });
  offline.state.active = "goals";
  offline.render(ctx);
  await flush();
  assert.match(offline.render(ctx), /تعذر الاتصال بالخادم/);
});

test("creating shows success only after the server confirms and reloads from the server", async () => {
  const saved = [];
  const client = fakeClient({
    "GET user-preferences": () => [preferences],
    "GET projects": () => saved.slice(),
    "POST projects": call => { const row = { id: "p1", version: 1, ...call.body }; saved.push(row); return [row]; }
  });
  const controller = createModuleRecordsController({ getClient: () => client });
  controller.state.active = "projects";
  controller.render(ctx);
  await flush();
  controller.openEditor("projects", null);
  await controller.save(fakeForm({ title: "مشروع", description: "", start_date: "", target_date: "", status: "active" }));
  const post = client.calls.find(item => item.method === "POST");
  assert.deepEqual(post.body, { title: "مشروع", status: "active", journey_id: JOURNEY });
  assert.equal(controller.state.notice, "أكد الخادم حفظ السجل.");
  assert.equal(controller.state.editing, null);
  assert.equal(client.calls.filter(item => item.method === "GET" && item.resource === "projects").length, 2);
  assert.match(controller.render(ctx), /مشروع/);
});

test("failed saves keep the draft and never claim success", async () => {
  const client = fakeClient({
    "GET user-preferences": () => [preferences],
    "GET projects": () => [],
    "POST projects": () => { throw Object.assign(new Error("x"), { status: 400, code: "database_request_failed" }); }
  });
  const controller = createModuleRecordsController({ getClient: () => client });
  controller.state.active = "projects";
  controller.render(ctx);
  await flush();
  controller.openEditor("projects", null);
  await controller.save(fakeForm({ title: "draft", description: "", start_date: "", target_date: "", status: "active" }));
  assert.equal(controller.state.notice, "");
  assert.equal(controller.state.error, "rejected");
  assert.equal(controller.state.editing.draft.title, "draft");
});

test("start of day keeps one record per day by updating the existing server record", async () => {
  const existing = { id: "d1", version: 2, journey_id: JOURNEY, local_date: "2026-11-22", intention: "old", mood: null, note: null };
  const client = fakeClient({
    "GET user-preferences": () => [preferences],
    "GET daily-reflections": () => [existing],
    "PATCH daily-reflections": call => [{ ...existing, ...call.body, version: 3 }]
  });
  const controller = createModuleRecordsController({ getClient: () => client });
  controller.render(ctx);
  await flush();
  controller.openEditor("daily-reflections", null);
  await controller.save(fakeForm({ local_date: "2026-11-22", intention: "تركيز", mood: "good", note: "" }));
  assert.equal(client.calls.some(item => item.method === "POST"), false);
  const lookup = client.calls.find(item => item.query.range_from === "2026-11-22" && item.query.range_to === "2026-11-22");
  assert.ok(lookup);
  const patch = client.calls.find(item => item.method === "PATCH");
  assert.equal(patch.query.id, "d1");
  assert.equal(patch.expectedVersion, 2);
  assert.deepEqual(patch.body, { intention: "تركيز", mood: "good" });
  assert.match(controller.state.notice, /سجل هذا اليوم موجود/);
});

test("habit schedule edits append a revision and only patch definition fields", async () => {
  const habit = { id: "h1", version: 5, journey_id: JOURNEY, name: "قراءة", start_date: "2026-11-01", end_date: null, frequency: "daily", days: [0, 1, 2, 3, 4, 5, 6], target: 1, unit: "times", status: "active" };
  const client = fakeClient({
    "GET user-preferences": () => [preferences],
    "GET habits": () => [habit],
    "GET habit-revisions": () => [],
    "POST habit-revisions": call => [{ id: "rv", ...call.body }],
    "PATCH habits": call => [{ ...habit, ...call.body, version: 6 }]
  });
  const controller = createModuleRecordsController({ getClient: () => client });
  controller.state.active = "habits";
  controller.render(ctx);
  await flush();
  controller.openEditor("habits", controller.findRecord("habits", "h1"));
  await controller.save(fakeForm({ name: "قراءة يومية", end_date: "", status: "active", frequency: "custom", days: [0, 2, 4], target: "20", unit: "pages", effective_date: "2026-11-23" }));
  const revision = client.calls.find(item => item.method === "POST" && item.resource === "habit-revisions");
  assert.deepEqual(revision.body, { habit_id: "h1", effective_date: "2026-11-23", frequency: "custom", days: [0, 2, 4], target: 20, unit: "pages" });
  const patch = client.calls.find(item => item.method === "PATCH");
  assert.deepEqual(patch.body, { name: "قراءة يومية" });
  assert.equal(patch.expectedVersion, 5);
});

test("appointment time and recurrence edits patch the original event with its version", async () => {
  const event = { id: "e1", version: 3, journey_id: JOURNEY, title: "اجتماع", details: null, start_at: "2026-11-22T06:00:00.000Z", end_at: "2026-11-22T07:00:00.000Z", time_zone: "Asia/Riyadh", all_day_start: null, recurrence_rule: null };
  const client = fakeClient({
    "GET user-preferences": () => [preferences],
    "GET calendar-events": () => [event],
    "PATCH calendar-events": call => [{ ...event, ...call.body, version: 4 }]
  });
  const controller = createModuleRecordsController({ getClient: () => client });
  controller.state.active = "calendar-events";
  controller.render(ctx);
  await flush();
  controller.openEditor("calendar-events", event);
  assert.equal(controller.state.editing.draft.start_at, "2026-11-22T09:00");
  await controller.save(fakeForm({ title: "اجتماع", details: "", start_at: "2026-11-22T10:00", end_at: "2026-11-22T11:30", recurrence_rule: "FREQ=WEEKLY" }));
  const patch = client.calls.find(item => item.method === "PATCH");
  assert.equal(patch.query.id, "e1");
  assert.equal(patch.expectedVersion, 3);
  assert.deepEqual(patch.body, { start_at: "2026-11-22T07:00:00.000Z", end_at: "2026-11-22T08:30:00.000Z", recurrence_rule: "FREQ=WEEKLY" });
});

test("version conflicts reload the source and keep the user's draft", async () => {
  let version = 1;
  const client = fakeClient({
    "GET user-preferences": () => [preferences],
    "GET goals": () => [{ id: "g1", version, title: "هدف", description: null, time_horizon: "short", start_date: "2026-11-01", target_date: null, status: "active" }],
    "PATCH goals": () => { version = 2; throw Object.assign(new Error("x"), { status: 409, code: "version_conflict" }); }
  });
  const controller = createModuleRecordsController({ getClient: () => client });
  controller.state.active = "goals";
  controller.render(ctx);
  await flush();
  controller.openEditor("goals", controller.findRecord("goals", "g1"));
  await controller.save(fakeForm({ title: "هدف جديد", description: "", time_horizon: "short", start_date: "2026-11-01", target_date: "", status: "active" }));
  assert.equal(controller.state.error, "conflict");
  assert.equal(controller.state.editing.draft.title, "هدف جديد");
  assert.equal(controller.state.editing.record.version, 2);
});

test("journey lists module records from their sources and edits at the source", async () => {
  const consented = { ...preferences, health_data_consent_at: "2026-11-01T00:00:00.000Z" };
  const meal = { id: "m1", version: 1, journey_id: JOURNEY, occurred_at: "2026-11-22T10:00:00.000Z", time_zone: "Asia/Riyadh", meal_type: "lunch", description: "غداء" };
  const client = fakeClient({
    "GET user-preferences": () => [consented],
    "GET daily-reflections": () => [],
    "GET study-sessions": () => [],
    "GET activity-sessions": () => [],
    "GET sleep-records": () => [],
    "GET meal-logs": () => [meal],
    "PATCH meal-logs": call => [{ ...meal, ...call.body, version: 2 }]
  });
  const controller = createModuleRecordsController({ getClient: () => client });
  controller.render(ctx);
  controller.renderJourney(ctx, { start: "2026-11-22", end: "2026-11-22" });
  await flush();
  const html = controller.renderJourney(ctx, { start: "2026-11-22", end: "2026-11-22" });
  assert.match(html, /غداء/);
  assert.match(html, /13:00/);
  assert.equal(client.calls.some(item => item.resource === "prayer-records"), false);
  const mealCall = client.calls.find(item => item.resource === "meal-logs");
  assert.deepEqual(mealCall.query, { limit: 100, journey_id: JOURNEY, range_from: "2026-11-21T21:00:00.000Z", range_to: "2026-11-22T21:00:00.000Z" });
  controller.openEditor("meal-logs", controller.findRecord("meal-logs", "m1"));
  await controller.save(fakeForm({ occurred_at: "2026-11-22T13:00", meal_type: "lunch", description: "غداء خفيف" }));
  const patch = client.calls.find(item => item.method === "PATCH");
  assert.equal(patch.resource, "meal-logs");
  assert.equal(patch.query.id, "m1");
  assert.deepEqual(patch.body, { description: "غداء خفيف" });
  assert.equal(client.calls.some(item => item.method === "POST"), false);
});

test("settings create the owner-keyed preferences row once and record consent timestamps", async () => {
  const client = fakeClient({
    "GET user-preferences": () => [],
    "POST user-preferences": call => [{ owner_id: "server", version: 1, ...call.body }]
  });
  const controller = createModuleRecordsController({ getClient: () => client });
  controller.state.active = "user-preferences";
  controller.render(ctx);
  await flush();
  assert.match(controller.render(ctx), /لم تُنشأ إعداداتك/);
  controller.openEditor("user-preferences", null);
  await controller.save(fakeForm({ locale: "ar", time_zone: "Asia/Riyadh", week_starts_on: "0", calendar_kind: "gregorian", asr_method: "", health_data_consent_at: true, prayer_recording_consent_at: false }));
  const post = client.calls.find(item => item.method === "POST");
  assert.equal(Object.hasOwn(post.body, "owner_id"), false);
  assert.equal(post.body.week_starts_on, 0);
  assert.match(post.body.health_data_consent_at, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(post.body.prayer_recording_consent_at, null);
});

test("an identity reset discards in-flight results", async () => {
  let release;
  const client = fakeClient({
    "GET user-preferences": () => [preferences],
    "GET notes": () => new Promise(resolve => { release = () => resolve([{ id: "n1", version: 1, kind: "note", title: "سر", body: "x" }]); })
  });
  const controller = createModuleRecordsController({ getClient: () => client });
  controller.state.active = "notes";
  controller.render(ctx);
  await flush();
  controller.reset();
  release();
  await flush();
  assert.equal(controller.state.lists.size, 0);
});
