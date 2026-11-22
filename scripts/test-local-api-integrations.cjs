"use strict";

const { spawn, spawnSync } = require("node:child_process");
const { createServer } = require("node:http");
const { randomBytes, randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join, resolve } = require("node:path");
const { createHandler } = require("../api/_lib/mihwar-data");
const { IdentityError } = require("../api/_lib/identity");

const LOCAL_PROJECT_ID = "mihwer-isolated-test";

function decodeClaims(token) {
  const encoded = token.split(".")[1];
  if (!encoded) throw new Error("local_auth_token_invalid");
  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
}

async function expectJson(response, message) {
  if (!response.ok) throw new Error(`${message}:${response.status}`);
  return response.json();
}

async function runNodeTests(env) {
  for (const testFile of [
    "frontend/server.integration.test.cjs",
    "frontend/module-records.integration.test.cjs"
  ]) {
    const code = await new Promise((resolvePromise, reject) => {
      const child = spawn(process.execPath, ["--test", testFile], {
        cwd: resolve(__dirname, ".."),
        env,
        stdio: "inherit"
      });
      child.once("error", reject);
      child.once("exit", (exitCode, signal) => {
        if (signal) reject(new Error(`local_api_tests_interrupted:${signal}`));
        else resolvePromise(exitCode ?? 1);
      });
    });
    if (code !== 0) return code;
  }
  return 0;
}

async function readRequestBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 100_000) throw new IdentityError("validation_failed", 400);
    chunks.push(chunk);
  }
  if (size === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new IdentityError("validation_failed", 400);
  }
}

async function main() {
  const workdir = process.env.MIHWAR_LOCAL_SUPABASE_WORKDIR;
  if (!workdir) throw new Error("Set MIHWAR_LOCAL_SUPABASE_WORKDIR to the isolated local Supabase test workdir.");
  const isolatedWorkdir = resolve(workdir);
  const config = readFileSync(join(isolatedWorkdir, "supabase", "config.toml"), "utf8");
  if (!/^project_id\s*=\s*"mihwer-isolated-test"\s*$/m.test(config) ||
      !/\[auth\.hook\.custom_access_token\]\s*\nenabled\s*=\s*true/.test(config)) {
    throw new Error("Refusing local API tests: isolated project or trusted-identity test hook is not configured.");
  }

  const statusText = spawnSync("supabase", ["status", "--workdir", isolatedWorkdir, "-o", "json"], {
    encoding: "utf8"
  });
  if (statusText.error || statusText.status !== 0) throw new Error("isolated_supabase_status_unavailable");
  const local = JSON.parse(statusText.stdout);
  const baseUrl = local.API_URL;
  const anonKey = local.ANON_KEY;
  const localAdminKey = local.SERVICE_ROLE_KEY;
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(baseUrl || "") || !anonKey || !localAdminKey) {
    throw new Error("isolated_supabase_configuration_invalid");
  }

  const adminHeaders = {
    apikey: localAdminKey,
    authorization: `Bearer ${localAdminKey}`,
    "content-type": "application/json"
  };
  const env = {
    MIHWAR_SUPABASE_URL: baseUrl,
    MIHWAR_SUPABASE_ANON_KEY: anonKey
  };
  const users = [];
  const emailSuffix = randomUUID();

  async function createLocalUser(label) {
    const email = `mihwar-${label}-${emailSuffix}@example.test`;
    const password = `${randomBytes(24).toString("base64url")}A1!`;
    const createdResponse = await fetch(`${baseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ email, password, email_confirm: true })
    });
    const created = await expectJson(createdResponse, "local_auth_user_create_failed");
    const user = created.user || created;
    users.push({ id: user.id, accessToken: null });

    const profileResponse = await fetch(`${baseUrl}/rest/v1/mihwer_users`, {
      method: "POST",
      headers: { ...adminHeaders, prefer: "return=minimal" },
      body: JSON.stringify({ id: user.id })
    });
    if (!profileResponse.ok) throw new Error(`local_profile_create_failed:${profileResponse.status}`);

    const signInResponse = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const session = await expectJson(signInResponse, "local_auth_signin_failed");
    const claims = decodeClaims(session.access_token);
    if (claims.sub !== user.id || claims.mihwer_user_id !== user.id) {
      throw new Error("local_auth_identity_claim_invalid");
    }

    const trialResponse = await fetch(`${baseUrl}/rest/v1/rpc/start_own_trial`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json"
      },
      body: "{}"
    });
    const trial = await expectJson(trialResponse, "local_trial_start_failed");
    if (trial.status !== "trial_active") throw new Error("local_trial_start_invalid");
    users.at(-1).accessToken = session.access_token;
    return session.access_token;
  }

  let server;
  let testStatus = 1;
  try {
    const tokens = [await createLocalUser("owner"), await createLocalUser("other")];
    const provider = {
      async verifyIdentity(token) {
        const userResponse = await fetch(`${baseUrl}/auth/v1/user`, {
          headers: { apikey: anonKey, authorization: `Bearer ${token}` }
        });
        if (!userResponse.ok) throw new IdentityError("unauthenticated", 401);
        const user = await userResponse.json();
        const claims = decodeClaims(token);
        if (claims.sub !== user.id || claims.mihwer_user_id !== user.id) {
          throw new IdentityError("invalid_verified_identity", 401);
        }
        return {
          issuer: `${baseUrl}/auth/v1`,
          subject: user.id,
          mihwarUserId: user.id,
          databaseAccessToken: token,
          permissions: ["data:read", "data:write"]
        };
      }
    };
    const handler = await createHandler({ provider, env });

    server = createServer(async (request, response) => {
      try {
        const url = new URL(request.url, "http://127.0.0.1");
        const segments = url.pathname.split("/").filter(Boolean);
        if (segments.length !== 3 || segments[0] !== "api" || segments[1] !== "v1") {
          response.writeHead(404, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: { code: "not_found" } }));
          return;
        }
        const query = Object.fromEntries(url.searchParams.entries());
        query.resource = segments[2];
        const result = await handler({
          method: request.method,
          headers: request.headers,
          query,
          body: await readRequestBody(request)
        });
        response.writeHead(result.status, result.headers);
        response.end(JSON.stringify(result.body));
      } catch (error) {
        const status = error instanceof IdentityError ? error.status : 500;
        response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
        response.end(JSON.stringify({ error: { code: error instanceof IdentityError ? error.code : "local_test_server_error" } }));
      }
    });

    await new Promise((resolvePromise, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolvePromise);
    });
    const address = server.address();
    const host = `127.0.0.1:${address.port}`;
    testStatus = await runNodeTests({
      ...process.env,
      MIHWAR_INTEGRATION_API_URL: `http://${host}/api/v1`,
      MIHWAR_INTEGRATION_ALLOWED_HOST: host,
      MIHWAR_INTEGRATION_ENV: "isolated-test",
      MIHWAR_INTEGRATION_BEARER_TOKEN: tokens[0],
      MIHWAR_INTEGRATION_SECOND_BEARER_TOKEN: tokens[1]
    });
  } finally {
    if (server?.listening) await new Promise(resolvePromise => server.close(resolvePromise));
    for (const user of users.reverse()) {
      const deleted = await fetch(`${baseUrl}/auth/v1/admin/users/${user.id}`, {
        method: "DELETE",
        headers: adminHeaders
      });
      if (!deleted.ok) throw new Error(`local_test_user_cleanup_failed:${deleted.status}`);
    }
  }
  process.exitCode = testStatus;
}

main().catch(error => {
  process.stderr.write(`${error.message || "local_api_test_failed"}\n`);
  process.exitCode = 1;
});
