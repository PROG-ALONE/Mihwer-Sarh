"use strict";

const { IdentityError, getAuthenticatedUser, requirePermission, resolveMihwarProfile } = require("./identity");

const RESOURCES = Object.freeze({
  "user-preferences": { table: "user_preferences", mode: "read-write", hasId: false, ownerKeyed: true, order: "owner_id.asc", journeyScoped: false },
  journeys: { table: "journeys", mode: "read-write", journeyScoped: false },
  locations: { table: "locations", mode: "read-write", journeyScoped: true },
  paths: { table: "paths", mode: "read-write", journeyScoped: true },
  stations: { table: "stations", mode: "read-write", journeyScoped: true },
  projects: { table: "projects", mode: "read-write", journeyScoped: true },
  goals: { table: "goals", mode: "read-write", journeyScoped: false },
  tasks: { table: "tasks", mode: "read-write", journeyScoped: true },
  "task-occurrences": { table: "task_occurrences", mode: "read-write", journeyScoped: false },
  "task-subtasks": { table: "task_subtasks", mode: "read-write", journeyScoped: false },
  habits: { table: "habits", mode: "read-write", journeyScoped: true },
  "habit-revisions": { table: "habit_revisions", mode: "append", journeyScoped: false },
  "habit-records": { table: "habit_records", mode: "append", journeyScoped: false },
  "project-milestones": { table: "project_milestones", mode: "read-write", journeyScoped: false },
  "goal-project-links": { table: "goal_project_links", mode: "append", hasId: false, order: "goal_id.desc,project_id.desc", journeyScoped: false },
  "goal-task-links": { table: "goal_task_links", mode: "append", hasId: false, order: "goal_id.desc,task_id.desc", journeyScoped: false },
  "goal-habit-links": { table: "goal_habit_links", mode: "append", hasId: false, order: "goal_id.desc,habit_id.desc", journeyScoped: false },
  "calendar-events": { table: "calendar_events", mode: "read-write", journeyScoped: true },
  "daily-reflections": { table: "daily_reflections", mode: "read-write", journeyScoped: true },
  "prayer-records": { table: "prayer_records", mode: "read-write", journeyScoped: true },
  "delete-prayer-records": { rpc: "delete_own_prayer_records", mode: "rpc" },
  "delete-health-records": { rpc: "delete_own_health_records", mode: "rpc" },
  "study-courses": { table: "study_courses", mode: "read-write", journeyScoped: true },
  "study-lessons": { table: "study_lessons", mode: "read-write", journeyScoped: false },
  "study-sessions": { table: "study_sessions", mode: "append", journeyScoped: true },
  "activity-sessions": { table: "activity_sessions", mode: "append", journeyScoped: true },
  "sleep-records": { table: "sleep_records", mode: "read-write", journeyScoped: true },
  "meal-logs": { table: "meal_logs", mode: "read-write", journeyScoped: true },
  notes: { table: "notes", mode: "read-write", journeyScoped: true },
  "note-goal-links": { table: "note_goal_links", mode: "append", hasId: false, order: "note_id.desc,goal_id.desc", journeyScoped: false },
  "note-task-links": { table: "note_task_links", mode: "append", hasId: false, order: "note_id.desc,task_id.desc", journeyScoped: false },
  "note-project-links": { table: "note_project_links", mode: "append", hasId: false, order: "note_id.desc,project_id.desc", journeyScoped: false },
  attachments: { table: "attachments", mode: "read-only", journeyScoped: false },
  "attachment-links": { table: "attachment_links", mode: "read-only", journeyScoped: false },
  "shopping-lists": { table: "shopping_lists", mode: "read-write", journeyScoped: false },
  "shopping-items": { table: "shopping_items", mode: "read-write", journeyScoped: false },
  subscriptions: { table: "subscriptions", mode: "read-write", journeyScoped: false },
  "subscription-occurrences": { table: "subscription_occurrences", mode: "read-only", journeyScoped: false },
  "financial-accounts": { table: "financial_accounts", mode: "read-write", journeyScoped: false },
  "finance-categories": { table: "finance_categories", mode: "read-write", journeyScoped: false },
  budgets: { table: "budgets", mode: "read-write", journeyScoped: false },
  "budget-category-limits": { table: "budget_category_limits", mode: "read-write", journeyScoped: false },
  "financial-transactions": { table: "financial_transactions", mode: "read-only", journeyScoped: false },
  "reminder-rules": { table: "reminder_rules", mode: "read-write", journeyScoped: false }
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const RESERVED_FIELDS = new Set(["owner_id", "actor_id", "mihwar_user_id", "version", "created_at", "updated_at"]);

function validDate(value) {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function response(status, body) {
  return { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, body };
}

function queryValue(request, key) {
  const value = request.query?.[key];
  return typeof value === "string" ? value : undefined;
}

function parseBody(body) {
  if (body && typeof body === "object" && !Buffer.isBuffer(body)) return body;
  if (typeof body !== "string" || body.length > 100_000) throw new IdentityError("validation_failed", 400);
  try {
    return JSON.parse(body);
  } catch {
    throw new IdentityError("validation_failed", 400);
  }
}

function assertSafePayload(payload) {
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    throw new IdentityError("validation_failed", 400);
  }
  if (Object.keys(payload).some((key) => RESERVED_FIELDS.has(key) || key === "id")) {
    throw new IdentityError("owner_fields_are_server_managed", 400);
  }
}

function makeRestUrl(baseUrl, table, query) {
  const url = new URL(`/rest/v1/${table}`, baseUrl);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  return url;
}

async function databaseRequest({ baseUrl, publicKey, identity, table, query, method, body, fetchImpl }) {
  if (!identity.databaseAccessToken) throw new IdentityError("database_identity_unavailable", 503);
  if (!baseUrl || !publicKey) throw new IdentityError("database_configuration_unavailable", 503);
  const url = makeRestUrl(baseUrl, table, query);
  const headers = {
    apikey: publicKey,
    authorization: `Bearer ${identity.databaseAccessToken}`,
    accept: "application/json",
    prefer: "return=representation"
  };
  if (body !== undefined) headers["content-type"] = "application/json";
  const result = await fetchImpl(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await result.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { throw new IdentityError("invalid_database_response", 502); }
  }
  return { response: result, data };
}

async function createHandler({
  provider,
  env = process.env,
  fetchImpl = fetch,
  profileResolver = resolveMihwarProfile
} = {}) {
  return async function handler(request) {
    try {
      const identity = await getAuthenticatedUser(request, provider);
      requirePermission(identity, "data:read");
      const profile = await profileResolver(identity, env, fetchImpl);
      const resource = request.query?.resource;
      const config = RESOURCES[resource];
      if (!config) return response(404, { error: { code: "not_found" } });

      const method = String(request.method || "GET").toUpperCase();
      if (config.mode === "rpc") {
        if (method !== "POST") return response(405, { error: { code: "method_not_allowed" } });
        requirePermission(identity, "data:write");
        const result = await databaseRequest({
          baseUrl: env.MIHWAR_SUPABASE_URL,
          publicKey: env.MIHWAR_SUPABASE_ANON_KEY,
          identity,
          table: `rpc/${config.rpc}`,
          query: {},
          method: "POST",
          body: {},
          fetchImpl
        });
        if (!result.response.ok) {
          const status = result.response.status === 401 ? 401 : result.response.status === 403 ? 403 : 400;
          return response(status, { error: { code: status === 400 ? "database_request_failed" : status === 401 ? "unauthenticated" : "forbidden" } });
        }
        return response(200, { data: result.data });
      }

      const baseQuery = { owner_id: `eq.${profile.id}` };
      let dbMethod;
      let dbBody;

      if (method === "GET") {
        const id = queryValue(request, "id");
        const beforeId = queryValue(request, "before_id");
        const journeyId = queryValue(request, "journey_id");
        const fromDate = queryValue(request, "start_date_from");
        const toDate = queryValue(request, "start_date_to");
        if (id && config.hasId === false) throw new IdentityError("unsupported_filter", 400);
        if (journeyId && !config.journeyScoped) throw new IdentityError("unsupported_filter", 400);
        if (id && !UUID.test(id)) throw new IdentityError("validation_failed", 400);
        if (beforeId !== undefined && (id || config.hasId === false || config.order || !UUID.test(beforeId))) {
          throw new IdentityError("validation_failed", 400);
        }
        if (journeyId && !UUID.test(journeyId)) throw new IdentityError("validation_failed", 400);
        if (fromDate !== undefined || toDate !== undefined) {
          if (resource !== "tasks" || !validDate(fromDate) || !validDate(toDate) || fromDate > toDate) {
            throw new IdentityError("validation_failed", 400);
          }
          baseQuery.and = `(start_date.gte.${fromDate},start_date.lte.${toDate})`;
        }
        if (id) baseQuery.id = `eq.${id}`;
        if (beforeId !== undefined) baseQuery.id = `lt.${beforeId}`;
        if (journeyId) baseQuery.journey_id = `eq.${journeyId}`;
        const limit = Number(queryValue(request, "limit") || 50);
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new IdentityError("invalid_limit", 400);
        baseQuery.limit = String(limit);
        baseQuery.order = config.order || "id.desc";
        dbMethod = "GET";
      } else if (method === "POST") {
        requirePermission(identity, "data:write");
        if (config.mode === "read-only") throw new IdentityError("forbidden", 403);
        dbBody = parseBody(request.body);
        assertSafePayload(dbBody);
        dbBody = { ...dbBody, owner_id: profile.id };
        dbMethod = "POST";
      } else if (method === "PATCH") {
        requirePermission(identity, "data:write");
        if (config.mode !== "read-write") throw new IdentityError("forbidden", 403);
        const id = queryValue(request, "id");
        const expectedVersion = Number(queryValue(request, "expected_version"));
        if (
          (!config.ownerKeyed && !UUID.test(id || "")) ||
          (config.ownerKeyed && id) ||
          !Number.isInteger(expectedVersion) ||
          expectedVersion < 1
        ) {
          throw new IdentityError("validation_failed", 400);
        }
        dbBody = parseBody(request.body);
        assertSafePayload(dbBody);
        if (!Object.keys(dbBody).length) throw new IdentityError("validation_failed", 400);
        if (!config.ownerKeyed) baseQuery.id = `eq.${id}`;
        baseQuery.version = `eq.${expectedVersion}`;
        dbMethod = "PATCH";
      } else {
        return response(405, { error: { code: "method_not_allowed" } });
      }

      const result = await databaseRequest({
        baseUrl: env.MIHWAR_SUPABASE_URL,
        publicKey: env.MIHWAR_SUPABASE_ANON_KEY,
        identity,
        table: config.table,
        query: baseQuery,
        method: dbMethod,
        body: dbBody,
        fetchImpl
      });
      if (!result.response.ok) {
        const status = result.response.status === 401 ? 401 : result.response.status === 403 ? 403 : 400;
        return response(status, { error: { code: status === 400 ? "database_request_failed" : status === 401 ? "unauthenticated" : "forbidden" } });
      }
      if (method === "PATCH" && Array.isArray(result.data) && result.data.length === 0) {
        return response(409, { error: { code: "version_conflict" } });
      }
      return response(method === "POST" ? 201 : 200, { data: result.data });
    } catch (error) {
      if (error instanceof IdentityError) {
        return response(error.status, { error: { code: error.code } });
      }
      return response(500, { error: { code: "internal_error" } });
    }
  };
}

module.exports = { RESOURCES, createHandler, databaseRequest };
