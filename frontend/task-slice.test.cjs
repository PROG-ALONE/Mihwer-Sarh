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
  slice.state.error = "access_request_failed";
  assert.match(slice.render(), /تعذر التحقق من صلاحية الوصول/);
  slice.state.error = "";

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
  assert.deepEqual(slice.periodRange("2027-01-01", "week"), { start: "2026-12-29", end: "2027-01-04" });
  assert.deepEqual(slice.periodRange("2024-02-29", "month"), { start: "2024-02-01", end: "2024-02-29" });
  assert.deepEqual(slice.periodRange("2024-12-31", "year"), { start: "2024-01-01", end: "2024-12-31" });
  assert.match(slice.render(), /Today/);
  assert.doesNotMatch(slice.render(), /Tomorrow/);
  slice.state.period = "week";
  assert.match(slice.render(), /Tomorrow/);
  assert.equal(slice.shiftPeriodDate("2026-01-31", "month", 1), "2026-02-28");
  assert.equal(slice.shiftPeriodDate("2024-02-29", "year", 1), "2025-02-28");
});

test("timeline projects original appointments alongside tasks and preserves a missing edit draft", () => {
  const id = "00000000-0000-4000-8000-000000000021";
  slice.state.auth = "authenticated";
  slice.state.journey = {
    id: "00000000-0000-4000-8000-000000000011", title: "Journey", timeZone: "UTC", status: "active"
  };
  slice.state.selectedDate = "2026-11-20";
  slice.state.loadedToday = null;
  slice.state.period = "day";
  slice.state.editing = null;
  slice.state.eventDraft = null;
  slice.state.tasks = [{ id, title: "Original task", startDate: "2026-11-20", status: "active", priority: 2 }];
  const event = {
    id, journeyId: slice.state.journey.id, title: "Original <appointment>", version: 1,
    startAt: "2026-11-19T23:00:00Z", endAt: "2026-11-20T01:00:00Z",
    startDate: "2026-11-19", lastDate: "2026-11-20", startsBeforeRange: true,
    allDay: false, recurring: false, deleted: false
  };
  slice.state.timelineAppointments = { status: "ready", events: [event] };
  const html = slice.render();
  assert.match(html, /data-timeline-source="task:00000000-0000-4000-8000-000000000021"/);
  assert.match(html, /data-timeline-source="calendar:00000000-0000-4000-8000-000000000021"/);
  assert.match(html, /Original &lt;appointment&gt;/);
  assert.match(html, /مستمر من تاريخ سابق/);
  assert.match(html, /data-timeline-event-edit="00000000-0000-4000-8000-000000000021"/);
  assert.equal(slice.timelineEvents().length, 2);

  const earlier = {
    ...event, id: "00000000-0000-4000-8000-000000000023", title: "Z earlier",
    startAt: "2026-11-20T08:00:00Z", startDate: "2026-11-20", startsBeforeRange: false
  };
  const later = {
    ...event, id: "00000000-0000-4000-8000-000000000024", title: "A later",
    startAt: "2026-11-20T12:00:00Z", startDate: "2026-11-20", startsBeforeRange: false
  };
  slice.state.timelineAppointments.events = [later, earlier, event];
  const ordered = slice.render();
  assert.ok(ordered.indexOf("Z earlier") < ordered.indexOf("A later"));
  slice.state.timelineAppointments.events = [event];

  slice.state.eventDraft = { id, title: "Unsent <draft>", surface: "timeline" };
  const editing = slice.render();
  assert.match(editing, /data-daily-event-form/);
  assert.match(editing, /value="Unsent &lt;draft&gt;"/);
  assert.match(editing, /احفظ تعديل الموعد أو ألغِه قبل تغيير الفترة/);
  assert.match(editing, /data-backend-period="week"[^>]*disabled/);

  slice.state.timelineAppointments = { status: "ready", events: [] };
  const missing = slice.render();
  assert.match(missing, /لم يعد الموعد متاحاً في هذا العرض/);
  assert.match(missing, /readonly value="Unsent &lt;draft&gt;"/);
  assert.equal(slice.state.eventDraft.title, "Unsent <draft>");
  slice.state.eventDraft = null;
  slice.state.timelineAppointments = { status: "unavailable", events: [] };
});

test("a failed appointment period request is visible without inventing an empty timeline", async () => {
  const journey = {
    id: "00000000-0000-4000-8000-000000000011", title: "Journey", time_zone: "UTC", status: "active"
  };
  slice.state.selectedDate = "2020-03-10";
  slice.state.period = "day";
  slice.state.eventDraft = null;
  slice.setApiClient({
    sessionProvider: { async getAccessToken() { return "test-only"; } },
    maxGetRetries: 0,
    fetchImpl: async url => {
      const parsed = new URL(url);
      if (parsed.pathname.endsWith("/calendar-events") && parsed.searchParams.get("all_day_date_from") === "2020-03-10") {
        return new Response(JSON.stringify({ error: { code: "validation_failed" } }), {
          status: 400, headers: { "content-type": "application/json" }
        });
      }
      const data = parsed.pathname.endsWith("/access") ? { status: "trial_active" } :
        parsed.pathname.endsWith("/journeys") ? [journey] : [];
      return new Response(JSON.stringify({ data }), { headers: { "content-type": "application/json" } });
    }
  });
  await slice.refresh();
  assert.equal(slice.state.auth, "authenticated");
  assert.equal(slice.state.timelineAppointments.status, "error");
  assert.match(slice.render(), /تعذر تحميل مواعيد المسار/);
  assert.doesNotMatch(slice.render(), /لا توجد مهام أو مواعيد ضمن الفترة/);
});

test("refresh loads bounded appointment windows for day, week, month, and year", async () => {
  const journey = {
    id: "00000000-0000-4000-8000-000000000011", title: "Journey", time_zone: "UTC", status: "active"
  };
  const events = [
    ["74", "Today", "2026-11-20"],
    ["73", "This week", "2026-11-22"],
    ["72", "This month", "2026-11-28"],
    ["71", "This year", "2026-12-10"]
  ].map(([suffix, title, date]) => ({
    id: `00000000-0000-4000-8000-0000000000${suffix}`, journey_id: journey.id, title,
    start_at: `${date}T10:00:00Z`, end_at: `${date}T11:00:00Z`, time_zone: "UTC",
    all_day_start: null, all_day_end: null, recurrence_rule: null, deleted_at: null, version: 1
  }));
  const requested = [];
  slice.state.selectedDate = "2026-11-20";
  slice.state.eventDraft = null;
  slice.setApiClient({
    sessionProvider: { async getAccessToken() { return "test-only"; } },
    maxGetRetries: 0,
    fetchImpl: async url => {
      const parsed = new URL(url);
      if (parsed.pathname.endsWith("/calendar-events")) {
        requested.push(parsed);
        const from = parsed.searchParams.get("all_day_date_from");
        const to = parsed.searchParams.get("all_day_date_to");
        const rows = events.filter(event => event.start_at.slice(0, 10) >= from && event.start_at.slice(0, 10) <= to);
        return new Response(JSON.stringify({ data: rows }), { headers: { "content-type": "application/json" } });
      }
      const data = parsed.pathname.endsWith("/access") ? { status: "trial_active" } :
        parsed.pathname.endsWith("/journeys") ? [journey] : [];
      return new Response(JSON.stringify({ data }), { headers: { "content-type": "application/json" } });
    }
  });
  for (const [period, expected] of [
    ["day", ["Today"]],
    ["week", ["Today", "This week"]],
    ["month", ["Today", "This week", "This month"]],
    ["year", ["Today", "This week", "This month", "This year"]]
  ]) {
    slice.state.period = period;
    await slice.refresh();
    assert.equal(slice.state.auth, "authenticated");
    assert.deepEqual(slice.state.timelineAppointments.events.map(event => event.title), expected);
    const range = slice.periodRange("2026-11-20", period);
    assert.ok(requested.some(url => url.searchParams.get("all_day_date_from") === range.start &&
      url.searchParams.get("all_day_date_to") === range.end));
  }
});

test("task draft and priority survive a rerender after a failed save", () => {
  slice.state.auth = "authenticated";
  slice.state.journey = {
    id: "00000000-0000-4000-8000-000000000011",
    title: "My journey", timeZone: "UTC", status: "active"
  };
  slice.state.selectedDate = "2026-11-20";
  slice.state.period = "day";
  slice.state.tasks = [];
  slice.state.editing = "new";
  slice.state.draft = { title: "Keep <my> input", date: "2026-11-21", estimate: "45", priority: "5" };
  slice.state.error = "validation_failed";
  const html = slice.render();
  assert.match(html, /value="Keep &lt;my&gt; input"/);
  assert.match(html, /value="2026-11-21"/);
  assert.match(html, /value="45"/);
  assert.match(html, /value="5" selected/);
  assert.match(html, /تحقق من الاسم والتاريخ والمدة/);
  slice.state.editing = null;
  slice.state.draft = null;
  slice.state.error = "";
});

test("journey form preserves its draft on an unsuccessful create", () => {
  slice.state.auth = "authenticated";
  slice.state.journey = null;
  slice.state.journeyDraft = "My <journey>";
  slice.state.error = "backend_error";
  const html = slice.render();
  assert.match(html, /value="My &lt;journey&gt;"/);
  assert.match(html, /role="alert"/);
  slice.state.journeyDraft = "";
  slice.state.error = "";
});

test("refresh fetches the selected period and recent history without loading intervening years", async () => {
  const requested = [];
  const journey = {
    id: "00000000-0000-4000-8000-000000000011",
    title: "My journey", time_zone: "Pacific/Kiritimati", status: "active"
  };
  slice.state.selectedDate = "2020-01-15";
  slice.state.period = "month";
  slice.setApiClient({
    baseUrl: "https://mihwar.test.invalid/api/v1",
    sessionProvider: { async getAccessToken() { return "test-only"; } },
    maxGetRetries: 0,
    fetchImpl: async (url) => {
      const parsed = new URL(url);
      requested.push(parsed);
      const data = parsed.pathname.endsWith("/access") ? { status: "trial_active" } :
        parsed.pathname.endsWith("/journeys") ? [journey] : [];
      return new Response(JSON.stringify({ data }), { headers: { "content-type": "application/json" } });
    }
  });
  await slice.refresh();
  assert.equal(slice.state.auth, "authenticated");
  const ranges = requested.filter(url => url.pathname.endsWith("/tasks"));
  assert.equal(ranges.length, 2);
  assert.ok(ranges.some(url =>
    url.searchParams.get("start_date_from") === "2020-01-01" &&
    url.searchParams.get("start_date_to") === "2020-01-31"
  ));
  const recent = ranges.find(url => url.searchParams.get("start_date_to") !== "2020-01-31");
  assert.equal(recent.searchParams.get("start_date_to"), slice.state.loadedToday);
  const start = new Date(`${recent.searchParams.get("start_date_from")}T00:00:00Z`);
  const end = new Date(`${slice.state.loadedToday}T00:00:00Z`);
  assert.equal((end - start) / 86_400_000, 29);
});

test("a superseded refresh cannot overwrite the latest authenticated state", async () => {
  let releaseFirst;
  let accessCalls = 0;
  const delayed = new Promise(resolve => { releaseFirst = resolve; });
  const journey = {
    id: "00000000-0000-4000-8000-000000000011",
    title: "Latest journey", time_zone: "UTC", status: "active"
  };
  const response = data => new Response(JSON.stringify({ data }), { headers: { "content-type": "application/json" } });
  slice.state.selectedDate = null;
  slice.state.period = "day";
  slice.setApiClient({
    sessionProvider: { async getAccessToken() { return "test-only"; } },
    maxGetRetries: 0,
    fetchImpl: async url => {
      const path = new URL(url).pathname;
      if (path.endsWith("/access")) {
        accessCalls += 1;
        if (accessCalls === 1) return delayed;
        return response({ status: "trial_active" });
      }
      return response(path.endsWith("/journeys") ? [journey] : []);
    }
  });
  const first = slice.refresh();
  while (accessCalls === 0) await new Promise(resolve => setImmediate(resolve));
  await slice.refresh();
  releaseFirst(response({ status: "suspended" }));
  await first;
  assert.equal(slice.state.auth, "authenticated");
  assert.equal(slice.state.journey.title, "Latest journey");
});

test("signing out or switching session clears private tasks and unfinished drafts", async () => {
  let notifySession;
  const provider = {
    async getAccessToken() { return "test-only"; },
    subscribe(callback) { notifySession = callback; }
  };
  await slice.setSessionProvider(provider);
  slice.state.tasks = [{ id: "private-task", title: "Private" }];
  slice.state.editing = "new";
  slice.state.draft = { title: "Private draft" };
  slice.state.eventDraft = { id: "private-event", title: "Private event draft" };
  notifySession(null);
  assert.equal(slice.state.auth, "unauthenticated");
  assert.deepEqual(slice.state.tasks, []);
  assert.equal(slice.state.draft, null);
  assert.equal(slice.state.eventDraft, null);
  assert.equal(slice.state.editing, null);
  assert.equal(slice.state.timelineAppointments.status, "unavailable");
  assert.deepEqual(slice.state.timelineAppointments.events, []);

  slice.state.tasks = [{ id: "previous-user", title: "Previous user's task" }];
  slice.state.draft = { title: "Previous user's draft" };
  slice.state.eventDraft = { id: "previous-event", title: "Previous user's event draft" };
  notifySession({ authenticated: true });
  assert.deepEqual(slice.state.tasks, []);
  assert.equal(slice.state.draft, null);
  assert.equal(slice.state.eventDraft, null);
  await new Promise(resolve => setImmediate(resolve));
});
