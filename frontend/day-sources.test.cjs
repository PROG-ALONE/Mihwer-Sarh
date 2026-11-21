"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createDaySourcesRepository } = require("./day-sources");

const journeyId = "00000000-0000-4000-8000-000000000011";
const habitId = "00000000-0000-4000-8000-000000000030";
const archivedId = "00000000-0000-4000-8000-000000000020";

function fixture() {
  return {
    habits: [
      {
        id: habitId, journey_id: journeyId, name: "Read",
        start_date: "2026-01-01", end_date: null, frequency: "weekly", days: [5],
        target: 1, unit: "pages", status: "active", deleted_at: null
      },
      {
        id: archivedId, journey_id: journeyId, name: "Archived habit",
        start_date: "2026-01-01", end_date: null, frequency: "daily", days: [0, 1, 2, 3, 4, 5, 6],
        target: 1, unit: "times", status: "archived", deleted_at: "2026-11-21T00:00:00Z"
      }
    ],
    "habit-revisions": [
      {
        id: "00000000-0000-4000-8000-000000000052", habit_id: habitId,
        effective_date: "2026-11-22", frequency: "weekly", days: [0], target: 1, unit: "pages"
      },
      {
        id: "00000000-0000-4000-8000-000000000051", habit_id: habitId,
        effective_date: "2026-11-21", frequency: "custom", days: [6], target: 2, unit: "pages"
      }
    ],
    "habit-records": [
      { id: "00000000-0000-4000-8000-000000000063", habit_id: habitId, local_date: "2026-11-21", status: "partial", amount: "1.00", version: 2 },
      { id: "00000000-0000-4000-8000-000000000062", habit_id: archivedId, local_date: "2026-11-20", status: "completed", amount: 1, version: 1 },
      { id: "00000000-0000-4000-8000-000000000061", habit_id: habitId, local_date: "2026-11-19", status: "skipped", amount: null, version: 1 }
    ],
    "calendar-events": [
      {
        id: "00000000-0000-4000-8000-000000000072", journey_id: journeyId, title: "Future today",
        start_at: "2026-11-20T11:30:00+00:00", end_at: "2026-11-20T12:30:00+00:00",
        time_zone: "Pacific/Kiritimati", all_day_start: null, all_day_end: null,
        recurrence_rule: null, deleted_at: null, version: 1
      },
      {
        id: "00000000-0000-4000-8000-000000000071", journey_id: journeyId, title: "Continues today",
        start_at: "2026-11-20T08:00:00+00:00", end_at: "2026-11-20T12:00:00+00:00",
        time_zone: "Pacific/Kiritimati", all_day_start: null, all_day_end: null,
        recurrence_rule: null, deleted_at: null, version: 1
      }
    ]
  };
}

function repositoryFor(rows, requests = []) {
  return createDaySourcesRepository({
    async request(resource, options) {
      requests.push({ resource, query: options.query });
      return rows[resource];
    }
  });
}

test("daily sources use scheduled revisions, real records, and journey time-zone event boundaries", async () => {
  const requests = [];
  const sources = await repositoryFor(fixture(), requests).load({
    journeyId, today: "2026-11-21", timeZone: "Pacific/Kiritimati"
  });
  assert.deepEqual(sources.todayHabits.map(habit => habit.name), ["Read"]);
  assert.equal(sources.todayHabits[0].record.status, "partial");
  assert.equal(sources.todayHabits[0].record.amount, 1);
  assert.deepEqual(sources.yesterdayHabits, { completed: 1, partial: 0, skipped: 0, total: 1 });
  assert.deepEqual(sources.events.map(event => event.title), ["Continues today", "Future today"]);
  assert.equal(sources.events[0].startsBeforeToday, true);
  assert.equal(sources.events[1].startsBeforeToday, false);
  assert.equal(sources.heatmapHabits.find(habit => habit.id === habitId).records["2026-11-21"].status, "incomplete");
  assert.equal(sources.heatmapHabits.find(habit => habit.id === habitId).records["2026-11-19"], undefined);
  assert.equal(sources.heatmapHabits.find(habit => habit.id === archivedId).records["2026-11-20"].status, "completed");
  const records = requests.find(request => request.resource === "habit-records");
  assert.equal(records.query.journey_id, journeyId);
  assert.equal(records.query.local_date_from, "2026-10-23");
  assert.equal(records.query.local_date_to, "2026-11-21");
  const revisions = requests.find(request => request.resource === "habit-revisions");
  assert.equal(revisions.query.journey_id, journeyId);
  assert.equal(revisions.query.effective_date_to, "2026-11-21");
  const events = requests.find(request => request.resource === "calendar-events");
  assert.equal(events.query.overlap_from, "2026-11-20T00:00:00.000Z");
  assert.equal(events.query.overlap_to, "2026-11-23T00:00:00.000Z");
});

test("daily sources reject invalid records, duplicate dates, and unavailable APIs", async () => {
  const invalid = fixture();
  invalid.habits[0].days = [9];
  await assert.rejects(repositoryFor(invalid).load({ journeyId, today: "2026-11-21", timeZone: "UTC" }), /invalid_habit_definition/);

  const duplicate = fixture();
  duplicate["habit-records"].push({
    id: "00000000-0000-4000-8000-000000000060", habit_id: habitId,
    local_date: "2026-11-21", status: "completed", amount: 2, version: 1
  });
  await assert.rejects(repositoryFor(duplicate).load({ journeyId, today: "2026-11-21", timeZone: "UTC" }), /duplicate_habit_record_response/);

  const unavailable = createDaySourcesRepository({
    async request() { throw new Error("network_error"); }
  });
  await assert.rejects(unavailable.load({ journeyId, today: "2026-11-21", timeZone: "UTC" }), /network_error/);
  await assert.rejects(repositoryFor(fixture()).load({ journeyId, today: "2026-11-21", timeZone: "No/Such_Zone" }), RangeError);
});

test("habit progress creates or version-updates the original daily record only after confirmation", async () => {
  const calls = [];
  const raw = {
    id: "00000000-0000-4000-8000-000000000064", habit_id: habitId,
    local_date: "2026-11-21", status: "partial", amount: null, version: 1
  };
  const repository = createDaySourcesRepository({
    async request(resource, options) {
      calls.push({ resource, options });
      if (options.method === "PATCH") return [{ ...raw, status: "completed", version: 2 }];
      return [raw];
    }
  });
  const created = await repository.saveHabitRecord({ habitId, date: "2026-11-21", status: "partial" });
  assert.equal(created.id, raw.id);
  assert.equal(created.version, 1);
  assert.deepEqual(calls[0].options.body, { habit_id: habitId, local_date: "2026-11-21", status: "partial" });
  const updated = await repository.saveHabitRecord({
    habitId, date: "2026-11-21", status: "completed", record: created
  });
  assert.equal(updated.version, 2);
  assert.equal(calls[1].options.method, "PATCH");
  assert.equal(calls[1].options.expectedVersion, 1);
  assert.deepEqual(calls[1].options.body, { status: "completed" });

  await assert.rejects(repository.saveHabitRecord({
    habitId, date: "2026-11-20", status: "completed", record: created
  }), /invalid_habit_record_input/);
  await assert.rejects(repository.saveHabitRecord({ habitId, date: "2026-11-21", status: "unknown" }),
    /invalid_habit_record_input/);
  const unconfirmed = createDaySourcesRepository({ async request() { return []; } });
  await assert.rejects(unconfirmed.saveHabitRecord({ habitId, date: "2026-11-21", status: "completed" }),
    /habit_record_save_not_confirmed/);
});

test("appointment name changes require a confirmed, versioned update of the original event", async () => {
  const raw = fixture()["calendar-events"][0];
  const calls = [];
  const repository = createDaySourcesRepository({
    async request(resource, options) {
      calls.push({ resource, options });
      return [{ ...raw, title: options.body.title, version: 2 }];
    }
  });
  const event = { id: raw.id, journeyId, version: 1, recurring: false, deleted: false };
  const saved = await repository.saveEventTitle({ event, title: "  Renamed  " });
  assert.equal(saved.title, "Renamed");
  assert.equal(saved.version, 2);
  assert.equal(calls[0].resource, "calendar-events");
  assert.deepEqual(calls[0].options.query, { id: raw.id });
  assert.equal(calls[0].options.expectedVersion, 1);
  assert.deepEqual(calls[0].options.body, { title: "Renamed" });
  await assert.rejects(repository.saveEventTitle({ event, title: "   " }), /invalid_calendar_event_input/);
  await assert.rejects(repository.saveEventTitle({ event: { ...event, recurring: true }, title: "New" }),
    /invalid_calendar_event_input/);
  await assert.rejects(repository.saveEventTitle({ event: { ...event, version: 0 }, title: "New" }),
    /invalid_calendar_event_input/);
  const unconfirmed = createDaySourcesRepository({ async request() { return []; } });
  await assert.rejects(unconfirmed.saveEventTitle({ event, title: "New" }), /calendar_event_save_not_confirmed/);
  const unchanged = createDaySourcesRepository({ async request() { return [raw]; } });
  await assert.rejects(unchanged.saveEventTitle({ event, title: "New" }), /calendar_event_save_not_confirmed/);
});
