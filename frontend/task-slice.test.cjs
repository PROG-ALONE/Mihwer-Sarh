"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const slice = require("./task-slice");

test("unauthenticated and unavailable states never render fictional sample task content", () => {
  slice.state.auth = "unavailable";
  slice.state.tasks = [];
  const html = slice.render();
  assert.match(html, /لا تُعرض بيانات تجريبية/);
  assert.doesNotMatch(html, /Read a chapter|مشروع شخصي|pauseDesc/);
});

test("trial access states offer server-backed start and redemption without exposing content", () => {
  slice.state.auth = "trial_not_started";
  slice.state.tasks = [];
  assert.match(slice.render(), /data-access-start/);
  assert.match(slice.render(), /72 ساعة/);
  assert.doesNotMatch(slice.render(), /Read a chapter/);

  slice.state.auth = "trial_expired";
  const expired = slice.render();
  assert.match(expired, /data-activation-form/);
  assert.match(expired, /name="code"/);
  assert.doesNotMatch(expired, /Read a chapter/);

  slice.state.auth = "suspended";
  assert.match(slice.render(), /الحساب موقوف/);
  assert.doesNotMatch(slice.render(), /data-access-start|data-activation-form/);
});

test("task timeline is projected from the same server task resource", () => {
  slice.state.auth = "authenticated";
  slice.state.journey = {
    id: "00000000-0000-4000-8000-000000000011",
    title: "My journey",
    timeZone: "Asia/Riyadh",
    status: "active"
  };
  slice.state.period = "day";
  slice.state.selectedDate = "2026-11-20";
  slice.state.tasks = [{
    id: "00000000-0000-4000-8000-000000000021",
    journeyId: "00000000-0000-4000-8000-000000000011",
    title: "Read a chapter",
    startDate: "2026-11-20",
    dueDate: "2026-11-20",
    status: "active",
    priority: 2,
    estimateMinutes: 30,
    version: 1
  }];
  const events = slice.timelineEvents();
  const html = slice.render();
  assert.equal(events.length, 1);
  assert.equal(events[0].sourceId, slice.state.tasks[0].id);
  assert.match(html, /data-timeline-source="task:00000000-0000-4000-8000-000000000021"/);
  assert.match(html, /Read a chapter/);
});

test("day, centered-week, month, and year views filter the original task source", () => {
  slice.state.auth = "authenticated";
  slice.state.journey = {
    id: "00000000-0000-4000-8000-000000000011",
    title: "My journey",
    timeZone: "Asia/Riyadh",
    status: "active"
  };
  slice.state.selectedDate = "2026-11-20";
  slice.state.period = "day";
  slice.state.tasks = [
    { id: "00000000-0000-4000-8000-000000000021", title: "Today", startDate: "2026-11-20", status: "active", priority: 1, estimateMinutes: 10 },
    { id: "00000000-0000-4000-8000-000000000022", title: "Tomorrow", startDate: "2026-11-21", status: "active", priority: 1, estimateMinutes: 10 }
  ];
  assert.deepEqual(slice.periodRange("2026-11-20", "day"), { start: "2026-11-20", end: "2026-11-20" });
  assert.deepEqual(slice.periodRange("2026-11-20", "week"), { start: "2026-11-17", end: "2026-11-23" });
  assert.deepEqual(slice.periodRange("2026-11-20", "month"), { start: "2026-11-01", end: "2026-11-30" });
  assert.deepEqual(slice.periodRange("2026-11-20", "year"), { start: "2026-01-01", end: "2026-12-31" });
  assert.match(slice.render(), /Today/);
  assert.doesNotMatch(slice.render(), /Tomorrow/);
  slice.state.period = "week";
  assert.match(slice.render(), /Tomorrow/);
  assert.equal(slice.shiftPeriodDate("2026-01-31", "month", 1), "2026-02-28");
  assert.equal(slice.shiftPeriodDate("2024-02-29", "year", 1), "2025-02-28");
});
