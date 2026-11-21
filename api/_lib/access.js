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
      if (action === "status" && method === "GET") rpc = "get_own_access_status";
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
            code: status === 401 ? "unauthenticated" : status === 403 ? "forbidden" :
              action === "redeem" ? "activation_code_rejected" : "access_request_failed"
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

module.exports = { createAccessHandler, activationCodeHash };
