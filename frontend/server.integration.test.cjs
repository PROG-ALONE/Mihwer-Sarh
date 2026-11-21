"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const apiBase = process.env.MIHWAR_INTEGRATION_API_URL;
const bearerToken = process.env.MIHWAR_INTEGRATION_BEARER_TOKEN;
const integrationEnvironment = process.env.MIHWAR_INTEGRATION_ENV;
const allowedHost = process.env.MIHWAR_INTEGRATION_ALLOWED_HOST;
const configured = Boolean(apiBase && bearerToken && integrationEnvironment === "isolated-test" && allowedHost);

test("isolated Mihwar API persists a task across requests and supports edit, completion and archive",
  { skip: !configured && "Requires an explicitly allow-listed isolated test deployment and test identity" },
  async () => {
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

    const request = async (resource, method = "GET", { query = {}, body } = {}) => {
      const url = new URL(`${base.pathname.replace(/\/$/, "")}/${resource}`, base.origin);
      for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
      const response = await fetch(url, {
        method,
        headers: {
          authorization: `Bearer ${bearerToken}`,
          accept: "application/json",
          ...(body === undefined ? {} : { "content-type": "application/json" })
        },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const text = await response.text();
      const payload = text ? JSON.parse(text) : null;
      assert.ok(response.ok, `${method} ${resource} failed with HTTP ${response.status}`);
      return payload?.data;
    };

    const stamp = `integration-${randomUUID()}`;
    const existingJourneys = await request("journeys", "GET", { query: { limit: 100 } });
    let journey = existingJourneys.find(item => item.status === "active");
    let createdJourney = false;
    if (!journey) {
      const journeys = await request("journeys", "POST", {
        body: {
          title: `Temporary ${stamp}`,
          time_zone: "UTC",
          status: "active"
        }
      });
      assert.ok(Array.isArray(journeys) && journeys.length === 1);
      journey = journeys[0];
      createdJourney = true;
    }
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
      if (task?.id && Number.isInteger(task.version)) {
        const latest = await request("tasks", "GET", { query: { id: task.id, limit: 1 } });
        const row = latest[0];
        if (row && row.status !== "archived") {
          await request("tasks", "PATCH", {
            query: { id: row.id, expected_version: row.version },
            body: { status: "archived", deleted_at: new Date().toISOString() }
          });
        }
      }
      if (createdJourney) {
        const currentJourneys = await request("journeys", "GET", { query: { id: journey.id, limit: 1 } });
        const currentJourney = currentJourneys[0];
        if (currentJourney?.status === "active") {
          await request("journeys", "PATCH", {
            query: { id: currentJourney.id, expected_version: currentJourney.version },
            body: { status: "archived" }
          });
        }
      }
    }
  });
