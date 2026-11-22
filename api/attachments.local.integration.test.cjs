"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { createHash, randomBytes, randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { IdentityError } = require("./_lib/identity");
const { createHandler } = require("./_lib/mihwar-data");
const { createAttachmentHandler } = require("./_lib/mihwar-attachments");

const workdir = process.env.MIHWAR_LOCAL_SUPABASE_WORKDIR;
const LOCAL_PROJECT_ID = "mihwer-isolated-test";

function decodeClaims(token) {
  const encoded = token.split(".")[1];
  if (!encoded) throw new Error("local_auth_token_invalid");
  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
}

function expectJson(response, message) {
  if (!response.ok) throw new Error(`${message}:${response.status}`);
  return response.json();
}

test("isolated local Supabase attachment lifecycle with two Auth identities", {
  skip: !workdir,
  timeout: 120_000
}, async () => {
  const configPath = join(workdir, "supabase", "config.toml");
  const config = readFileSync(configPath, "utf8");
  assert.match(config, new RegExp(`project_id\\s*=\\s*"${LOCAL_PROJECT_ID}"`));
  assert.match(config, /\[auth\.hook\.custom_access_token\]\s*\nenabled\s*=\s*true/);

  const statusText = execFileSync("supabase", ["status", "--workdir", workdir, "-o", "json"], { encoding: "utf8" });
  const local = JSON.parse(statusText);
  const baseUrl = local.API_URL;
  const anonKey = local.ANON_KEY;
  const localAdminKey = local.SERVICE_ROLE_KEY;
  assert.match(baseUrl, /^http:\/\/127\.0\.0\.1:\d+$/);
  assert.ok(anonKey && localAdminKey);
  const env = {
    MIHWAR_SUPABASE_URL: baseUrl,
    MIHWAR_SUPABASE_ANON_KEY: anonKey
  };
  const adminHeaders = {
    apikey: localAdminKey,
    authorization: `Bearer ${localAdminKey}`,
    "content-type": "application/json"
  };
  const users = [];
  const emailSuffix = randomUUID();

  async function createLocalUser(label) {
    const email = `mihwar-${label}-${emailSuffix}@example.test`;
    const password = `${randomBytes(24).toString("base64url")}A1!`;
    const createResponse = await fetch(`${baseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ email, password, email_confirm: true })
    });
    const created = await expectJson(createResponse, "local_auth_user_create_failed");
    const user = created.user || created;
    users.push({ id: user.id, email });

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
    assert.equal(claims.sub, user.id);
    assert.equal(claims.mihwer_user_id, user.id);

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
    assert.equal(trial.status, "trial_active");
    return { id: user.id, accessToken: session.access_token };
  }

  const usersInScope = [];
  let note;
  let callData;
  let callAttachment;
  let readyAttachmentId;
  let pendingAttachmentId;
  let invalidAttachmentId;

  try {
    usersInScope.push(await createLocalUser("owner"));
    usersInScope.push(await createLocalUser("other"));

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

    const dataHandler = await createHandler({ provider, env });
    const attachmentHandler = createAttachmentHandler({ provider, env });
    callData = (user, method, resource, body, expectedVersion) => dataHandler({
      method,
      headers: { authorization: `Bearer ${user.accessToken}` },
      query: { resource },
      body,
      ...(expectedVersion ? { expectedVersion } : {})
    });
    callAttachment = (user, method, { action, id, body, token = user.accessToken } = {}) => attachmentHandler({
      method,
      headers: token ? { authorization: `Bearer ${token}` } : {},
      query: { ...(action ? { action } : {}), ...(id ? { id } : {}) },
      body
    });

    const noteResult = await callData(usersInScope[0], "POST", "notes", {
      kind: "note",
      title: `local attachment test ${emailSuffix}`,
      body: "Temporary local integration-test record."
    });
    assert.equal(noteResult.status, 201);
    note = noteResult.body.data[0];

    const bytes = Buffer.from(`local attachment ${emailSuffix}`);
    const prepare = await callAttachment(usersInScope[0], "POST", {
      action: "prepare",
      body: {
        content_type: "text/plain",
        byte_size: bytes.length,
        checksum: createHash("sha256").update(bytes).digest("hex"),
        note_id: note.id
      }
    });
    assert.equal(prepare.status, 201);
    readyAttachmentId = prepare.body.data.id;
    const upload = await fetch(prepare.body.data.upload_url, {
      method: "PUT",
      headers: { "content-type": "text/plain", "x-upsert": "false" },
      body: bytes
    });
    assert.ok(upload.ok, `local_signed_upload_failed:${upload.status}`);

    const finalized = await callAttachment(usersInScope[0], "POST", {
      action: "finalize", body: { id: readyAttachmentId }
    });
    assert.equal(finalized.status, 200);
    assert.equal(finalized.body.data.state, "ready");

    const listing = await callData(usersInScope[0], "GET", "attachments");
    assert.equal(listing.status, 200);
    assert.ok(listing.body.data.some(item => item.id === readyAttachmentId && item.owner_id === usersInScope[0].id));
    const attachmentEndpointListing = await callAttachment(usersInScope[0], "GET");
    assert.equal(attachmentEndpointListing.status, 200);
    assert.ok(attachmentEndpointListing.body.data.some(item => item.id === readyAttachmentId));
    const reloadHandler = await createHandler({ provider, env });
    const reloaded = await reloadHandler({
      method: "GET",
      headers: { authorization: `Bearer ${usersInScope[0].accessToken}` },
      query: { resource: "attachments" }
    });
    assert.ok(reloaded.body.data.some(item => item.id === readyAttachmentId));

    const links = await callData(usersInScope[0], "GET", "attachment-links");
    assert.ok(links.body.data.some(link => link.attachment_id === readyAttachmentId && link.note_id === note.id));
    const download = await callAttachment(usersInScope[0], "GET", { id: readyAttachmentId });
    assert.equal(download.status, 200);
    const downloaded = await fetch(download.body.data.download_url);
    assert.ok(downloaded.ok);
    assert.match(downloaded.headers.get("content-disposition") || "", /attachment/i);
    assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), bytes);

    const crossUserMetadata = await callAttachment(usersInScope[1], "GET", { id: readyAttachmentId });
    assert.equal(crossUserMetadata.status, 404);
    const crossUserAttachmentList = await callAttachment(usersInScope[1], "GET");
    assert.deepEqual(crossUserAttachmentList.body.data, []);
    const crossUserList = await callData(usersInScope[1], "GET", "attachments");
    assert.deepEqual(crossUserList.body.data, []);
    const objectPath = `${usersInScope[0].id}/${readyAttachmentId}.txt`;
    const crossUserObject = await fetch(
      `${baseUrl}/storage/v1/object/authenticated/mihwer-private/${objectPath}`,
      { headers: { apikey: anonKey, authorization: `Bearer ${usersInScope[1].accessToken}` } }
    );
    assert.equal(crossUserObject.ok, false);

    const invalidType = await callAttachment(usersInScope[0], "POST", {
      action: "prepare",
      body: { content_type: "application/javascript", byte_size: 1, checksum: "0".repeat(64) }
    });
    assert.equal(invalidType.status, 400);

    const badBytes = Buffer.from("%PDF-1.7 content mislabeled as text");
    const badPrepare = await callAttachment(usersInScope[0], "POST", {
      action: "prepare",
      body: {
        content_type: "text/plain",
        byte_size: badBytes.length,
        checksum: createHash("sha256").update(badBytes).digest("hex")
      }
    });
    assert.equal(badPrepare.status, 201);
    invalidAttachmentId = badPrepare.body.data.id;
    const badUpload = await fetch(badPrepare.body.data.upload_url, {
      method: "PUT",
      headers: { "content-type": "text/plain", "x-upsert": "false" },
      body: badBytes
    });
    assert.ok(badUpload.ok);
    const rejected = await callAttachment(usersInScope[0], "POST", {
      action: "finalize", body: { id: invalidAttachmentId }
    });
    assert.equal(rejected.status, 400);
    assert.equal(rejected.body.error.code, "file_validation_failed");
    const cleanedObject = await fetch(
      `${baseUrl}/storage/v1/object/authenticated/mihwer-private/${usersInScope[0].id}/${invalidAttachmentId}.txt`,
      { headers: { apikey: anonKey, authorization: `Bearer ${usersInScope[0].accessToken}` } }
    );
    assert.equal(cleanedObject.ok, false);

    const pendingBytes = Buffer.from("unused upload");
    const pending = await callAttachment(usersInScope[0], "POST", {
      action: "prepare",
      body: {
        content_type: "text/plain",
        byte_size: pendingBytes.length,
        checksum: createHash("sha256").update(pendingBytes).digest("hex")
      }
    });
    assert.equal(pending.status, 201);
    pendingAttachmentId = pending.body.data.id;
    const pendingUpload = await fetch(pending.body.data.upload_url, {
      method: "PUT",
      headers: { "content-type": "text/plain", "x-upsert": "false" },
      body: pendingBytes
    });
    assert.ok(pendingUpload.ok);
    const aborted = await callAttachment(usersInScope[0], "POST", {
      action: "abort", body: { id: pendingAttachmentId }
    });
    assert.equal(aborted.status, 200);

    const removed = await callAttachment(usersInScope[0], "DELETE", { id: readyAttachmentId });
    assert.equal(removed.status, 200);
    const afterDelete = await callData(usersInScope[0], "GET", "attachments");
    assert.equal(afterDelete.body.data.some(item => item.id === readyAttachmentId), false);
    const unauthorized = await callAttachment(usersInScope[0], "GET", { id: readyAttachmentId, token: null });
    assert.equal(unauthorized.status, 401);
  } finally {
    if (callAttachment && readyAttachmentId && usersInScope[0]) {
      await callAttachment(usersInScope[0], "DELETE", { id: readyAttachmentId }).catch(() => {});
    }
    if (callAttachment && pendingAttachmentId && usersInScope[0]) {
      await callAttachment(usersInScope[0], "POST", { action: "abort", body: { id: pendingAttachmentId } }).catch(() => {});
    }
    if (callAttachment && invalidAttachmentId && usersInScope[0]) {
      await callAttachment(usersInScope[0], "DELETE", { id: invalidAttachmentId }).catch(() => {});
    }
    if (callData && note && usersInScope[0]) {
      await callData(usersInScope[0], "PATCH", "notes", { deleted_at: new Date().toISOString() }, note.version).catch(() => {});
    }
  }
});
