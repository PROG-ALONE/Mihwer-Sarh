"use strict";

const { createHash } = require("node:crypto");
const { IdentityError, getAuthenticatedUser, requirePermission } = require("./identity");
const { databaseRequest } = require("./mihwar-data");

function response(status, body) {
  return {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    body
  };
}

function activationCodeHash(code) {
  if (typeof code !== "string") throw new IdentityError("invalid_activation_code", 400);
  const normalized = code.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z2-9]{12,64}$/.test(normalized)) throw new IdentityError("invalid_activation_code", 400);
  return `\\x${createHash("sha256").update(normalized, "utf8").digest("hex")}`;
}

function activationCodeFromBody(body) {
  let payload = body;
  if (typeof body === "string" && body.length <= 1_000) {
    try { payload = JSON.parse(body); } catch { throw new IdentityError("invalid_activation_code", 400); }
  }
  return activationCodeHash(payload?.code);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalidAdminInput() {
  return new IdentityError("invalid_admin_input", 400);
}

function parsePayload(body) {
  if (body == null || body === "") return {};
  if (typeof body === "string") {
    if (body.length > 4_000) throw invalidAdminInput();
    try { body = JSON.parse(body); } catch { throw invalidAdminInput(); }
  }
  if (typeof body !== "object" || Array.isArray(body)) throw invalidAdminInput();
  return body;
}

function uuidField(value) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) throw invalidAdminInput();
  return value.toLowerCase();
}

function integerField(value, min, max, fallback) {
  if (value == null && fallback !== undefined) return fallback;
  const number = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  if (!Number.isInteger(number) || number < min || number > max) throw invalidAdminInput();
  return number;
}

function timestampField(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.length > 40 || Number.isNaN(Date.parse(value))) throw invalidAdminInput();
  return new Date(value).toISOString();
}

function limitFrom(query) {
  return integerField(query?.limit, 1, 200, 50);
}

const ADMIN_ACTIONS = {
  "admin-status": { method: "GET", rpc: "get_own_owner_status", body: () => ({}) },
  "admin-overview": { method: "GET", rpc: "admin_access_overview", body: (_p, q) => ({ p_limit: limitFrom(q) }) },
  "admin-codes": {
    method: "GET",
    rpc: "admin_list_activation_codes",
    body: (_p, q) => {
      const status = q?.status ?? "all";
      if (!["all", "active", "disabled", "expired", "exhausted"].includes(status)) throw invalidAdminInput();
      return { p_status: status, p_limit: limitFrom(q) };
    }
  },
  "admin-redemptions": {
    method: "GET",
    rpc: "admin_list_redemptions",
    body: (_p, q) => ({ p_code_id: q?.code_id ? uuidField(q.code_id) : null, p_limit: limitFrom(q) })
  },
  "admin-discounts": { method: "GET", rpc: "admin_list_discount_codes", body: (_p, q) => ({ p_limit: limitFrom(q) }) },
  "admin-audit": { method: "GET", rpc: "admin_list_audit_events", body: (_p, q) => ({ p_limit: limitFrom(q) }) },
  "admin-issue-code": {
    method: "POST",
    rpc: "admin_issue_activation_code",
    body: (p) => ({
      p_duration_days: integerField(p.duration_days, 1, 3650),
      p_max_uses: integerField(p.max_uses, 1, 100_000),
      p_valid_until: timestampField(p.valid_until)
    })
  },
  "admin-disable-code": { method: "POST", rpc: "admin_disable_activation_code", body: (p) => ({ p_code_id: uuidField(p.code_id) }) },
  "admin-grant": {
    method: "POST",
    rpc: "admin_grant_access",
    body: (p) => ({ p_owner: uuidField(p.user_id), p_days: integerField(p.days, 1, 3650) })
  },
  "admin-suspend": {
    method: "POST",
    rpc: "admin_set_suspension",
    body: (p) => {
      if (typeof p.suspended !== "boolean") throw invalidAdminInput();
      return { p_owner: uuidField(p.user_id), p_suspended: p.suspended };
    }
  },
  "admin-issue-discount": {
    method: "POST",
    rpc: "admin_issue_discount_code",
    body: (p) => {
      if (typeof p.label !== "string" || p.label.trim().length < 1 || p.label.length > 80) throw invalidAdminInput();
      if (!["percent", "fixed"].includes(p.kind)) throw invalidAdminInput();
      if (typeof p.amount !== "number" || !Number.isFinite(p.amount) || p.amount <= 0 || p.amount > 1_000_000) throw invalidAdminInput();
      const currency = p.currency == null || p.currency === "" ? null : String(p.currency).toUpperCase();
      if (currency !== null && !/^[A-Z]{3}$/.test(currency)) throw invalidAdminInput();
      return {
        p_label: p.label.trim(),
        p_kind: p.kind,
        p_amount: p.amount,
        p_currency: currency,
        p_starts_at: timestampField(p.starts_at),
        p_ends_at: timestampField(p.ends_at),
        p_max_uses: integerField(p.max_uses, 1, 1_000_000),
        p_per_user_limit: integerField(p.per_user_limit, 1, 100, 1)
      };
    }
  },
  "admin-disable-discount": { method: "POST", rpc: "admin_disable_discount_code", body: (p) => ({ p_code_id: uuidField(p.code_id) }) }
};

async function createAccessHandler({
  provider,
  env = process.env,
  fetchImpl = fetch
} = {}) {
  return async function handler(request) {
    try {
      const identity = await getAuthenticatedUser(request, provider);
      requirePermission(identity, "data:read");
      const action = request.query?.action;
      const method = String(request.method || "GET").toUpperCase();
      let rpc;
      let body = {};
      const adminAction = Object.hasOwn(ADMIN_ACTIONS, action) ? ADMIN_ACTIONS[action] : null;
      if (adminAction) {
        if (method !== adminAction.method) return response(405, { error: { code: "method_not_allowed" } });
        rpc = adminAction.rpc;
        body = adminAction.body(method === "POST" ? parsePayload(request.body) : {}, request.query);
      } else if (action === "status" && method === "GET") rpc = "get_own_access_status";
      else if (action === "start" && method === "POST") rpc = "start_own_trial";
      else if (action === "redeem" && method === "POST") {
        rpc = "redeem_activation_code";
        body = { p_code_hash: activationCodeFromBody(request.body) };
      } else {
        return response(405, { error: { code: "method_not_allowed" } });
      }

      requirePermission(identity, method === "GET" ? "data:read" : "data:write");
      const result = await databaseRequest({
        baseUrl: env.MIHWAR_SUPABASE_URL,
        publicKey: env.MIHWAR_SUPABASE_ANON_KEY,
        identity,
        table: `rpc/${rpc}`,
        query: {},
        method: "POST",
        body,
        fetchImpl
      });
      if (!result.response.ok) {
        const status = result.response.status === 401 ? 401 : result.response.status === 403 ? 403 : 400;
        return response(status, {
          error: {
            code: status === 401 ? "unauthenticated" : status === 403 ? (adminAction ? "owner_required" : "forbidden") :
              action === "redeem" ? "activation_code_rejected" : adminAction ? "admin_request_rejected" : "access_request_failed"
          }
        });
      }
      return response(200, { data: result.data });
    } catch (error) {
      if (error instanceof IdentityError) return response(error.status, { error: { code: error.code } });
      return response(500, { error: { code: "internal_error" } });
    }
  };
}

module.exports = { createAccessHandler, activationCodeHash, ADMIN_ACTIONS };
