"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createApiClient } = require("./api-client");
const { createTaskRepository, toTimelineEvent } = require("./task-repository");

const journeyId = "00000000-0000-4000-8000-000000000011";
const taskId = "00000000-0000-4000-8000-000000000021";
const ownerId = "00000000-0000-4000-8000-000000000001";

test("mocked task vertical slice creates, updates, projects to timeline and reloads from source", async () => {
  const journey = {
    id: journeyId, owner_id: ownerId, title: "Test journey",
    time_zone: "Asia/Riyadh", status: "active"
  };
  const tasks = new Map();
  const calls = [];
  const client = createApiClient({
    baseUrl: "https://mihwar.test.invalid/api/v1",
    sessionProvider: { async getAccessToken() { return "test-only-bearer"; } },
    maxGetRetries: 0,
    fetchImpl: async (url, options) => {
      const requestUrl = new URL(url);
      calls.push({ requestUrl, options });
      if (options.headers.authorization !== "Bearer test-only-bearer") {
        return new Response(JSON.stringify({ error: { code: "unauthenticated" } }), {
          status: 401, headers: { "content-type": "application/json" }
        });
      }

      if (requestUrl.pathname.endsWith("/journeys") && options.method === "GET") {
        return result([journey]);
      }
      if (requestUrl.pathname.endsWith("/tasks") && options.method === "POST") {
        const row = {
          id: taskId,
          owner_id: ownerId,
          version: 1,
          created_at: "2026-11-20T08:00:00Z",
          updated_at: "2026-11-20T08:00:00Z",
          ...JSON.parse(options.body)
        };
        tasks.set(row.id, row);
        return result([row], 201);
      }
      if (requestUrl.pathname.endsWith("/tasks") && options.method === "PATCH") {
        const row = tasks.get(requestUrl.searchParams.get("id").replace(/^eq\./, ""));
        const expectedVersion = Number(requestUrl.searchParams.get("expected_version"));
        if (!row || row.version !== expectedVersion) return result({ error: { code: "version_conflict" } }, 409);
        Object.assign(row, JSON.parse(options.body), { version: row.version + 1, updated_at: "2026-11-20T09:00:00Z" });
        return result([row]);
      }
      if (requestUrl.pathname.endsWith("/tasks") && options.method === "GET") {
        const id = requestUrl.searchParams.get("id")?.replace(/^eq\./, "");
        const journeyFilter = requestUrl.searchParams.get("journey_id")?.replace(/^eq\./, "");
        const values = [...tasks.values()].filter(row =>
          (!id || row.id === id) && (!journeyFilter || row.journey_id === journeyFilter)
        );
        return result(values);
      }
      return result({ error: { code: "not_found" } }, 404);
    }
  });

  const repository = createTaskRepository(client);
  const journeys = await repository.listJourneys();
  assert.equal(journeys[0].id, journeyId);

  const created = await repository.create(journeyId, {
    title: "Prepare review",
    startDate: "2026-11-20",
    estimateMinutes: 25
  });
  assert.equal(created.status, "active");
  assert.equal(tasks.size, 1);

  const listAfterCreate = await repository.list(journeyId);
  assert.equal(listAfterCreate[0].title, "Prepare review");
  const timeline = toTimelineEvent(listAfterCreate[0]);
  assert.equal(timeline.sourceId, created.id);

  const completed = await repository.update(listAfterCreate[0], { status: "completed" });
  assert.equal(completed.status, "completed");
  assert.equal(completed.version, 2);

  const afterReload = createTaskRepository(client);
  const restored = await afterReload.getById(taskId);
  assert.equal(restored.status, "completed");
  assert.equal((await afterReload.list(journeyId))[0].id, taskId);

  const archived = await afterReload.update(restored, { status: "archived" });
  assert.equal(archived.status, "archived");
  assert.deepEqual(await afterReload.list(journeyId), []);
  assert.ok(calls.length >= 7);
});

function result(data, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { "content-type": "application/json" }
  });
}
