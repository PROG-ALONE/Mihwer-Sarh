"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createTaskRepository, mapTask, toTimelineEvent } = require("./task-repository");

const journeyId = "00000000-0000-4000-8000-000000000011";
const taskId = "00000000-0000-4000-8000-000000000021";

function taskRow(overrides = {}) {
  return {
    id: taskId,
    journey_id: journeyId,
    title: "Read a chapter",
    start_date: "2026-11-20",
    due_date: "2026-11-20",
    status: "active",
    priority: 2,
    estimate_minutes: 30,
    version: 1,
    created_at: "2026-11-20T08:00:00Z",
    updated_at: "2026-11-20T08:00:00Z",
    ...overrides
  };
}

test("repository lists tasks from the journey source and excludes archived rows", async () => {
  let resource;
  let options;
  const repository = createTaskRepository({
    async request(name, requestOptions) {
      resource = name;
      options = requestOptions;
      return [taskRow(), taskRow({ id: "00000000-0000-4000-8000-000000000022", status: "archived" })];
    }
  });
  const tasks = await repository.list(journeyId);
  assert.equal(resource, "tasks");
  assert.equal(options.query.journey_id, journeyId);
  assert.deepEqual(tasks.map(task => task.id), [taskId]);
});

test("create validates fields and maps only a confirmed server representation", async () => {
  let requestOptions;
  const repository = createTaskRepository({
    async request(_resource, options) {
      requestOptions = options;
      return [taskRow()];
    }
  });
  const created = await repository.create(journeyId, {
    title: "  Read a chapter ",
    startDate: "2026-11-20",
    priority: "urgent-important",
    estimateMinutes: 45
  });
  assert.equal(requestOptions.method, "POST");
  assert.deepEqual(requestOptions.body, {
    journey_id: journeyId,
    title: "Read a chapter",
    task_kind: "task",
    start_date: "2026-11-20",
    due_date: "2026-11-20",
    status: "active",
    priority: 5,
    estimate_minutes: 45
  });
  assert.equal(created.id, taskId);
  await assert.rejects(repository.create(journeyId, { title: "bad date", startDate: "2026-02-31" }), /invalid_task_input/);
});

test("get-by-id uses the source table and returns null for missing tasks", async () => {
  let options;
  const repository = createTaskRepository({
    async request(_resource, requestOptions) {
      options = requestOptions;
      return [];
    }
  });
  assert.equal(await repository.getById(taskId), null);
  assert.equal(options.query.id, taskId);
});

test("updates use optimistic version checks and map the returned row", async () => {
  let options;
  const repository = createTaskRepository({
    async request(_resource, requestOptions) {
      options = requestOptions;
      return [taskRow({ title: "Updated task", status: "completed", version: 2 })];
    }
  });
  const current = mapTask(taskRow());
  const updated = await repository.update(current, { title: "Updated task", status: "completed" });
  assert.equal(options.method, "PATCH");
  assert.equal(options.query.id, taskId);
  assert.equal(options.expectedVersion, 1);
  assert.deepEqual(options.body, { title: "Updated task", status: "completed", deleted_at: null });
  assert.equal(updated.version, 2);
});

test("timeline projection retains the original task id and does not create stored copies", () => {
  const task = mapTask(taskRow());
  const event = toTimelineEvent(task);
  assert.equal(event.sourceId, task.id);
  assert.equal(event.sourceType, "task");
  assert.equal(event.id, `task:${task.id}`);
  assert.equal(event.localDate, task.startDate);
});

test("invalid server task shapes fail closed", () => {
  assert.throws(() => mapTask(taskRow({ start_date: "not-a-date" })), /invalid_task_response/);
  assert.throws(() => mapTask(taskRow({ version: 0 })), /invalid_task_response/);
});
