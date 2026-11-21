"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { summarize, render } = require("./daily-summary");

const tasks = [
  { id: "a", title: "Low", startDate: "2026-11-21", status: "active", priority: 1 },
  { id: "b", title: "High <priority>", startDate: "2026-11-21", status: "active", priority: 5 },
  { id: "c", title: "Done", startDate: "2026-11-21", status: "completed", priority: 4 },
  { id: "d", title: "Paused", startDate: "2026-11-21", status: "paused", priority: 5 },
  { id: "e", title: "Yesterday done", startDate: "2026-11-20", status: "completed", priority: 2 },
  { id: "f", title: "Yesterday active", startDate: "2026-11-20", status: "active", priority: 2 },
  { id: "g", title: "Archived", startDate: "2026-11-21", status: "archived", priority: 5 }
];

test("daily summary uses original tasks, saved priorities, and current yesterday statuses", () => {
  const model = summarize({ today: "2026-11-21", tasks });
  assert.equal(model.completed, 1);
  assert.equal(model.remaining, 2);
  assert.equal(model.paused, 1);
  assert.deepEqual(model.priorities.map(task => task.id), ["b", "a"]);
  assert.equal(model.yesterday, "2026-11-20");
  assert.equal(model.yesterdayCompleted, 1);
  assert.equal(model.yesterdayRemaining, 1);
  assert.equal(model.yesterdayCount, 2);
  assert.match(render(model), /High &lt;priority&gt;/);
  assert.match(render(model), /data-task-edit="b"/);
  assert.match(render(model), /وليست وقت إنجازها/);
});

test("skipping changes only the suggested view and can be reversed", () => {
  const original = JSON.stringify(tasks);
  const skipped = summarize({ today: "2026-11-21", tasks, skippedIds: ["b"] });
  assert.deepEqual(skipped.priorities.map(task => task.id), ["a"]);
  assert.deepEqual(skipped.skipped.map(task => task.id), ["b"]);
  assert.equal(skipped.remaining, 2);
  assert.match(render(skipped), /data-daily-restore="b"/);
  assert.equal(JSON.stringify(tasks), original);
  assert.deepEqual(summarize({ today: "2026-11-21", tasks }).priorities.map(task => task.id), ["b", "a"]);
});

test("empty, leap-year, and invalid day inputs are handled explicitly", () => {
  const model = summarize({ today: "2024-03-01", tasks: [] });
  assert.equal(model.yesterday, "2024-02-29");
  assert.equal(model.remaining, 0);
  assert.match(render(model), /لا توجد مهام مسجلة لأمس/);
  assert.match(render(model), /غير متاحة في هذا الملخص/);
  assert.throws(() => summarize({ today: "2026-02-31", tasks: [] }), /invalid_daily_summary/);
});

test("daily source failures are visible and real habits and events are rendered safely", () => {
  const model = summarize({ today: "2026-11-21", tasks: [] });
  assert.match(render(model, "ar", true, false, { status: "error" }), /تعذر تحميل العادات والمواعيد/);
  const sources = {
    status: "ready",
    data: {
      timeZone: "UTC",
      todayHabits: [{ id: "habit", name: "<Read>", record: { status: "partial" } }],
      events: [
        { id: "event", title: "<Meeting>", startAt: "2026-11-21T10:00:00Z", allDay: false },
        { id: "recurring", title: "Series", startAt: "2026-11-21T11:00:00Z", recurring: true }
      ],
      yesterdayHabits: { total: 1, completed: 1, partial: 0, skipped: 0 }
    }
  };
  const html = render(model, "ar", true, false, sources);
  assert.match(html, /&lt;Read&gt;/);
  assert.match(html, /&lt;Meeting&gt;/);
  assert.match(html, /جزئي/);
  assert.match(html, /data-daily-habit="habit" data-habit-status="completed"/);
  assert.match(html, /data-habit-status="partial"[^>]*disabled/);
  assert.match(html, /data-daily-event-edit="event"/);
  assert.doesNotMatch(html, /data-daily-event-edit="recurring"/);
  assert.match(html, /موعد متكرر · الأصل فقط/);
  assert.match(html, /تكرار المواعيد وتعديل أوقاتها/);
  const editing = render(model, "ar", true, false, sources, undefined,
    { id: "event", title: '<Changed "' }, "Conflict");
  assert.match(editing, /data-daily-event-form/);
  assert.match(editing, /value="&lt;Changed &quot;"/);
  assert.match(editing, /role="alert">Conflict/);
});
