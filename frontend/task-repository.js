"use strict";

(function attachMihwerTaskRepository(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MihwerTaskRepository = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const priorityValues = Object.freeze({
    "not-urgent-important": 2,
    "urgent-important": 5,
    "not-urgent-not-important": 1,
    "urgent-not-important": 4
  });

  function isDate(value) {
    if (typeof value !== "string" || !DATE.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }

  function assertRow(row, name) {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error(`invalid_${name}_response`);
    return row;
  }

  function mapJourney(value) {
    const row = assertRow(value, "journey");
    if (!UUID.test(row.id) || typeof row.title !== "string" || typeof row.time_zone !== "string") {
      throw new Error("invalid_journey_response");
    }
    return Object.freeze({ id: row.id, title: row.title, timeZone: row.time_zone, status: row.status });
  }

  function mapTask(value) {
    const row = assertRow(value, "task");
    if (
      !UUID.test(row.id) || !UUID.test(row.journey_id) ||
      typeof row.title !== "string" || !isDate(row.start_date) ||
      !["active", "paused", "completed", "archived"].includes(row.status) ||
      !Number.isInteger(row.version) || row.version < 1
    ) {
      throw new Error("invalid_task_response");
    }
    return Object.freeze({
      id: row.id,
      journeyId: row.journey_id,
      title: row.title,
      startDate: row.start_date,
      dueDate: row.due_date || null,
      status: row.status,
      priority: row.priority,
      estimateMinutes: row.estimate_minutes ?? null,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  function toTimelineEvent(task) {
    return Object.freeze({
      id: `task:${task.id}`,
      sourceId: task.id,
      sourceType: "task",
      title: task.title,
      localDate: task.startDate,
      status: task.status,
      startMinute: null,
      durationMinutes: task.estimateMinutes
    });
  }

  function createTaskRepository(api) {
    if (!api || typeof api.request !== "function") throw new TypeError("API client is required");

    async function listJourneys({ signal } = {}) {
      const rows = await api.request("journeys", { query: { limit: 100 }, signal });
      if (!Array.isArray(rows)) throw new Error("invalid_journeys_response");
      return rows.map(mapJourney).filter(journey => journey.status === "active");
    }

    async function createJourney(title, { signal } = {}) {
      const cleanTitle = String(title || "").trim();
      if (!cleanTitle || cleanTitle.length > 160) throw new TypeError("invalid_journey_title");
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const rows = await api.request("journeys", {
        method: "POST",
        body: { title: cleanTitle, time_zone: timeZone, status: "active" },
        signal
      });
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error("journey_create_not_confirmed");
      return mapJourney(rows[0]);
    }

    async function list(journeyId, { signal } = {}) {
      if (!UUID.test(journeyId || "")) throw new TypeError("journey id must be a UUID");
      const rows = await api.request("tasks", {
        query: { journey_id: journeyId, limit: 100 },
        signal
      });
      if (!Array.isArray(rows)) throw new Error("invalid_tasks_response");
      return rows.map(mapTask).filter(task => task.status !== "archived");
    }

    async function getById(id, { signal } = {}) {
      if (!UUID.test(id || "")) throw new TypeError("task id must be a UUID");
      const rows = await api.request("tasks", { query: { id, limit: 1 }, signal });
      if (!Array.isArray(rows)) throw new Error("invalid_task_response");
      if (!rows.length) return null;
      return mapTask(rows[0]);
    }

    async function create(journeyId, input, { signal } = {}) {
      if (!UUID.test(journeyId || "")) throw new TypeError("journey id must be a UUID");
      const title = String(input?.title || "").trim();
      const startDate = String(input?.startDate || "");
      if (!title || title.length > 200 || !isDate(startDate)) throw new TypeError("invalid_task_input");
      if (input.estimateMinutes !== null && input.estimateMinutes !== undefined &&
          (!Number.isInteger(input.estimateMinutes) || input.estimateMinutes < 1 || input.estimateMinutes > 10080)) {
        throw new TypeError("invalid_task_estimate");
      }
      const rows = await api.request("tasks", {
        method: "POST",
        body: {
          journey_id: journeyId,
          title,
          task_kind: "task",
          start_date: startDate,
          due_date: startDate,
          status: "active",
          priority: priorityValues[input.priority] ?? 2,
          estimate_minutes: input.estimateMinutes ?? null
        },
        signal
      });
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error("task_create_not_confirmed");
      return mapTask(rows[0]);
    }

    async function update(task, patch, { signal } = {}) {
      if (!task || !UUID.test(task.id || "") || !Number.isInteger(task.version)) {
        throw new TypeError("invalid_task_reference");
      }
      const body = {};
      if (patch.title !== undefined) {
        const title = String(patch.title).trim();
        if (!title || title.length > 200) throw new TypeError("invalid_task_title");
        body.title = title;
      }
      if (patch.startDate !== undefined) {
        if (!isDate(patch.startDate)) throw new TypeError("invalid_task_date");
        body.start_date = patch.startDate;
        body.due_date = patch.startDate;
      }
      if (patch.estimateMinutes !== undefined) {
        if (patch.estimateMinutes !== null &&
            (!Number.isInteger(patch.estimateMinutes) || patch.estimateMinutes < 1 || patch.estimateMinutes > 10080)) {
          throw new TypeError("invalid_task_estimate");
        }
        body.estimate_minutes = patch.estimateMinutes;
      }
      if (patch.status !== undefined) {
        if (!["active", "completed", "archived"].includes(patch.status)) throw new TypeError("invalid_task_status");
        body.status = patch.status;
        if (patch.status === "archived") body.deleted_at = new Date().toISOString();
        else body.deleted_at = null;
      }
      if (patch.priority !== undefined) {
        if (!(patch.priority in priorityValues)) throw new TypeError("invalid_task_priority");
        body.priority = priorityValues[patch.priority];
      }
      if (!Object.keys(body).length) throw new TypeError("empty_task_update");

      const rows = await api.request("tasks", {
        method: "PATCH",
        query: { id: task.id },
        expectedVersion: task.version,
        body,
        signal
      });
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error("task_update_not_confirmed");
      return mapTask(rows[0]);
    }

    return Object.freeze({ listJourneys, createJourney, list, getById, create, update });
  }

  return Object.freeze({ createTaskRepository, mapJourney, mapTask, toTimelineEvent, priorityValues });
});
