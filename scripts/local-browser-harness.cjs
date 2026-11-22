"use strict";

const { createServer } = require("node:http");
const { randomBytes, randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { extname, resolve, sep } = require("node:path");
const { spawnSync } = require("node:child_process");
const { createHandler } = require("../api/_lib/mihwar-data");
const { createAttachmentHandler } = require("../api/_lib/mihwar-attachments");
const { createAccessHandler } = require("../api/_lib/access");
const { IdentityError } = require("../api/_lib/identity");

const PROJECT_ID = "mihwer-isolated-test";
const WORKDIR = process.env.MIHWAR_LOCAL_SUPABASE_WORKDIR;
const STATIC_ROOT = resolve(__dirname, "..", "public");
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function decodeClaims(token) {
  const encoded = token.split(".")[1];
  if (!encoded) throw new Error("local_auth_token_invalid");
  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
}

function json(response, status, value) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  response.end(JSON.stringify(value));
}

async function bodyJson(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > 100_000) throw new IdentityError("validation_failed", 400);
    chunks.push(chunk);
  }
  if (bytes === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new IdentityError("validation_failed", 400);
  }
}

async function expectJson(response, message) {
  if (!response.ok) throw new Error(`${message}:${response.status}`);
  return response.json();
}

function localStatus(workdir) {
  const result = spawnSync("supabase", ["status", "--workdir", workdir, "-o", "json"], { encoding: "utf8" });
  if (result.error || result.status !== 0) throw new Error("isolated_supabase_status_unavailable");
  return JSON.parse(result.stdout);
}

async function createUser({ baseUrl, anonKey, adminHeaders, suffix, users }, label) {
  const email = `mihwar-browser-${label}-${suffix}@example.test`;
  const password = `${randomBytes(24).toString("base64url")}A1!`;
  const response = await fetch(`${baseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ email, password, email_confirm: true })
  });
  const created = await expectJson(response, "local_test_user_create_failed");
  const user = created.user || created;
  users.push({ id: user.id, accessToken: null });
  const profile = await fetch(`${baseUrl}/rest/v1/mihwer_users`, {
    method: "POST",
    headers: { ...adminHeaders, prefer: "return=minimal" },
    body: JSON.stringify({ id: user.id })
  });
  if (!profile.ok) throw new Error(`local_test_profile_create_failed:${profile.status}`);

  const signedIn = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const session = await expectJson(signedIn, "local_test_signin_failed");
  const claims = decodeClaims(session.access_token);
  if (claims.sub !== user.id || claims.mihwer_user_id !== user.id) {
    throw new Error("local_test_identity_claim_invalid");
  }
  const trial = await fetch(`${baseUrl}/rest/v1/rpc/start_own_trial`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${session.access_token}`,
      "content-type": "application/json"
    },
    body: "{}"
  });
  const trialState = await expectJson(trial, "local_test_trial_start_failed");
  if (trialState.status !== "trial_active") throw new Error("local_test_trial_start_invalid");
  users.at(-1).accessToken = session.access_token;
}

async function serveStatic(request, response) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  } catch {
    json(response, 400, { error: { code: "invalid_path" } });
    return;
  }
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = resolve(STATIC_ROOT, relative);
  if (target !== STATIC_ROOT && !target.startsWith(`${STATIC_ROOT}${sep}`)) {
    json(response, 404, { error: { code: "not_found" } });
    return;
  }
  let content;
  try {
    content = readFileSync(target);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      json(response, 404, { error: { code: "not_found" } });
      return;
    }
    throw error;
  }
  response.writeHead(200, {
    "content-type": MIME_TYPES[extname(target).toLowerCase()] || "application/octet-stream",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  response.end(content);
}

async function main() {
  if (!WORKDIR) throw new Error("Set MIHWAR_LOCAL_SUPABASE_WORKDIR to the isolated local Supabase test workdir.");
  const workdir = resolve(WORKDIR);
  const config = readFileSync(resolve(workdir, "supabase", "config.toml"), "utf8");
  if (!new RegExp(`^project_id\\s*=\\s*"${PROJECT_ID}"\\s*$`, "m").test(config) ||
      !/\[auth\.hook\.custom_access_token\]\s*\nenabled\s*=\s*true/.test(config) ||
      !/enable_signup\s*=\s*false/.test(config)) {
    throw new Error("Refusing browser harness: isolated Mihwar project or local auth hook configuration mismatch.");
  }
  const local = localStatus(workdir);
  const baseUrl = local.API_URL;
  const anonKey = local.ANON_KEY;
  const serviceKey = local.SERVICE_ROLE_KEY;
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(baseUrl || "") || !anonKey || !serviceKey) {
    throw new Error("isolated_supabase_configuration_invalid");
  }
  const adminHeaders = {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    "content-type": "application/json"
  };
  const env = {
    MIHWAR_SUPABASE_URL: baseUrl,
    MIHWAR_SUPABASE_ANON_KEY: anonKey
  };
  const users = [];
  const suffix = randomUUID();
  await createUser({ baseUrl, anonKey, adminHeaders, suffix, users }, "owner");
  await createUser({ baseUrl, anonKey, adminHeaders, suffix, users }, "second");

  const provider = {
    async verifyIdentity(token) {
      const verified = await fetch(`${baseUrl}/auth/v1/user`, {
        headers: { apikey: anonKey, authorization: `Bearer ${token}` }
      });
      if (!verified.ok) throw new IdentityError("unauthenticated", 401);
      const authUser = await verified.json();
      const claims = decodeClaims(token);
      if (claims.sub !== authUser.id || claims.mihwer_user_id !== authUser.id) {
        throw new IdentityError("invalid_verified_identity", 401);
      }
      return {
        issuer: `${baseUrl}/auth/v1`,
        subject: authUser.id,
        mihwarUserId: authUser.id,
        databaseAccessToken: token,
        permissions: ["data:read", "data:write"]
      };
    }
  };
  const dataHandler = await createHandler({ provider, env });
  const attachmentHandler = createAttachmentHandler({ provider, env });
  const accessHandler = await createAccessHandler({ provider, env });
  const handlers = { access: accessHandler, attachments: attachmentHandler };

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      if (url.pathname === "/__mihwer_test/session" && request.method === "GET") {
        const index = url.searchParams.get("user") === "2" ? 1 : url.searchParams.get("user") === "1" ? 0 : -1;
        if (index < 0 || !users[index]) {
          json(response, 400, { error: { code: "invalid_local_test_user" } });
          return;
        }
        json(response, 200, { access_token: users[index].accessToken });
        return;
      }
      if (url.pathname === "/__mihwer_test/health") {
        json(response, 200, { ok: true, project: PROJECT_ID });
        return;
      }
      if (url.pathname.startsWith("/api/v1/")) {
        const resource = url.pathname.slice("/api/v1/".length);
        const query = Object.fromEntries(url.searchParams.entries());
        query.resource = resource;
        const handler = handlers[resource] || dataHandler;
        const result = await handler({
          method: request.method,
          headers: request.headers,
          query,
          body: await bodyJson(request)
        });
        response.writeHead(result.status, result.headers);
        response.end(JSON.stringify(result.body));
        return;
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        json(response, 405, { error: { code: "method_not_allowed" } });
        return;
      }
      await serveStatic(request, response);
    } catch (error) {
      const status = error instanceof IdentityError ? error.status : 500;
      json(response, status, {
        error: { code: error instanceof IdentityError ? error.code : "local_browser_harness_error" }
      });
    }
  });

  const port = Number(process.env.MIHWAR_LOCAL_BROWSER_PORT || 4181);
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolvePromise);
  });
  process.stdout.write(`Isolated local browser harness ready at http://127.0.0.1:${port}/ (two Auth identities; no secrets emitted).\n`);

  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await new Promise(resolvePromise => server.close(resolvePromise));
    for (const user of users.reverse()) {
      const deleted = await fetch(`${baseUrl}/auth/v1/admin/users/${user.id}`, {
        method: "DELETE",
        headers: adminHeaders
      });
      if (!deleted.ok) process.stderr.write(`local_test_user_cleanup_failed:${deleted.status}\n`);
    }
    process.exitCode = 0;
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

main().catch(error => {
  process.stderr.write(`${error.message || "local_browser_harness_failed"}\n`);
  process.exitCode = 1;
});
