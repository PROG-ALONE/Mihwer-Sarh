"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const apiBase = process.env.MIHWAR_INTEGRATION_API_URL;
const bearerToken = process.env.MIHWAR_INTEGRATION_BEARER_TOKEN;
const secondBearerToken = process.env.MIHWAR_INTEGRATION_SECOND_BEARER_TOKEN;
const integrationEnvironment = process.env.MIHWAR_INTEGRATION_ENV;
const allowedHost = process.env.MIHWAR_INTEGRATION_ALLOWED_HOST;
const configured = Boolean(apiBase && bearerToken && integrationEnvironment === "isolated-test" && allowedHost);

function integrationBase() {
  const base = new URL(apiBase);
  if (base.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(base.hostname)) {
    throw new Error("Remote integration tests require HTTPS");
  }
  if (base.host !== allowedHost) {
    throw new Error("Integration API host does not exactly match MIHWAR_INTEGRATION_ALLOWED_HOST");
  }
  if (!base.pathname.replace(/\/$/, "").endsWith("/api/v1")) {
    throw new Error("MIHWAR_INTEGRATION_API_URL must target the versioned Mihwar API");
  }
  return base;
}

async function rawRequest(base, token, resource, method = "GET", { query = {}, body } = {}) {
  const url = new URL(`${base.pathname.replace(/\/$/, "")}/${resource}`, base.origin);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      accept: "application/json",
      ...(body === undefined ? {} : { "content-type": "application/json" })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  return { response, payload: text ? JSON.parse(text) : null };
}

function authenticatedRequest(base, token) {
  return async (resource, method = "GET", options = {}) => {
    const { response, payload } = await rawRequest(base, token, resource, method, options);
    assert.ok(response.ok, `${method} ${resource} failed with HTTP ${response.status}`);
    return payload?.data;
  };
}

async function activeJourney(request, stamp) {
  const journeys = await request("journeys", "GET", { query: { limit: 100 } });
  const existing = journeys.find(item => item.status === "active");
  if (existing) return { journey: existing, created: false };
  const created = await request("journeys", "POST", {
    body: { title: `Temporary ${stamp}`, time_zone: "UTC", status: "active" }
  });
  assert.ok(Array.isArray(created) && created.length === 1);
  return { journey: created[0], created: true };
}

async function archiveTemporaryTask(request, id) {
  if (!id) return;
  const rows = await request("tasks", "GET", { query: { id, limit: 1 } });
  const row = rows[0];
  if (row && row.status !== "archived") {
    await request("tasks", "PATCH", {
      query: { id: row.id, expected_version: row.version },
      body: { status: "archived", deleted_at: new Date().toISOString() }
    });
  }
}

async function archiveTemporaryJourney(request, id) {
  const journeys = await request("journeys", "GET", { query: { id, limit: 1 } });
  const journey = journeys[0];
  if (journey?.status === "active") {
    await request("journeys", "PATCH", {
      query: { id: journey.id, expected_version: journey.version },
      body: { status: "archived" }
    });
  }
}

test("isolated Mihwar API persists a task across requests and supports edit, completion and archive",
  { skip: !configured && "Requires an explicitly allow-listed isolated test deployment and test identity" },
  async () => {
    const base = integrationBase();
    const request = authenticatedRequest(base, bearerToken);
    const stamp = `integration-${randomUUID()}`;
    const { journey, created: createdJourney } = await activeJourney(request, stamp);
    let task;
    try {
      const created = await request("tasks", "POST", {
        body: {
          journey_id: journey.id,
          title: `Temporary task ${stamp}`,
          task_kind: "task",
          start_date: new Date().toISOString().slice(0, 10),
          due_date: new Date().toISOString().slice(0, 10),
          status: "active",
          priority: 2,
          estimate_minutes: 5
        }
      });
      assert.ok(Array.isArray(created) && created.length === 1);
      task = created[0];

      const reloaded = await request("tasks", "GET", { query: { id: task.id, limit: 1 } });
      assert.equal(reloaded[0]?.id, task.id);
      assert.equal(reloaded[0]?.title, task.title);

      const updated = await request("tasks", "PATCH", {
        query: { id: task.id, expected_version: task.version },
        body: { title: `Updated ${stamp}` }
      });
      assert.equal(updated[0]?.title, `Updated ${stamp}`);

      const stale = await rawRequest(base, bearerToken, "tasks", "PATCH", {
        query: { id: task.id, expected_version: task.version },
        body: { title: "Stale update" }
      });
      assert.equal(stale.response.status, 409);

      const completed = await request("tasks", "PATCH", {
        query: { id: task.id, expected_version: updated[0].version },
        body: { status: "completed" }
      });
      assert.equal(completed[0]?.status, "completed");

      const restored = await request("tasks", "GET", { query: { id: task.id, limit: 1 } });
      assert.equal(restored[0]?.status, "completed");
      const archived = await request("tasks", "PATCH", {
        query: { id: task.id, expected_version: restored[0].version },
        body: { status: "archived", deleted_at: new Date().toISOString() }
      });
      assert.equal(archived[0]?.status, "archived");
    } finally {
      await archiveTemporaryTask(request, task?.id);
      if (createdJourney) await archiveTemporaryJourney(request, journey.id);
    }
  });

test("isolated Mihwar API rejects unauthenticated task reads and writes",
  { skip: !configured && "Requires an explicitly allow-listed isolated test deployment and test identity" },
  async () => {
    const base = integrationBase();
    const read = await rawRequest(base, null, "tasks");
    const write = await rawRequest(base, null, "tasks", "POST", {
      body: { title: "Unauthenticated task", start_date: new Date().toISOString().slice(0, 10) }
    });
    assert.equal(read.response.status, 401);
    assert.equal(write.response.status, 401);
  });

test("isolated Mihwar API prevents cross-user task access and owner forgery",
  { skip: !(configured && secondBearerToken) && "Requires two distinct identities in an isolated test deployment" },
  async () => {
    if (secondBearerToken === bearerToken) {
      throw new Error("The two test identities must use distinct tokens");
    }
    const base = integrationBase();
    const request = authenticatedRequest(base, bearerToken);
    const stamp = `isolation-${randomUUID()}`;
    const { journey, created: createdJourney } = await activeJourney(request, stamp);
    let task;
    try {
      const created = await request("tasks", "POST", {
        body: {
          journey_id: journey.id,
          title: `Temporary ${stamp}`,
          start_date: new Date().toISOString().slice(0, 10)
        }
      });
      assert.ok(Array.isArray(created) && created.length === 1);
      task = created[0];

      const crossRead = await rawRequest(base, secondBearerToken, "tasks", "GET", {
        query: { id: task.id, user_id: task.owner_id }
      });
      assert.equal(crossRead.response.status, 200);
      assert.deepEqual(crossRead.payload?.data, []);

      const crossUpdate = await rawRequest(base, secondBearerToken, "tasks", "PATCH", {
        query: { id: task.id, expected_version: task.version },
        body: { title: "Unauthorized update" }
      });
      assert.ok([403, 404, 409].includes(crossUpdate.response.status),
        `Cross-user update unexpectedly returned HTTP ${crossUpdate.response.status}`);

      const forgedOwner = await rawRequest(base, secondBearerToken, "tasks", "POST", {
        body: {
          owner_id: task.owner_id,
          journey_id: journey.id,
          title: `Forged ${stamp}`,
          start_date: new Date().toISOString().slice(0, 10)
        }
      });
      assert.equal(forgedOwner.response.status, 400);
      assert.equal(forgedOwner.payload?.error?.code, "owner_fields_are_server_managed");

      const unchanged = await request("tasks", "GET", { query: { id: task.id, limit: 1 } });
      assert.equal(unchanged[0]?.title, task.title);
      assert.equal(unchanged[0]?.version, task.version);
    } finally {
      await archiveTemporaryTask(request, task?.id);
      if (createdJourney) await archiveTemporaryJourney(request, journey.id);
    }
  });

test("isolated Mihwar API filters habit records and overlapping events without exposing another user's data",
  { skip: !(configured && secondBearerToken) && "Requires two distinct identities in an isolated test deployment" },
  async () => {
    if (secondBearerToken === bearerToken) {
      throw new Error("The two test identities must use distinct tokens");
    }
    const base = integrationBase();
    const request = authenticatedRequest(base, bearerToken);
    const stamp = `daily-sources-${randomUUID()}`;
    const { journey, created: createdJourney } = await activeJourney(request, stamp);
    const dateOffset = days => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
    const firstDate = dateOffset(-5);
    const secondDate = dateOffset(-4);
    const concurrentDate = dateOffset(-3);
    let habit;
    const events = [];
    try {
      const createdHabits = await request("habits", "POST", {
        body: { journey_id: journey.id, name: stamp, start_date: dateOffset(-10) }
      });
      assert.equal(createdHabits.length, 1);
      habit = createdHabits[0];
      const records = [];
      for (const localDate of [firstDate, secondDate]) {
        const created = await request("habit-records", "POST", {
          body: { habit_id: habit.id, local_date: localDate, status: "completed", amount: 1 }
        });
        assert.equal(created.length, 1);
        records.push(created[0]);
      }
      const duplicate = await rawRequest(base, bearerToken, "habit-records", "POST", {
        body: { habit_id: habit.id, local_date: firstDate, status: "completed" }
      });
      assert.equal(duplicate.response.status, 409);
      assert.equal(duplicate.payload?.error?.code, "version_conflict");
      const competing = await Promise.all([0, 1].map(() => rawRequest(base, bearerToken, "habit-records", "POST", {
        body: { habit_id: habit.id, local_date: concurrentDate, status: "completed" }
      })));
      assert.deepEqual(competing.map(result => result.response.status).sort(), [201, 409]);
      const concurrentRecords = await request("habit-records", "GET", { query: {
        journey_id: journey.id, local_date_from: concurrentDate, local_date_to: concurrentDate
      } });
      assert.equal(concurrentRecords.filter(row => row.habit_id === habit.id).length, 1);
      const futureRecord = await rawRequest(base, bearerToken, "habit-records", "POST", {
        body: { habit_id: habit.id, local_date: dateOffset(3), status: "completed" }
      });
      assert.equal(futureRecord.response.status, 400);

      const recordWindow = {
        journey_id: journey.id, local_date_from: firstDate, local_date_to: firstDate
      };
      const included = await request("habit-records", "GET", { query: { id: records[0].id, ...recordWindow } });
      const excluded = await request("habit-records", "GET", { query: { id: records[1].id, ...recordWindow } });
      assert.deepEqual(included.map(row => row.id), [records[0].id]);
      assert.deepEqual(excluded, []);
      const wrongJourney = await request("habit-records", "GET", { query: {
        id: records[0].id, ...recordWindow, journey_id: "00000000-0000-4000-8000-000000000099"
      } });
      assert.deepEqual(wrongJourney, []);
      const revisions = await request("habit-revisions", "POST", { body: {
        habit_id: habit.id, effective_date: secondDate, frequency: "daily",
        days: [0, 1, 2, 3, 4, 5, 6], target: 1, unit: "times"
      } });
      assert.equal(revisions.length, 1);
      const futureRevision = await request("habit-revisions", "GET", { query: {
        id: revisions[0].id, journey_id: journey.id, effective_date_to: firstDate
      } });
      assert.deepEqual(futureRevision, []);
      const effectiveRevision = await request("habit-revisions", "GET", { query: {
        id: revisions[0].id, journey_id: journey.id, effective_date_to: secondDate
      } });
      assert.equal(effectiveRevision[0]?.id, revisions[0].id);
      const updated = await request("habit-records", "PATCH", {
        query: { id: records[0].id, expected_version: records[0].version },
        body: { status: "partial" }
      });
      assert.equal(updated[0].status, "partial");
      assert.equal(updated[0].version, records[0].version + 1);
      const stale = await rawRequest(base, bearerToken, "habit-records", "PATCH", {
        query: { id: records[0].id, expected_version: records[0].version },
        body: { status: "skipped" }
      });
      assert.equal(stale.response.status, 409);
      const competingUpdates = await Promise.all(["completed", "skipped"].map(status =>
        rawRequest(base, bearerToken, "habit-records", "PATCH", {
          query: { id: records[0].id, expected_version: updated[0].version },
          body: { status }
        })));
      assert.deepEqual(competingUpdates.map(result => result.response.status).sort(), [200, 409]);
      const currentRecord = await request("habit-records", "GET", { query: { id: records[0].id } });
      assert.equal(currentRecord[0].version, updated[0].version + 1);
      const crossUpdate = await rawRequest(base, secondBearerToken, "habit-records", "PATCH", {
        query: { id: records[0].id, expected_version: currentRecord[0].version },
        body: { status: "skipped" }
      });
      assert.ok([403, 404, 409].includes(crossUpdate.response.status));

      for (const [startAt, endAt] of [
        ["2026-03-09T23:30:00Z", "2026-03-10T00:30:00Z"],
        ["2026-03-09T23:00:00Z", "2026-03-10T00:00:00Z"]
      ]) {
        const created = await request("calendar-events", "POST", {
          body: { journey_id: journey.id, title: stamp, start_at: startAt, end_at: endAt, time_zone: "UTC" }
        });
        assert.equal(created.length, 1);
        events.push(created[0]);
      }
      const eventWindow = {
        journey_id: journey.id,
        overlap_from: "2026-03-10T00:00:00.000Z",
        overlap_to: "2026-03-11T00:00:00.000Z"
      };
      const overlapping = await request("calendar-events", "GET", { query: { id: events[0].id, ...eventWindow } });
      const touching = await request("calendar-events", "GET", { query: { id: events[1].id, ...eventWindow } });
      assert.deepEqual(overlapping.map(row => row.id), [events[0].id]);
      assert.deepEqual(touching, []);

      const eventVersion = events[0].version;
      const renamed = await request("calendar-events", "PATCH", {
        query: { id: events[0].id, expected_version: eventVersion },
        body: { title: `${stamp}-renamed` }
      });
      assert.equal(renamed[0].title, `${stamp}-renamed`);
      assert.equal(renamed[0].version, eventVersion + 1);
      events[0] = renamed[0];
      const reloaded = await request("calendar-events", "GET", { query: { id: events[0].id, ...eventWindow } });
      assert.equal(reloaded[0]?.title, `${stamp}-renamed`);
      const staleEvent = await rawRequest(base, bearerToken, "calendar-events", "PATCH", {
        query: { id: events[0].id, expected_version: eventVersion }, body: { title: "Stale name" }
      });
      assert.equal(staleEvent.response.status, 409);
      const crossEventUpdate = await rawRequest(base, secondBearerToken, "calendar-events", "PATCH", {
        query: { id: events[0].id, expected_version: events[0].version }, body: { title: "Unauthorized name" }
      });
      assert.ok([403, 404, 409].includes(crossEventUpdate.response.status));
      const unchangedEvent = await request("calendar-events", "GET", { query: { id: events[0].id } });
      assert.equal(unchangedEvent[0]?.title, `${stamp}-renamed`);

      for (const [resource, id, query] of [
        ["habit-records", records[0].id, recordWindow],
        ["calendar-events", events[0].id, eventWindow]
      ]) {
        const crossRead = await rawRequest(base, secondBearerToken, resource, "GET", {
          query: { id, ...query }
        });
        assert.equal(crossRead.response.status, 200);
        assert.deepEqual(crossRead.payload?.data, []);
      }
    } finally {
      for (const event of events) {
        await request("calendar-events", "PATCH", {
          query: { id: event.id, expected_version: event.version },
          body: { deleted_at: new Date().toISOString() }
        });
      }
      if (habit) {
        await request("habits", "PATCH", {
          query: { id: habit.id, expected_version: habit.version },
          body: { status: "archived", deleted_at: new Date().toISOString() }
        });
      }
      if (createdJourney) await archiveTemporaryJourney(request, journey.id);
    }
  });
