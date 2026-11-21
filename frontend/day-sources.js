"use strict";

(function attachMihwerDaySources(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MihwerDaySources = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const { isUuid, isDate, isTimestamp, shiftDate } = globalThis.MihwerDataValidation || require("./data-validation");
  const { listPages } = globalThis.MihwerPagination || require("./paged-request");

  function definition(row) {
    const target = typeof row.target === "number" || typeof row.target === "string" ? Number(row.target) : NaN;
    if (!["daily", "weekly", "custom"].includes(row.frequency) || !Array.isArray(row.days) ||
        !row.days.length || row.days.some(day => !Number.isInteger(day) || day < 0 || day > 6) ||
        !Number.isFinite(target) || target <= 0 || typeof row.unit !== "string" || !row.unit.trim()) {
      throw new Error("invalid_habit_definition");
    }
    return { frequency: row.frequency, days: row.days, target, unit: row.unit };
  }

  function mapHabit(row, journeyId) {
    if (!row || !isUuid(row.id) || row.journey_id !== journeyId || typeof row.name !== "string" || !row.name.trim() ||
        !isDate(row.start_date) || row.end_date != null && (!isDate(row.end_date) || row.end_date < row.start_date) ||
        !["active", "paused", "archived"].includes(row.status)) {
      throw new Error("invalid_habit_response");
    }
    return {
      id: row.id, name: row.name, startDate: row.start_date, endDate: row.end_date ?? null,
      status: row.status, deleted: row.deleted_at != null, definition: definition(row)
    };
  }

  function mapRevision(row) {
    if (!row || !isUuid(row.id) || !isUuid(row.habit_id) || !isDate(row.effective_date)) {
      throw new Error("invalid_habit_revision_response");
    }
    return { habitId: row.habit_id, effectiveDate: row.effective_date, definition: definition(row) };
  }

  function mapRecord(row) {
    const amount = row?.amount == null ? null :
      typeof row.amount === "number" || typeof row.amount === "string" && row.amount.trim() ? Number(row.amount) : NaN;
    if (!row || !isUuid(row.id) || !isUuid(row.habit_id) || !isDate(row.local_date) ||
        !Number.isInteger(row.version) || row.version < 1 ||
        !["completed", "partial", "skipped"].includes(row.status) ||
        amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      throw new Error("invalid_habit_record_response");
    }
    return { id: row.id, habitId: row.habit_id, date: row.local_date, status: row.status, amount, version: row.version };
  }

  function mapEvent(row, journeyId) {
    if (!row || !isUuid(row.id) || row.journey_id !== journeyId || typeof row.title !== "string" || !row.title.trim() ||
        !Number.isInteger(row.version) || row.version < 1 ||
        !isTimestamp(row.start_at) || !isTimestamp(row.end_at) || Date.parse(row.end_at) <= Date.parse(row.start_at) ||
        typeof row.time_zone !== "string" || !row.time_zone ||
        row.recurrence_rule != null && typeof row.recurrence_rule !== "string" ||
        (row.all_day_start == null) !== (row.all_day_end == null) ||
        row.all_day_start != null && (!isDate(row.all_day_start) || !isDate(row.all_day_end) || row.all_day_end <= row.all_day_start)) {
      throw new Error("invalid_calendar_event_response");
    }
    return {
      id: row.id, journeyId, title: row.title, version: row.version, startAt: row.start_at, endAt: row.end_at,
      allDay: row.all_day_start != null, recurring: row.recurrence_rule != null,
      allDayStart: row.all_day_start ?? null, allDayEnd: row.all_day_end ?? null,
      deleted: row.deleted_at != null
    };
  }

  function dateInZone(instant, timeZone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date(instant));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  function lastIncludedInstant(timestamp) {
    const fraction = /\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/.exec(timestamp)?.[1] || "";
    // Preserve PostgreSQL sub-millisecond values when interpreting an exclusive end.
    return Date.parse(timestamp) - (/[1-9]/.test(fraction.slice(3)) ? 0 : 1);
  }

  function isScheduled(habit, effective, date) {
    if (habit.status !== "active" || habit.deleted || date < habit.startDate || habit.endDate && date > habit.endDate) {
      return false;
    }
    const selected = effective.get(habit.id)?.definition || habit.definition;
    const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    return selected.frequency === "daily" || selected.days.includes(weekday);
  }

  function createDaySourcesRepository(api) {
    if (!api || typeof api.request !== "function") throw new TypeError("API client is required");

    async function listEvents({ journeyId, fromDate, toDate, timeZone, signal } = {}) {
      if (!isUuid(journeyId) || !isDate(fromDate) || !isDate(toDate) || fromDate > toDate ||
          typeof timeZone !== "string" || !timeZone) {
        throw new TypeError("invalid_calendar_event_range");
      }
      new Intl.DateTimeFormat("en", { timeZone }).format(0);
      const start = Date.parse(`${fromDate}T00:00:00.000Z`);
      const end = Date.parse(`${toDate}T00:00:00.000Z`);
      if (end - start > 365 * 86_400_000) throw new TypeError("invalid_calendar_event_range");
      const from = new Date(start - 86_400_000).toISOString();
      const to = new Date(end + 2 * 86_400_000).toISOString();
      if (!isTimestamp(from) || !isTimestamp(to)) throw new TypeError("invalid_calendar_event_range");
      const rows = await listPages(api, "calendar-events", {
        query: {
          journey_id: journeyId, overlap_from: from, overlap_to: to,
          all_day_date_from: fromDate, all_day_date_to: toDate
        },
        signal
      });
      return rows.map(row => mapEvent(row, journeyId)).filter(event => !event.deleted).map(event => {
        const startDate = event.allDay ? event.allDayStart : dateInZone(Date.parse(event.startAt), timeZone);
        const lastDate = event.allDay ? shiftDate(event.allDayEnd, -1) : dateInZone(lastIncludedInstant(event.endAt), timeZone);
        return { ...event, startDate, lastDate, startsBeforeRange: startDate < fromDate };
      }).filter(event => event.startDate <= toDate && event.lastDate >= fromDate)
        .sort((a, b) => a.startDate.localeCompare(b.startDate) ||
          Date.parse(a.startAt) - Date.parse(b.startAt) || a.id.localeCompare(b.id));
    }

    async function load({ journeyId, today, timeZone, signal } = {}) {
      if (!isUuid(journeyId) || !isDate(today) || typeof timeZone !== "string" || !timeZone) {
        throw new TypeError("invalid_daily_source_request");
      }
      new Intl.DateTimeFormat("en", { timeZone }).format(0);
      const [habitRows, revisionRows, recordRows, events] = await Promise.all([
        listPages(api, "habits", { query: { journey_id: journeyId }, signal }),
        listPages(api, "habit-revisions", { query: { journey_id: journeyId, effective_date_to: today }, signal }),
        listPages(api, "habit-records", {
          query: { journey_id: journeyId, local_date_from: shiftDate(today, -29), local_date_to: today }, signal
        }),
        listEvents({ journeyId, fromDate: today, toDate: today, timeZone, signal })
      ]);
      const habits = habitRows.map(row => mapHabit(row, journeyId));
      const revisions = revisionRows.map(mapRevision);
      const habitIds = new Set(habits.map(habit => habit.id));
      const effective = new Map();
      for (const revision of revisions) {
        const previous = effective.get(revision.habitId);
        if (habitIds.has(revision.habitId) && revision.effectiveDate <= today &&
            (!previous || revision.effectiveDate > previous.effectiveDate)) {
          effective.set(revision.habitId, revision);
        }
      }
      const records = recordRows.map(mapRecord).filter(record => habitIds.has(record.habitId));
      const byHabitAndDate = new Map();
      const heatmapRecords = new Map();
      for (const record of records) {
        const key = `${record.habitId}:${record.date}`;
        if (byHabitAndDate.has(key)) throw new Error("duplicate_habit_record_response");
        byHabitAndDate.set(key, record);
        if (record.status !== "skipped") {
          if (!heatmapRecords.has(record.habitId)) heatmapRecords.set(record.habitId, {});
          heatmapRecords.get(record.habitId)[record.date] = {
            status: record.status === "completed" ? "completed" : "incomplete"
          };
        }
      }
      const todayHabits = habits.filter(habit => isScheduled(habit, effective, today)).map(habit => ({
        id: habit.id, name: habit.name, record: byHabitAndDate.get(`${habit.id}:${today}`) || null
      }));
      const heatmapHabits = habits.map(habit => ({
        id: habit.id, name: habit.name, records: heatmapRecords.get(habit.id) || {}
      }));
      const yesterday = shiftDate(today, -1);
      const yesterdayRecords = records.filter(record => record.date === yesterday);
      return Object.freeze({
        timeZone,
        todayHabits,
        heatmapHabits,
        yesterdayHabits: {
          completed: yesterdayRecords.filter(record => record.status === "completed").length,
          partial: yesterdayRecords.filter(record => record.status === "partial").length,
          skipped: yesterdayRecords.filter(record => record.status === "skipped").length,
          total: yesterdayRecords.length
        },
        events: events.map(event => ({ ...event, startsBeforeToday: event.startsBeforeRange }))
      });
    }

    async function saveHabitRecord({ habitId, date, status, record = null, signal } = {}) {
      if (!isUuid(habitId) || !isDate(date) || !["completed", "partial", "skipped"].includes(status) ||
          record !== null && (!isUuid(record.id) || record.habitId !== habitId || record.date !== date ||
            !Number.isInteger(record.version) || record.version < 1)) {
        throw new TypeError("invalid_habit_record_input");
      }
      const options = record
        ? { method: "PATCH", query: { id: record.id }, expectedVersion: record.version, body: { status }, signal }
        : { method: "POST", body: { habit_id: habitId, local_date: date, status }, signal };
      const rows = await api.request("habit-records", options);
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error("habit_record_save_not_confirmed");
      const saved = mapRecord(rows[0]);
      if (saved.habitId !== habitId || saved.date !== date || saved.status !== status ||
          record && (saved.id !== record.id || saved.version <= record.version)) {
        throw new Error("habit_record_save_not_confirmed");
      }
      return saved;
    }

    async function saveEventTitle({ event, title, signal } = {}) {
      if (!event || !isUuid(event.id) || !isUuid(event.journeyId) ||
          !Number.isInteger(event.version) || event.version < 1 || event.recurring || event.deleted ||
          typeof title !== "string" || !title.trim() || title.trim().length > 200) {
        throw new TypeError("invalid_calendar_event_input");
      }
      const cleanTitle = title.trim();
      const rows = await api.request("calendar-events", {
        method: "PATCH", query: { id: event.id }, expectedVersion: event.version,
        body: { title: cleanTitle }, signal
      });
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error("calendar_event_save_not_confirmed");
      const saved = mapEvent(rows[0], event.journeyId);
      if (saved.id !== event.id || saved.title !== cleanTitle || saved.version <= event.version ||
          saved.recurring || saved.deleted) {
        throw new Error("calendar_event_save_not_confirmed");
      }
      return saved;
    }

    return Object.freeze({ load, listEvents, saveHabitRecord, saveEventTitle });
  }

  return Object.freeze({ createDaySourcesRepository });
});
