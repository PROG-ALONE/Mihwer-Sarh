"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MODULES, buildPayload, createModuleRecordsController, createModuleRecordsRepository,
  zonedLocalToUtc, utcToZonedLocal, rangeQuery, nextOccurrence
} = require("./module-records");

const JOURNEY = "00000000-0000-4000-8000-000000000a01";
const ctx = { journeyId: JOURNEY, timeZone: "Asia/Riyadh", today: "2026-11-22", language: "ar" };
const def = key => MODULES.find(item => item.key === key);
const flush = async () => { for (let i = 0; i < 20; i += 1) await new Promise(resolve => setTimeout(resolve, 0)); };

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
  const habitRecord = buildPayload(def("habit-records"), {
    habit_id: "00000000-0000-4000-8000-000000000a41", local_date: "2026-11-22", status: "completed", amount: "1"
  }, { record: null, ctx });
  assert.equal(habitRecord.payload.journey_id, undefined);
  assert.equal(habitRecord.payload.habit_id, "00000000-0000-4000-8000-000000000a41");
  assert.equal(buildPayload(def("meal-logs"), { occurred_at: "", meal_type: "lunch", description: "x" }, { record: null, ctx }).error, "occurred_at");
  assert.ok(buildPayload(def("prayer-records"), { local_date: "2026-11-22", prayer_key: "fajr", fard_units: "3", target_fard: "2", before_units: "0", target_before: "0", after_units: "0", target_after: "0" }, { record: null, ctx }).error);
  assert.ok(buildPayload(def("calendar-events"), { title: "x", details: "", start_at: "2026-11-22T10:00", end_at: "2026-11-22T09:00", recurrence_rule: "" }, { record: null, ctx }).error);
  assert.ok(buildPayload(def("notes"), { kind: "link", title: "", body: "x", url: "javascript:alert(1)", note_date: "" }, { record: null, ctx }).error);
  assert.ok(buildPayload(def("financial-accounts"), { name: "x", currency: "sar", opening_balance: "0", status: "active" }, { record: null, ctx }).error);
  const record = { id: "r", version: 4, title: "Old", description: null, start_date: null, target_date: null, status: "active" };
  assert.deepEqual(buildPayload(def("projects"), { title: "New", description: "", start_date: "", target_date: "", status: "active" }, { record, ctx }).payload, { title: "New" });
  assert.deepEqual(buildPayload(def("subscription-occurrences"), {
    subscription_id: "s1", period_start: "2026-11-01", due_date: "2026-11-22", status: "paid"
  }, { record: { id: "o1", version: 1, subscription_id: "s1", period_start: "2026-11-01", due_date: "2026-11-22", status: "due" }, ctx }).payload,
  { status: "paid" });
});

test("subscription recurrence advances calendar dates without time-zone drift", () => {
  assert.equal(nextOccurrence("2026-11-22", "weekly"), "2026-11-29");
  assert.equal(nextOccurrence("2026-01-31", "monthly"), "2026-02-28");
  assert.equal(nextOccurrence("2026-11-30", "quarterly"), "2027-02-28");
  assert.equal(nextOccurrence("2024-02-29", "yearly"), "2025-02-28");
  assert.equal(nextOccurrence("not-a-date", "monthly"), "");
  assert.equal(nextOccurrence("2026-11-22", "unknown"), "");
});

test("year-range module reads continue through all UUID-ordered pages", async () => {
  const makeId = value => `00000000-0000-4000-8000-${value.toString(16).padStart(12, "0")}`;
  const client = fakeClient({
    "GET notes": call => {
      if (call.query.before_id) return [{ id: makeId(1), kind: "note", body: "old" }];
      return Array.from({ length: 100 }, (_, index) => {
        const n = 101 - index;
        return { id: makeId(n), kind: "note", body: String(n) };
      });
    }
  });
  const repository = createModuleRecordsRepository(() => client);
  const rows = await repository.list(def("notes"), { range: { range_from: "2026-01-01", range_to: "2026-12-31" } });
  assert.equal(rows.length, 101);
  assert.equal(client.calls.length, 2);
  assert.equal(client.calls[1].query.before_id, makeId(2));
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
  assert.deepEqual(call.query, { limit: 100 });
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
  assert.deepEqual(post.body, { title: "مشروع", status: "active" });
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
    "GET habits": () => [],
    "GET habit-revisions": () => [],
    "GET habit-records": () => [],
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
  const mealCall = client.calls.find(item => item.resource === "meal-logs" &&
    item.query.range_from === "2026-11-21T21:00:00.000Z");
  assert.deepEqual(mealCall.query, { limit: 100, journey_id: JOURNEY, range_from: "2026-11-21T21:00:00.000Z", range_to: "2026-11-22T21:00:00.000Z" });
  controller.openEditor("meal-logs", controller.findRecord("meal-logs", "m1"));
  await controller.save(fakeForm({ occurred_at: "2026-11-22T13:00", meal_type: "lunch", description: "غداء خفيف" }));
  const patch = client.calls.find(item => item.method === "PATCH");
  assert.equal(patch.resource, "meal-logs");
  assert.equal(patch.query.id, "m1");
  assert.deepEqual(patch.body, { description: "غداء خفيف" });
  assert.equal(client.calls.some(item => item.method === "POST"), false);
});

test("journey renders habit records from their source and edits the original record", async () => {
  const habit = { id: "00000000-0000-4000-8000-000000000a41", name: "قراءة", version: 1 };
  const record = {
    id: "00000000-0000-4000-8000-000000000a42", habit_id: habit.id,
    local_date: "2026-11-22", status: "partial", amount: 0.5, version: 1
  };
  const routes = Object.fromEntries(MODULES.filter(item => item.timeline)
    .map(item => [`GET ${item.resource}`, () => []]));
  Object.assign(routes, {
    "GET user-preferences": () => [preferences],
    "GET habits": () => [habit],
    "GET habit-revisions": () => [],
    "GET habit-records": () => [record],
    "PATCH habit-records": call => [{ ...record, ...call.body, version: 2 }]
  });
  const client = fakeClient(routes);
  const controller = createModuleRecordsController({ getClient: () => client });
  const range = { start: "2026-11-22", end: "2026-11-22" };
  controller.renderJourney(ctx, range);
  await flush();
  const html = controller.renderJourney(ctx, range);
  assert.match(html, /قراءة/);
  assert.match(html, /partial/);
  controller.openEditor("habit-records", record);
  assert.match(controller.renderJourney(ctx, range), /data-module-form="habit-records"/);
  await controller.save(fakeForm({ habit_id: habit.id, local_date: record.local_date, status: "completed", amount: "1" }));
  const patch = client.calls.find(item => item.method === "PATCH");
  assert.equal(patch.resource, "habit-records");
  assert.deepEqual(patch.body, { status: "completed", amount: 1 });
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

test("legacy shopping page loads lists and items from their original resources", async () => {
  const client = fakeClient({
    "GET user-preferences": () => [preferences],
    "GET shopping-lists": () => [{ id: "list1", title: "Groceries", status: "active", version: 1 }],
    "GET shopping-items": () => [{ id: "item1", list_id: "list1", name: "Milk", quantity: "2", checked_at: null, archived_at: null, version: 1 }]
  });
  const controller = createModuleRecordsController({ getClient: () => client });
  const keys = ["shopping-lists", "shopping-items"];
  controller.render(ctx, keys);
  await flush();
  controller.state.active = "shopping-items";
  controller.render(ctx, keys);
  await flush();
  const html = controller.render(ctx, keys);
  assert.match(html, /Groceries/);
  assert.match(html, /Milk/);
  assert.match(html, /data-module-complete="shopping-items"/);
  assert.deepEqual(client.calls.filter(call => call.method === "GET").map(call => call.resource).sort(),
    ["shopping-items", "shopping-lists", "user-preferences"]);
});

test("goal progress is derived from its persisted project and milestone records", async () => {
  const project = { id: "00000000-0000-4000-8000-000000000a31", title: "مشروع", status: "active", version: 1 };
  const client = fakeClient({
    "GET user-preferences": () => [preferences],
    "GET projects": () => [project],
    "GET goals": () => [{ id: "00000000-0000-4000-8000-000000000a32", title: "هدف", status: "active", version: 1 }],
    "GET project-milestones": () => [
    { id: "m1", project_id: project.id, title: "منجز", status: "completed", version: 1 },
    { id: "m2", project_id: project.id, title: "قادم", status: "pending", version: 1 }
    ],
    "GET goal-project-links": () => [{
    goal_id: "00000000-0000-4000-8000-000000000a32", project_id: project.id
    }]
  });
  const controller = createModuleRecordsController({ getClient: () => client });
  const keys = ["projects", "goals", "project-milestones", "goal-project-links"];
  controller.render(ctx, keys);
  await flush();
  assert.match(controller.render(ctx, keys), /1\/2 · 50%/);
});

test("notes can be created, edited, archived and recovered from the source", async () => {
  const rows = [];
  const attachmentId = "00000000-0000-4000-8000-000000000a12";
  const client = fakeClient({
    "GET user-preferences": () => [preferences],
    "GET notes": () => rows.filter(row => !row.deleted_at).map(row => ({ ...row })),
    "GET attachments": () => [{ id: attachmentId, content_type: "application/pdf", byte_size: 1024, state: "ready" }],
    "GET attachment-links": () => [{ attachment_id: attachmentId, note_id: "00000000-0000-4000-8000-000000000a11" }],
    "POST notes": call => {
      const row = { id: "00000000-0000-4000-8000-000000000a11", version: 1, ...call.body };
      rows.push(row);
      return [row];
    },
    "PATCH notes": call => {
      const row = rows.find(item => item.id === call.query.id);
      Object.assign(row, call.body, { version: row.version + 1 });
      return [row];
    }
  });
  const handlers = {};
  const controller = createModuleRecordsController({ getClient: () => client });
  const keys = ["notes"];
  controller.bind({ addEventListener(name, handler) { handlers[name] = handler; } });
  controller.render(ctx, keys);
  await flush();
  controller.openEditor("notes", null);
  await controller.save(fakeForm({ kind: "note", title: "مسودة", body: "النص", url: "", note_date: "" }));
  assert.equal(rows[0].title, "مسودة");
  assert.match(controller.render(ctx, keys), /أكد الخادم حفظ السجل/);
  assert.match(controller.render(ctx, keys), /المرفقات الخاصة/);
  assert.match(controller.render(ctx, keys), /application\/pdf/);
  controller.openEditor("notes", rows[0]);
  await controller.save(fakeForm({ kind: "note", title: "مراجعة", body: "النص المعدل", url: "", note_date: "" }));
  assert.equal(rows[0].title, "مراجعة");
  const action = {
    dataset: { moduleArchive: "notes", recordId: rows[0].id },
    matches: selector => selector === "[data-module-archive]",
    closest: selector => selector === "[data-module-records]" ? {} : action
  };
  handlers.click({ target: { closest: () => action } });
  await flush();
  assert.ok(rows[0].deleted_at);
  assert.doesNotMatch(controller.render(ctx, keys), /مراجعة/);
  const reloaded = createModuleRecordsController({ getClient: () => client });
  reloaded.render(ctx, keys);
  await flush();
  assert.doesNotMatch(reloaded.render(ctx, keys), /مراجعة/);
});

test("shopping items preserve list ownership, completion and archive across reload", async () => {
  const listId = "00000000-0000-4000-8000-000000000a21";
  const rows = [];
  const client = fakeClient({
    "GET user-preferences": () => [preferences],
    "GET shopping-lists": () => [{ id: listId, title: "البقالة", status: "active", version: 1 }],
    "GET shopping-items": () => rows.filter(row => !row.archived_at).map(row => ({ ...row })),
    "POST shopping-items": call => {
      const row = { id: "00000000-0000-4000-8000-000000000a22", version: 1, ...call.body };
      rows.push(row);
      return [row];
    },
    "PATCH shopping-items": call => {
      const row = rows.find(item => item.id === call.query.id);
      Object.assign(row, call.body, { version: row.version + 1 });
      return [row];
    }
  });
  const handlers = {};
  const keys = ["shopping-lists", "shopping-items"];
  const controller = createModuleRecordsController({ getClient: () => client });
  controller.bind({ addEventListener(name, handler) { handlers[name] = handler; } });
  controller.render(ctx, keys);
  await flush();
  controller.state.active = "shopping-items";
  controller.render(ctx, keys);
  await flush();
  controller.openEditor("shopping-items", null);
  await controller.save(fakeForm({ list_id: listId, name: "خبز", quantity: "2" }));
  assert.equal(rows[0].list_id, listId);
  assert.equal(rows[0].name, "خبز");
  const click = (attribute, value) => {
    const action = {
      dataset: { [attribute]: "shopping-items", recordId: value },
      matches: selector => selector === `[data-${attribute.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}]`,
      closest: selector => selector === "[data-module-records]" ? {} : action
    };
    handlers.click({ target: { closest: () => action } });
  };
  click("moduleComplete", rows[0].id);
  await flush();
  assert.ok(rows[0].checked_at);
  click("moduleArchive", rows[0].id);
  await flush();
  assert.ok(rows[0].archived_at);
  const reloaded = createModuleRecordsController({ getClient: () => client });
  reloaded.render(ctx, keys);
  await flush();
  reloaded.state.active = "shopping-items";
  reloaded.render(ctx, keys);
  await flush();
  assert.doesNotMatch(reloaded.render(ctx, keys), /خبز/);
});

test("subscriptions generate one source occurrence and do not write transactions", async () => {
  const subscription = {
    id: "sub1", name: "Cloud service", next_due_date: "2026-11-22", cadence: "monthly",
    amount: 10, currency: "SAR", status: "active", version: 1
  };
  const calls = [];
  const client = fakeClient({
    "GET user-preferences": () => [preferences],
    "GET subscriptions": () => [subscription],
    "GET subscription-occurrences": () => [],
    "PATCH subscriptions": call => {
      Object.assign(subscription, call.body, { version: subscription.version + 1 });
      return [subscription];
    },
    "POST subscription-occurrences": call => { calls.push(call); return [{ id: "occ1", subscription_id: "sub1", period_start: "2026-11-01", due_date: "2026-11-22", status: "due", version: 1 }]; }
  });
  const handlers = {};
  const controller = createModuleRecordsController({ getClient: () => client });
  controller.bind({ addEventListener(name, handler) { handlers[name] = handler; } });
  controller.render(ctx, ["subscriptions", "subscription-occurrences"]);
  await flush();
  controller.openEditor("subscriptions", subscription);
  await controller.save(fakeForm({
    name: "Cloud service", amount: "10", currency: "SAR", cadence: "yearly",
    next_due_date: "2026-11-22", status: "active"
  }));
  assert.equal(subscription.cadence, "yearly");
  assert.equal(client.calls.find(call => call.method === "PATCH").resource, "subscriptions");
  const action = {
    dataset: { moduleCreateOccurrence: "sub1" },
    matches: selector => selector === "[data-module-create-occurrence]",
    closest: selector => selector === "[data-module-records]" ? {} : action
  };
  handlers.click({ target: { closest: () => action } });
  await flush();
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body, { subscription_id: "sub1" });
  assert.equal(client.calls.some(call => call.resource === "financial-transactions"), false);
  assert.match(controller.render(ctx, ["subscriptions", "subscription-occurrences"]), /حُفظ الاستحقاق على الخادم/);
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
