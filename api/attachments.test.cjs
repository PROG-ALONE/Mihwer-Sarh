"use strict";

process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { createTestIdentityProvider } = require("./_lib/identity");
const { createAttachmentHandler, BUCKET, MAX_FILE_SIZE } = require("./_lib/mihwar-attachments");

const ownerA = "00000000-0000-4000-8000-000000000001";
const ownerB = "00000000-0000-4000-8000-000000000002";
const noteId = "00000000-0000-4000-8000-000000000003";
const attachmentId = "00000000-0000-4000-8000-000000000004";
const baseUrl = "https://mihwar.test.invalid";
const publicKey = "public-test-key";

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

function makeHarness({ bytes = Buffer.from("safe text file"), id = attachmentId, failReadyPatch = false } = {}) {
  const rows = new Map();
  const links = [];
  const storageCalls = [];
  let uploadedBytes = bytes;
  const provider = createTestIdentityProvider();
  const fetchImpl = async (input, options = {}) => {
    const url = new URL(input);
    const method = options.method || "GET";
    if (url.pathname === "/rest/v1/notes") {
      return jsonResponse(url.searchParams.get("id") === `eq.${noteId}` &&
        url.searchParams.get("owner_id") === `eq.${ownerA}` ? [{ id: noteId }] : []);
    }
    if (url.pathname === "/rest/v1/attachments") {
      if (method === "POST") {
        const row = JSON.parse(options.body);
        rows.set(row.id, row);
        return jsonResponse([row], 201);
      }
      if (method === "GET") {
        const id = url.searchParams.get("id")?.slice(3);
        const ownerId = url.searchParams.get("owner_id")?.slice(3);
        if (id) {
          const row = rows.get(id);
          return jsonResponse(row && row.owner_id === ownerId ? [{ ...row }] : []);
        }
        return jsonResponse([...rows.values()].filter(row =>
          row.owner_id === ownerId &&
          row.state === url.searchParams.get("state")?.slice(3) &&
          (url.searchParams.get("deleted_at") === "is.null" ? !row.deleted_at : true)
        ).map(row => ({ ...row })));
      }
      if (method === "PATCH") {
        const row = rows.get(url.searchParams.get("id")?.slice(3));
        if (failReadyPatch && row?.state === "pending" && JSON.parse(options.body).state === "ready") {
          return jsonResponse({ message: "simulated database outage" }, 503);
        }
        if (!row || row.owner_id !== url.searchParams.get("owner_id")?.slice(3) ||
            row.state !== url.searchParams.get("state")?.slice(3) || row.deleted_at) {
          return jsonResponse([]);
        }
        Object.assign(row, JSON.parse(options.body));
        return jsonResponse([{ ...row }]);
      }
    }
    if (url.pathname === "/rest/v1/attachment_links") {
      if (method === "POST") {
        const link = JSON.parse(options.body);
        links.push(link);
        return jsonResponse([link], 201);
      }
      if (method === "GET") return jsonResponse(links.filter(link =>
        link.attachment_id === url.searchParams.get("attachment_id")?.slice(3) &&
        link.owner_id === url.searchParams.get("owner_id")?.slice(3)));
    }
    if (url.pathname.includes("/storage/v1/object/")) {
      storageCalls.push({ method, pathname: url.pathname, headers: options.headers || {} });
      if (url.pathname.includes("/object/upload/sign/")) {
        return jsonResponse({
          url: `${url.pathname.replace("/storage/v1", "")}?token=upload-token`,
          token: "upload-token"
        });
      }
      if (url.pathname.includes("/object/authenticated/") && method === "GET") {
        return new Response(uploadedBytes, { status: 200, headers: { "content-length": String(uploadedBytes.length) } });
      }
      if (url.pathname.includes("/object/sign/") && method === "POST") {
        return jsonResponse({ signedURL: `${url.pathname.replace("/storage/v1", "")}?token=download-token` });
      }
      if (method === "DELETE") return new Response(null, { status: 200 });
    }
    throw new Error(`unexpected request ${method} ${url.pathname}`);
  };
  const handler = createAttachmentHandler({
    provider,
    env: { MIHWAR_SUPABASE_URL: baseUrl, MIHWAR_SUPABASE_ANON_KEY: publicKey },
    fetchImpl,
    profileResolver: async identity => ({ id: identity.mihwarUserId, status: "active" }),
    makeId: () => id,
    now: () => "2026-11-22T00:00:00.000Z"
  });
  const request = (method, { action, body, id: queryId, limit, token = "test-token-user-a" } = {}) => ({
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    query: {
      ...(action ? { action } : {}),
      ...(queryId ? { id: queryId } : {}),
      ...(limit ? { limit } : {})
    },
    body
  });
  return { handler, request, rows, links, storageCalls, setBytes: value => { uploadedBytes = value; } };
}

function preparedBody(bytes, contentType = "text/plain") {
  return {
    content_type: contentType,
    byte_size: bytes.length,
    checksum: createHash("sha256").update(bytes).digest("hex"),
    note_id: noteId
  };
}

test("attachment lifecycle uploads only to generated owner paths and persists verified metadata", async () => {
  const bytes = Buffer.from("safe text file");
  const harness = makeHarness({ bytes });
  const prepared = await harness.handler(harness.request("POST", {
    action: "prepare", body: preparedBody(bytes)
  }));
  assert.equal(prepared.status, 201);
  assert.equal(prepared.body.data.id, attachmentId);
  assert.equal(prepared.body.data.upload_url, `${baseUrl}/storage/v1/object/upload/sign/${BUCKET}/${ownerA}/${attachmentId}.txt?token=upload-token`);
  assert.equal(harness.rows.get(attachmentId).owner_id, ownerA);
  assert.equal(harness.rows.get(attachmentId).object_key, `${ownerA}/${attachmentId}.txt`);
  assert.deepEqual(harness.links, [{ owner_id: ownerA, attachment_id: attachmentId, note_id: noteId }]);

  const finalized = await harness.handler(harness.request("POST", {
    action: "finalize", body: { id: attachmentId }
  }));
  assert.equal(finalized.status, 200);
  assert.equal(harness.rows.get(attachmentId).state, "ready");
  assert.equal(harness.storageCalls.filter(call => call.method === "DELETE").length, 0);

  const listing = await harness.handler(harness.request("GET", { limit: "100" }));
  assert.equal(listing.status, 200);
  assert.deepEqual(listing.body.data.map(row => row.id), [attachmentId]);
  const otherOwnerListing = await harness.handler(harness.request("GET", {
    limit: "100",
    token: "test-token-user-b"
  }));
  assert.deepEqual(otherOwnerListing.body.data, []);
  const metadata = await harness.handler(harness.request("GET", {
    action: "metadata",
    id: attachmentId
  }));
  assert.deepEqual(metadata.body.data, {
    id: attachmentId,
    content_type: "text/plain",
    byte_size: bytes.length,
    state: "ready",
    deleted_at: null
  });

  const download = await harness.handler(harness.request("GET", { id: attachmentId }));
  assert.equal(download.status, 200);
  assert.equal(download.body.data.expires_in, 60);
  assert.match(download.body.data.download_url, /token=download-token/);

  const removed = await harness.handler(harness.request("DELETE", { id: attachmentId }));
  assert.equal(removed.status, 200);
  assert.equal(removed.body.data.deleted, true);
  assert.equal(harness.rows.get(attachmentId).state, "deleted");
  assert.equal(harness.rows.get(attachmentId).deleted_at, "2026-11-22T00:00:00.000Z");
  assert.equal(harness.storageCalls.filter(call => call.method === "DELETE").length, 1);
  const hiddenAfterDelete = await harness.handler(harness.request("GET", { limit: "100" }));
  assert.deepEqual(hiddenAfterDelete.body.data, []);
});

test("attachment metadata listing validates bounds", async () => {
  const harness = makeHarness();
  const invalid = await harness.handler(harness.request("GET", { limit: "101" }));
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error.code, "invalid_limit");
  assert.equal(harness.storageCalls.length, 0);
});

test("invalid metadata and oversized uploads are rejected before creating storage access", async () => {
  const harness = makeHarness();
  const invalidType = await harness.handler(harness.request("POST", {
    action: "prepare", body: { ...preparedBody(Buffer.from("x")), content_type: "application/javascript" }
  }));
  const oversized = await harness.handler(harness.request("POST", {
    action: "prepare", body: { ...preparedBody(Buffer.from("x")), byte_size: MAX_FILE_SIZE + 1 }
  }));
  assert.equal(invalidType.status, 400);
  assert.equal(oversized.status, 400);
  assert.equal(harness.rows.size, 0);
  assert.equal(harness.storageCalls.length, 0);
});

test("finalization rejects content that does not match the declared type and checksum and cleans it up", async () => {
  const declaredBytes = Buffer.from("declared as text");
  const harness = makeHarness({ bytes: Buffer.from("%PDF-1.7 forged content") });
  const prepared = await harness.handler(harness.request("POST", {
    action: "prepare", body: preparedBody(declaredBytes)
  }));
  assert.equal(prepared.status, 201);
  const finalized = await harness.handler(harness.request("POST", {
    action: "finalize", body: { id: attachmentId }
  }));
  assert.equal(finalized.status, 400);
  assert.equal(finalized.body.error.code, "file_validation_failed");
  assert.equal(harness.rows.get(attachmentId).state, "failed");
  assert.equal(harness.rows.get(attachmentId).deleted_at, "2026-11-22T00:00:00.000Z");
  assert.equal(harness.storageCalls.filter(call => call.method === "DELETE").length, 1);
});

test("finalization cleans the uploaded object if metadata cannot be persisted", async () => {
  const bytes = Buffer.from("safe text file");
  const harness = makeHarness({ bytes, failReadyPatch: true });
  const prepared = await harness.handler(harness.request("POST", {
    action: "prepare", body: preparedBody(bytes)
  }));
  assert.equal(prepared.status, 201);
  const finalized = await harness.handler(harness.request("POST", {
    action: "finalize", body: { id: attachmentId }
  }));
  assert.equal(finalized.status, 502);
  assert.equal(finalized.body.error.code, "metadata_persistence_failed");
  assert.equal(harness.rows.get(attachmentId).state, "failed");
  assert.equal(harness.storageCalls.filter(call => call.method === "DELETE").length, 1);
});

test("attachment identifiers are always constrained to the verified owner", async () => {
  const harness = makeHarness();
  harness.rows.set(attachmentId, {
    id: attachmentId, owner_id: ownerB, object_key: `${ownerB}/${attachmentId}.txt`,
    content_type: "text/plain", byte_size: 1, checksum: "0".repeat(64), state: "ready"
  });
  const result = await harness.handler(harness.request("GET", { id: attachmentId }));
  assert.equal(result.status, 404);
  assert.equal(harness.storageCalls.length, 0);
});

test("attachment endpoints fail closed without a verified session", async () => {
  const harness = makeHarness();
  const result = await harness.handler(harness.request("POST", {
    action: "prepare", body: preparedBody(Buffer.from("x")), token: null
  }));
  assert.equal(result.status, 401);
  assert.equal(harness.rows.size, 0);
  assert.equal(harness.storageCalls.length, 0);
});

test("attachment links cannot be created for notes not owned by the verified user", async () => {
  const harness = makeHarness();
  const result = await harness.handler(harness.request("POST", {
    action: "prepare",
    body: { ...preparedBody(Buffer.from("safe text file")), note_id: "00000000-0000-4000-8000-000000000099" }
  }));
  assert.equal(result.status, 404);
  assert.equal(harness.rows.size, 0);
  assert.equal(harness.links.length, 0);
});
