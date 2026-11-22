"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { createApiClient } = require("./api-client");
const { MODULES, createModuleRecordsController, recordToDraft } = require("./module-records");
const { periodRange } = require("./task-slice");

const apiBase = process.env.MIHWAR_INTEGRATION_API_URL;
const tokenA = process.env.MIHWAR_INTEGRATION_BEARER_TOKEN;
const tokenB = process.env.MIHWAR_INTEGRATION_SECOND_BEARER_TOKEN;
const configured = Boolean(apiBase && tokenA && tokenB && process.env.MIHWAR_INTEGRATION_ENV === "isolated-test" &&
  process.env.MIHWAR_INTEGRATION_ALLOWED_HOST);

function base() {
  const url = new URL(apiBase);
  if (url.host !== process.env.MIHWAR_INTEGRATION_ALLOWED_HOST) throw new Error("Integration host mismatch");
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Remote tests require HTTPS");
  return url.href.replace(/\/$/, "");
}

const client = token => createApiClient({ baseUrl: base(), sessionProvider: { getAccessToken: async () => token }, maxGetRetries: 0 });

function form(draft) {
  const elements = {};
  const boxes = [];
  for (const [name, value] of Object.entries(draft)) {
    if (Array.isArray(value)) for (const day of [0, 1, 2, 3, 4, 5, 6]) boxes.push({ name, value: String(day), checked: value.includes(day) });
    else elements[name] = typeof value === "boolean" ? { checked: value } : { value: String(value) };
  }
  return { elements, querySelectorAll: selector => boxes.filter(box => selector === `[name="${box.name}"]`) };
}

async function journeyFor(api, stamp) {
  const journeys = await api.request("journeys", { query: { limit: 100 } });
  const active = journeys.find(item => item.status === "active");
  if (active) return active;
  return (await api.request("journeys", { method: "POST", body: { title: `Temporary ${stamp}`, time_zone: "Asia/Riyadh", status: "active" } }))[0];
}

async function saveThrough(controller, key, record, draft) {
  controller.openEditor(key, record);
  await controller.save(form(draft));
  assert.equal(controller.state.error, "", `${key} save failed: ${controller.state.error} ${controller.state.editing?.invalid || ""}`);
  assert.equal(controller.state.editing, null, `${key} editor stayed open`);
}

async function reloadedRows(token, ctx, key) {
  const fresh = createModuleRecordsController({ getClient: () => client(token) });
  fresh.render(ctx);
  await fresh.loadList(key, { force: true });
  const list = fresh.state.lists.get(key);
  assert.equal(list.status, "ready", `${key} reload status ${list.status} ${list.error || ""}`);
  return list.rows;
}

test("every editable Mihwar module persists through the real API, survives reload and stays isolated", { skip: !configured }, async () => {
  const stamp = `modules-${randomUUID()}`;
  const apiA = client(tokenA);
  const apiB = client(tokenB);
  const journey = await journeyFor(apiA, stamp);
  const day = `2031-0${1 + Math.floor(Math.random() * 9)}-1${Math.floor(Math.random() * 9)}`;
  const ctx = { journeyId: journey.id, timeZone: "Asia/Riyadh", today: day, language: "en" };
  const controller = createModuleRecordsController({ getClient: () => apiA });
  controller.render(ctx);
  await controller.loadList("user-preferences", { force: true });

  const prefs = controller.state.lists.get("user-preferences").rows[0] || null;
  await saveThrough(controller, "user-preferences", prefs, {
    locale: "ar", time_zone: "Asia/Riyadh", week_starts_on: "6", calendar_kind: "gregorian", asr_method: "standard",
    health_data_consent_at: true, prayer_recording_consent_at: true
  });
  const [savedPrefs] = await reloadedRows(tokenA, ctx, "user-preferences");
  assert.equal(savedPrefs.week_starts_on, 6);
  assert.ok(savedPrefs.health_data_consent_at && savedPrefs.prayer_recording_consent_at);

  const cases = [
    ["daily-reflections", { local_date: day, intention: `${stamp} intent`, mood: "good", note: "" }, { intention: `${stamp} intent 2` }, "intention"],
    ["habits", { name: `${stamp} habit`, start_date: day, end_date: "", status: "active", frequency: "daily", days: [0, 1, 2, 3, 4, 5, 6], target: "1", unit: "times", effective_date: day },
      { name: `${stamp} habit 2` }, "name"],
    ["calendar-events", { title: `${stamp} event`, details: "", start_at: `${day}T09:00`, end_at: `${day}T10:00`, recurrence_rule: "" },
      { start_at: `${day}T11:00`, end_at: `${day}T12:30`, recurrence_rule: "FREQ=WEEKLY" }, "recurrence_rule"],
    ["projects", { title: `${stamp} project`, description: "", start_date: "", target_date: day, status: "active" }, { status: "paused" }, "status"],
    ["goals", { title: `${stamp} goal`, description: "", time_horizon: "medium", start_date: day, target_date: "", status: "active" }, { title: `${stamp} goal 2` }, "title"],
    ["study-courses", { title: `${stamp} course`, provider: "Sarh", status: "active" }, { provider: "Mihwar" }, "provider"],
    ["sleep-records", { wake_local_date: day, sleep_start_at: `${day}T00:30`, wake_at: `${day}T07:00`, notes: "" }, { notes: "rested" }, "notes"],
    ["meal-logs", { occurred_at: `${day}T13:00`, meal_type: "lunch", description: `${stamp} meal` }, { description: `${stamp} meal 2` }, "description"],
    ["prayer-records", { local_date: day, prayer_key: "fajr", fard_units: "2", target_fard: "2", before_units: "0", target_before: "2", after_units: "0", target_after: "0" },
      { before_units: "2" }, "before_units"],
    ["notes", { kind: "idea", title: `${stamp} note`, body: "body", url: "", note_date: day }, { body: "body 2" }, "body"],
    ["financial-accounts", { name: `${stamp} account`, currency: "SAR", opening_balance: "100", status: "active" }, { name: `${stamp} account 2` }, "name"],
    ["finance-categories", { name: `${stamp} cat`, transaction_kind: "expense" }, { name: `${stamp} cat 2` }, "name"],
    ["budgets", { name: `${stamp} budget`, currency: "SAR", period_kind: "monthly", start_date: day, end_date: "" }, { name: `${stamp} budget 2` }, "name"],
    ["subscriptions", { name: `${stamp} sub`, amount: "15", currency: "SAR", cadence: "monthly", next_due_date: day, status: "active" }, { amount: "20" }, "amount"],
    ["shopping-lists", { title: `${stamp} list`, status: "active" }, { title: `${stamp} list 2` }, "title"]
  ];

  for (const [key, draft, change, checkField] of cases) {
    await saveThrough(controller, key, null, draft);
    const created = (await reloadedRows(tokenA, ctx, key)).find(row =>
      Object.values(row).some(value => typeof value === "string" && value.includes(stamp)) ||
      (key === "sleep-records" && row.wake_local_date === day) || (key === "prayer-records" && row.local_date === day && row.prayer_key === "fajr"));
    assert.ok(created, `${key} not found after reload`);
    await controller.loadList(key, { force: true });
    const editable = controller.findRecord(key, created.id);
    await saveThrough(controller, key, editable, { ...recordToDraft(MODULES.find(item => item.key === key), editable, ctx), ...change });
    const updated = (await reloadedRows(tokenA, ctx, key)).find(row => row.id === created.id);
    assert.ok(updated.version > created.version, `${key} version did not advance`);
    const expected = change[checkField];
    assert.equal(String(updated[checkField]), String(expected), `${key}.${checkField} not persisted`);

    const peek = await apiB.request(key, { query: { id: created.id, limit: 1 } }).catch(error => error);
    assert.ok(Array.isArray(peek) ? peek.length === 0 : peek.status >= 400, `${key} leaked to user B`);
    const forged = await apiB.request(key, { method: "PATCH", query: { id: created.id }, body: { [checkField]: updated[checkField] }, expectedVersion: updated.version })
      .then(() => null, error => error);
    assert.ok(forged && forged.status >= 400, `${key} user B could patch user A's row`);
  }

  await controller.loadList("habits", { force: true });
  const habit = controller.state.lists.get("habits").rows.find(row => row.name === `${stamp} habit 2`);
  const nextDay = new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  await saveThrough(controller, "habits", habit, { ...recordToDraft(MODULES.find(item => item.key === "habits"), habit, ctx),
    frequency: "custom", days: [1, 3], target: "3", unit: "pages", effective_date: nextDay });
  const revisions = await apiA.request("habit-revisions", { query: { journey_id: journey.id, limit: 100 } });
  const revision = revisions.find(row => row.habit_id === habit.id && row.effective_date === nextDay);
  assert.ok(revision && revision.frequency === "custom" && Number(revision.target) === 3, "habit schedule revision not persisted");
  const baseHabit = (await apiA.request("habits", { query: { id: habit.id, limit: 1 } }))[0];
  assert.equal(baseHabit.frequency, "daily", "a future schedule change must not rewrite earlier days");

  const appendOnly = createModuleRecordsController({ getClient: () => apiA });
  appendOnly.render(ctx);
  await saveThrough(appendOnly, "study-sessions", null, { started_at: `${day}T15:00`, ended_at: `${day}T16:00`, focus_minutes: "50", notes: stamp });
  await saveThrough(appendOnly, "activity-sessions", null, { activity_type: `${stamp} walk`, started_at: `${day}T17:00`, ended_at: "", duration_minutes: "30", notes: "" });

  const ownerForgery = await apiA.request("notes", { method: "POST", body: { journey_id: journey.id, kind: "note", body: "x", owner_id: "00000000-0000-4000-8000-000000000002" } })
    .then(() => null, error => error);
  assert.ok(ownerForgery && ownerForgery.status === 400, "owner_id from the client must be rejected");

  const journeyView = createModuleRecordsController({ getClient: () => apiA });
  journeyView.render(ctx);
  journeyView.renderJourney(ctx, { start: day, end: day });
  for (let i = 0; i < 200 && journeyView.state.journey.status !== "ready"; i += 1) await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(journeyView.state.journey.status, "ready", journeyView.state.journey.error);
  const sources = new Set(journeyView.state.journey.items.map(item => item.definition.key));
  for (const key of ["daily-reflections", "study-sessions", "activity-sessions", "sleep-records", "meal-logs", "prayer-records"]) {
    assert.ok(sources.has(key), `journey is missing ${key}`);
  }
  assert.ok(journeyView.state.journey.items.every(item => item.date === day));

  const journeyB = createModuleRecordsController({ getClient: () => apiB });
  const listB = await apiB.request("journeys", { query: { limit: 100 } });
  const ownB = listB.find(item => item.status === "active");
  if (ownB) {
    journeyB.render({ ...ctx, journeyId: ownB.id });
    journeyB.renderJourney({ ...ctx, journeyId: ownB.id }, { start: day, end: day });
    for (let i = 0; i < 200 && journeyB.state.journey.status !== "ready"; i += 1) await new Promise(resolve => setTimeout(resolve, 25));
    assert.ok(journeyB.state.journey.items.every(item => !JSON.stringify(item.record).includes(stamp)));
  }
  const crossJourney = await apiB.request("meal-logs", { query: { journey_id: journey.id, limit: 100 } }).catch(error => error);
  assert.ok(Array.isArray(crossJourney) ? crossJourney.length === 0 : crossJourney.status >= 400);
});

test("shopping items preserve list relationships, completion, archive and owner isolation", { skip: !configured }, async () => {
  const apiA = client(tokenA);
  const apiB = client(tokenB);
  const stamp = `shopping-${randomUUID()}`;
  const list = (await apiA.request("shopping-lists", {
    method: "POST",
    body: { title: stamp, status: "active" }
  }))[0];
  assert.ok(list?.id, "shopping list was not created");

  const journey = await journeyFor(apiA, stamp);
  const ctx = { journeyId: journey.id, timeZone: "Asia/Riyadh", today: "2031-06-15", language: "en" };
  const controller = createModuleRecordsController({ getClient: () => apiA });
  controller.render(ctx);
  await controller.loadList("shopping-lists", { force: true });
  await saveThrough(controller, "shopping-items", null, { list_id: list.id, name: `${stamp} apples`, quantity: "3" });
  await saveThrough(controller, "shopping-items", null, { list_id: list.id, name: `${stamp} bread`, quantity: "1 loaf" });
  const createdItems = await reloadedRows(tokenA, ctx, "shopping-items");
  const first = createdItems.find(item => item.name === `${stamp} apples`);
  const second = createdItems.find(item => item.name === `${stamp} bread`);
  assert.ok(first?.id && second?.id && first.id !== second.id);
  assert.equal(first.list_id, list.id);

  let items = await apiA.request("shopping-items", { query: { list_id: list.id, limit: 100 } });
  assert.equal(items.filter(item => item.name.startsWith(stamp)).length, 2);

  const updated = (await apiA.request("shopping-items", {
    method: "PATCH",
    query: { id: first.id },
    expectedVersion: first.version,
    body: { quantity: "4" }
  }))[0];
  assert.equal(updated.quantity, "4");
  assert.ok(updated.version > first.version);

  const completed = (await apiA.request("shopping-items", {
    method: "PATCH",
    query: { id: first.id },
    expectedVersion: updated.version,
    body: { checked_at: new Date().toISOString() }
  }))[0];
  assert.ok(completed.checked_at);

  const archived = (await apiA.request("shopping-items", {
    method: "PATCH",
    query: { id: second.id },
    expectedVersion: second.version,
    body: { archived_at: new Date().toISOString() }
  }))[0];
  assert.ok(archived.archived_at);
  const reloaded = await apiA.request("shopping-items", { query: { list_id: list.id, limit: 100 } });
  assert.equal(reloaded.find(item => item.id === first.id)?.quantity, "4");
  assert.ok(reloaded.find(item => item.id === first.id)?.checked_at);
  assert.equal(reloaded.find(item => item.id === second.id), undefined, "archived items must stay out of active list reads");
  assert.equal(reloaded.filter(item => item.name.startsWith(stamp)).length, 1);

  const foreignRead = await apiB.request("shopping-items", { query: { list_id: list.id, limit: 100 } });
  assert.equal(foreignRead.length, 0, "another user must not read this list's items");
  const foreignUpdate = await apiB.request("shopping-items", {
    method: "PATCH",
    query: { id: first.id },
    expectedVersion: completed.version,
    body: { quantity: "forged" }
  }).then(() => null, error => error);
  assert.equal(foreignUpdate?.status, 409, "another user must not edit the item");
  const foreignArchive = await apiB.request("shopping-items", {
    method: "PATCH",
    query: { id: first.id },
    expectedVersion: completed.version,
    body: { archived_at: new Date().toISOString() }
  }).then(() => null, error => error);
  assert.equal(foreignArchive?.status, 409, "another user must not archive the item");
  const ownerStillHasItem = await apiA.request("shopping-items", { query: { id: first.id, limit: 1 } });
  assert.equal(ownerStillHasItem[0]?.checked_at, completed.checked_at);
  assert.equal(ownerStillHasItem[0]?.archived_at, null, "foreign archive must not change the owner's item");

  const ownerForgery = await apiA.request("shopping-items", {
    method: "POST",
    body: { owner_id: "00000000-0000-4000-8000-000000000002", list_id: list.id, name: `${stamp} forged` }
  }).then(() => null, error => error);
  assert.ok(ownerForgery && ownerForgery.status === 400, "client-supplied owner ids must be rejected");
});

test("Journey day, week, month and year rebuild chronologically from source records", { skip: !configured }, async () => {
  const api = client(tokenA);
  const stamp = `journey-period-${randomUUID()}`;
  const journey = await journeyFor(api, stamp);
  const dates = [
    ["2031-06-15T08:00:00Z", "day early"],
    ["2031-06-15T16:00:00Z", "day late"],
    ["2031-06-12T12:00:00Z", "week boundary"],
    ["2031-06-02T12:00:00Z", "month early"],
    ["2031-06-29T12:00:00Z", "month late"],
    ["2031-02-02T12:00:00Z", "year early"],
    ["2031-12-02T12:00:00Z", "year late"]
  ];
  const created = [];
  for (const [occurred_at, label] of dates) {
    created.push((await api.request("meal-logs", {
      method: "POST",
      body: {
        journey_id: journey.id,
        occurred_at,
        time_zone: "Asia/Riyadh",
        meal_type: "snack",
        description: `${stamp} ${label}`
      }
    }))[0]);
  }

  const context = { journeyId: journey.id, timeZone: "Asia/Riyadh", today: "2031-06-15", language: "en" };
  const controller = createModuleRecordsController({ getClient: () => api });
  const expected = {
    day: created.slice(0, 2).map(row => row.id),
    week: created.slice(0, 3).map(row => row.id),
    month: created.slice(0, 5).map(row => row.id),
    year: created.map(row => row.id)
  };
  for (const period of ["day", "week", "month", "year"]) {
    const range = periodRange(context.today, period);
    const journeyKey = `${journey.id}:${range.start}:${range.end}`;
    controller.renderJourney(context, range);
    for (let attempt = 0; attempt < 200 &&
        (controller.state.journey.key !== journeyKey || controller.state.journey.status !== "ready"); attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    assert.equal(controller.state.journey.status, "ready", `${period} Journey failed to load`);
    const items = controller.state.journey.items.filter(item => item.record.description?.startsWith(stamp));
    const ids = items.map(item => item.record.id);
    assert.deepEqual(new Set(ids), new Set(expected[period]), `${period} period contained wrong source records`);
    assert.equal(ids.length, expected[period].length, `${period} period duplicated source records`);
    assert.deepEqual(items.map(item => item.record.occurred_at), [...items]
      .map(item => item.record.occurred_at).sort(), `${period} items were not chronological`);
  }

  const target = created[0];
  const current = (await api.request("meal-logs", { query: { id: target.id, limit: 1 } }))[0];
  const changed = (await api.request("meal-logs", {
    method: "PATCH",
    query: { id: target.id },
    expectedVersion: current.version,
    body: { description: `${stamp} edited at source` }
  }))[0];
  assert.equal(changed.description, `${stamp} edited at source`);
  const recovered = await api.request("meal-logs", {
    query: {
      journey_id: journey.id,
      range_from: "2031-06-15T00:00:00.000Z",
      range_to: "2031-06-16T00:00:00.000Z",
      limit: 100
    }
  });
  assert.equal(recovered.filter(row => row.description?.startsWith(stamp)).length, 2);
  assert.ok(recovered.some(row => row.id === target.id && row.description === `${stamp} edited at source`));
});
