"use strict";

const { createHash, randomUUID } = require("node:crypto");
const { IdentityError, getAuthenticatedUser, requirePermission, resolveMihwarProfile } = require("./identity");

const BUCKET = "mihwer-private";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const FILE_TYPES = Object.freeze({
  "image/jpeg": { extension: "jpg", detect: bytes => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", detect: bytes => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extension: "webp", detect: bytes => bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" },
  "application/pdf": { extension: "pdf", detect: bytes => bytes.length >= 5 && bytes.toString("ascii", 0, 5) === "%PDF-" },
  "text/plain": {
    extension: "txt",
    detect(bytes) {
      try {
        return !new TextDecoder("utf-8", { fatal: true }).decode(bytes).includes("\0");
      } catch {
        return false;
      }
    }
  }
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;

function response(status, body) {
  return {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    },
    body
  };
}

function queryValue(request, key) {
  const value = request.query?.[key];
  return typeof value === "string" ? value : undefined;
}

function parseBody(body) {
  if (body && typeof body === "object" && !Array.isArray(body) && !Buffer.isBuffer(body)) return body;
  if (typeof body !== "string" || body.length > 10_000) throw new IdentityError("validation_failed", 400);
  try {
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_body");
    return parsed;
  } catch {
    throw new IdentityError("validation_failed", 400);
  }
}

function restUrl(baseUrl, table, query = {}) {
  const url = new URL(`/rest/v1/${table}`, baseUrl);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  return url;
}

function storageUrl(baseUrl, endpoint) {
  const url = new URL(endpoint, baseUrl);
  const base = new URL(baseUrl);
  if (url.origin !== base.origin) throw new IdentityError("storage_response_invalid", 502);
  if (!url.pathname.startsWith("/storage/v1/")) {
    url.pathname = `/storage/v1${url.pathname.startsWith("/") ? url.pathname : `/${url.pathname}`}`;
  }
  return url;
}

function objectPathUrl(baseUrl, action, objectKey) {
  const encoded = objectKey.split("/").map(encodeURIComponent).join("/");
  return new URL(`/storage/v1/object/${action ? `${action}/` : ""}${BUCKET}/${encoded}`, baseUrl);
}

async function readJson(responseValue) {
  const text = await responseValue.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new IdentityError("invalid_upstream_response", 502);
  }
}

function mapUpstreamStatus(status) {
  if (status === 401) return new IdentityError("unauthenticated", 401);
  if (status === 403) return new IdentityError("forbidden", 403);
  return new IdentityError("upstream_request_failed", 502);
}

function createAttachmentHandler({
  provider,
  env = process.env,
  fetchImpl = fetch,
  profileResolver = resolveMihwarProfile,
  makeId = randomUUID,
  now = () => new Date().toISOString()
} = {}) {
  async function databaseRequest(identity, method, table, query, body) {
    const baseUrl = env.MIHWAR_SUPABASE_URL;
    const publicKey = env.MIHWAR_SUPABASE_ANON_KEY;
    if (!baseUrl || !publicKey || !identity.databaseAccessToken) {
      throw new IdentityError("database_configuration_unavailable", 503);
    }
    const headers = {
      apikey: publicKey,
      authorization: `Bearer ${identity.databaseAccessToken}`,
      accept: "application/json",
      prefer: "return=representation"
    };
    if (body !== undefined) headers["content-type"] = "application/json";
    const result = await fetchImpl(restUrl(baseUrl, table, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await readJson(result);
    if (!result.ok) throw mapUpstreamStatus(result.status);
    return data;
  }

  async function storageRequest(identity, method, url, body, contentType) {
    const publicKey = env.MIHWAR_SUPABASE_ANON_KEY;
    if (!publicKey || !identity.databaseAccessToken) {
      throw new IdentityError("database_configuration_unavailable", 503);
    }
    const headers = {
      apikey: publicKey,
      authorization: `Bearer ${identity.databaseAccessToken}`,
      accept: "application/json"
    };
    if (body !== undefined) {
      headers["content-type"] = contentType || "application/json";
      headers["x-upsert"] = "false";
    }
    return fetchImpl(url, {
      method,
      headers,
      body: body === undefined ? undefined : contentType === "application/json" ? JSON.stringify(body) : body
    });
  }

  async function ownedAttachment(identity, ownerId, id) {
    const rows = await databaseRequest(identity, "GET", "attachments", {
      id: `eq.${id}`,
      owner_id: `eq.${ownerId}`,
      select: "id,owner_id,object_key,content_type,byte_size,checksum,state,deleted_at",
      limit: "1"
    });
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row || row.owner_id !== ownerId || row.id !== id) throw new IdentityError("not_found", 404);
    if (row.object_key !== `${ownerId}/${row.id}.${FILE_TYPES[row.content_type]?.extension}`) {
      throw new IdentityError("attachment_path_invalid", 409);
    }
    return row;
  }

  async function setAttachmentState(identity, ownerId, id, fromState, state, deletedAt = null) {
    const rows = await databaseRequest(identity, "PATCH", "attachments", {
      id: `eq.${id}`,
      owner_id: `eq.${ownerId}`,
      state: `eq.${fromState}`,
      deleted_at: "is.null"
    }, { state, ...(deletedAt ? { deleted_at: deletedAt } : {}) });
    return Array.isArray(rows) ? rows[0] || null : null;
  }

  async function removeObject(identity, objectKey) {
    const result = await storageRequest(identity, "DELETE", objectPathUrl(env.MIHWAR_SUPABASE_URL, "", objectKey));
    if (result.ok || result.status === 404) return true;
    return false;
  }

  async function markFailed(identity, ownerId, id, fromState = "pending") {
    return setAttachmentState(identity, ownerId, id, fromState, "failed", now());
  }

  async function cleanupPending(identity, ownerId, record) {
    if (!await removeObject(identity, record.object_key)) {
      throw new IdentityError("attachment_cleanup_failed", 502);
    }
    const failed = await markFailed(identity, ownerId, record.id);
    if (!failed) {
      const current = await ownedAttachment(identity, ownerId, record.id);
      if (current.state !== "failed" && current.state !== "deleted") {
        throw new IdentityError("metadata_finalization_failed", 502);
      }
    }
  }

  async function prepare(identity, profile, body) {
    const keys = Object.keys(body);
    if (keys.some(key => !["content_type", "byte_size", "checksum", "note_id"].includes(key))) {
      throw new IdentityError("validation_failed", 400);
    }
    const type = body.content_type;
    const size = body.byte_size;
    const checksum = body.checksum;
    const noteId = body.note_id;
    if (!FILE_TYPES[type] || !Number.isSafeInteger(size) || size < 1 || size > MAX_FILE_SIZE ||
        typeof checksum !== "string" || !SHA256.test(checksum) ||
        (noteId !== undefined && (typeof noteId !== "string" || !UUID.test(noteId)))) {
      throw new IdentityError("validation_failed", 400);
    }
    if (noteId) {
      const notes = await databaseRequest(identity, "GET", "notes", {
        id: `eq.${noteId}`,
        owner_id: `eq.${profile.id}`,
        deleted_at: "is.null",
        select: "id",
        limit: "1"
      });
      if (!Array.isArray(notes) || !notes.some(note => note.id === noteId)) throw new IdentityError("not_found", 404);
    }

    const id = makeId();
    const objectKey = `${profile.id}/${id}.${FILE_TYPES[type].extension}`;
    const rows = await databaseRequest(identity, "POST", "attachments", {}, {
      id,
      owner_id: profile.id,
      object_key: objectKey,
      content_type: type,
      byte_size: size,
      checksum: checksum.toLowerCase(),
      state: "pending"
    });
    if (!Array.isArray(rows) || rows.length !== 1 || rows[0].id !== id) {
      throw new IdentityError("metadata_persistence_failed", 502);
    }
    if (noteId) {
      try {
        await databaseRequest(identity, "POST", "attachment_links", {}, {
          owner_id: profile.id,
          attachment_id: id,
          note_id: noteId
        });
      } catch (error) {
        await markFailed(identity, profile.id, id);
        throw error;
      }
    }

    try {
      const signedResponse = await storageRequest(identity, "POST",
        objectPathUrl(env.MIHWAR_SUPABASE_URL, "upload/sign", objectKey),
        { upsert: false }, "application/json");
      const signedData = await readJson(signedResponse);
      if (!signedResponse.ok) throw mapUpstreamStatus(signedResponse.status);
      const rawUrl = signedData?.signedURL || signedData?.signedUrl || signedData?.url;
      if (typeof rawUrl !== "string" || !rawUrl) throw new IdentityError("storage_response_invalid", 502);
      const uploadUrl = storageUrl(env.MIHWAR_SUPABASE_URL, rawUrl);
      if (typeof signedData.token === "string" && !uploadUrl.searchParams.has("token")) {
        uploadUrl.searchParams.set("token", signedData.token);
      }
      if (!uploadUrl.pathname.includes("/object/upload/sign/") || !uploadUrl.searchParams.has("token")) {
        throw new IdentityError("storage_response_invalid", 502);
      }
      return response(201, {
        data: {
          id,
          upload_url: uploadUrl.toString(),
          content_type: type,
          byte_size: size
        }
      });
    } catch (error) {
      await markFailed(identity, profile.id, id);
      throw error;
    }
  }

  async function finalize(identity, profile, body) {
    if (Object.keys(body).some(key => key !== "id") || typeof body.id !== "string" || !UUID.test(body.id)) {
      throw new IdentityError("validation_failed", 400);
    }
    const record = await ownedAttachment(identity, profile.id, body.id);
    if (record.state === "ready" && !record.deleted_at) return response(200, { data: record });
    if (record.state !== "pending" || record.deleted_at) throw new IdentityError("invalid_attachment_state", 409);

    const download = await storageRequest(identity, "GET",
      objectPathUrl(env.MIHWAR_SUPABASE_URL, "authenticated", record.object_key));
    if (!download.ok) {
      if (download.status === 404) throw new IdentityError("upload_missing", 409);
      throw mapUpstreamStatus(download.status);
    }
    const contentLength = Number(download.headers?.get?.("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_FILE_SIZE) {
      await cleanupPending(identity, profile.id, record);
      throw new IdentityError("file_too_large", 400);
    }
    const bytes = Buffer.from(await download.arrayBuffer());
    const detectedType = Object.entries(FILE_TYPES).find(([, definition]) => definition.detect(bytes))?.[0];
    const checksum = createHash("sha256").update(bytes).digest("hex");
    if (bytes.length !== record.byte_size || bytes.length > MAX_FILE_SIZE ||
        detectedType !== record.content_type || checksum !== record.checksum) {
      await cleanupPending(identity, profile.id, record);
      throw new IdentityError("file_validation_failed", 400);
    }

    let ready;
    try {
      ready = await setAttachmentState(identity, profile.id, record.id, "pending", "ready");
    } catch (error) {
      if (error instanceof IdentityError && [401, 403].includes(error.status)) throw error;
      let current;
      try {
        current = await ownedAttachment(identity, profile.id, record.id);
      } catch {
        throw new IdentityError("metadata_finalization_uncertain", 502);
      }
      if (current.state === "ready" && !current.deleted_at) return response(200, { data: current });
      if (current.state !== "pending" || current.deleted_at) throw new IdentityError("metadata_finalization_uncertain", 502);
      await cleanupPending(identity, profile.id, record);
      throw new IdentityError("metadata_persistence_failed", 502);
    }
    if (!ready) {
      const current = await ownedAttachment(identity, profile.id, record.id);
      if (current.state === "ready" && !current.deleted_at) return response(200, { data: current });
      if (current.state === "pending" && !current.deleted_at) {
        await cleanupPending(identity, profile.id, record);
      }
      throw new IdentityError("invalid_attachment_state", 409);
    }
    return response(200, { data: ready });
  }

  async function download(identity, profile, id) {
    if (!UUID.test(id || "")) throw new IdentityError("validation_failed", 400);
    const record = await ownedAttachment(identity, profile.id, id);
    if (record.state !== "ready" || record.deleted_at) throw new IdentityError("not_found", 404);
    const result = await storageRequest(identity, "POST",
      objectPathUrl(env.MIHWAR_SUPABASE_URL, "sign", record.object_key),
      { expiresIn: 60, download: `mihwar-attachment-${record.id}.${FILE_TYPES[record.content_type].extension}` },
      "application/json");
    const data = await readJson(result);
    if (!result.ok) throw mapUpstreamStatus(result.status);
    const rawUrl = data?.signedURL || data?.signedUrl || data?.url;
    if (typeof rawUrl !== "string" || !rawUrl) throw new IdentityError("storage_response_invalid", 502);
    const signedUrl = storageUrl(env.MIHWAR_SUPABASE_URL, rawUrl);
    if (!signedUrl.pathname.includes("/object/sign/") || !signedUrl.searchParams.has("token")) {
      throw new IdentityError("storage_response_invalid", 502);
    }
    signedUrl.searchParams.set("download", `mihwar-attachment-${record.id}.${FILE_TYPES[record.content_type].extension}`);
    return response(200, { data: { id: record.id, download_url: signedUrl.toString(), expires_in: 60 } });
  }

  async function remove(identity, profile, id) {
    if (!UUID.test(id || "")) throw new IdentityError("validation_failed", 400);
    const record = await ownedAttachment(identity, profile.id, id);
    if (record.state === "deleted" || record.deleted_at) return response(200, { data: { id: record.id, deleted: true } });
    if (!["pending", "ready", "deleting"].includes(record.state)) throw new IdentityError("invalid_attachment_state", 409);
    if (record.state !== "deleting") {
      const marked = await setAttachmentState(identity, profile.id, record.id, record.state, "deleting");
      if (!marked) throw new IdentityError("version_conflict", 409);
    }
    if (!await removeObject(identity, record.object_key)) {
      await setAttachmentState(identity, profile.id, record.id, "deleting", record.state);
      throw new IdentityError("storage_delete_failed", 502);
    }
    const deleted = await setAttachmentState(identity, profile.id, record.id, "deleting", "deleted", now());
    if (!deleted) {
      const current = await ownedAttachment(identity, profile.id, record.id);
      if (current.state === "deleted" || current.deleted_at) return response(200, { data: { id: record.id, deleted: true } });
      throw new IdentityError("metadata_finalization_failed", 502);
    }
    return response(200, { data: { id: record.id, deleted: true } });
  }

  return async function handler(request) {
    try {
      const method = String(request.method || "GET").toUpperCase();
      const action = queryValue(request, "action");
      const identity = await getAuthenticatedUser(request, provider);
      const permission = method === "GET" ? "data:read" : "data:write";
      requirePermission(identity, permission);
      const profile = await profileResolver(identity, env, fetchImpl);
      if (method === "GET") return await download(identity, profile, queryValue(request, "id"));
      if (method === "DELETE") return await remove(identity, profile, queryValue(request, "id"));
      if (method === "POST") {
        const body = parseBody(request.body);
        if (action === "prepare") return await prepare(identity, profile, body);
        if (action === "finalize") return await finalize(identity, profile, body);
        if (action === "abort" && Object.keys(body).length === 1 && typeof body.id === "string" && UUID.test(body.id)) {
          const record = await ownedAttachment(identity, profile.id, body.id);
          if (record.state !== "pending") throw new IdentityError("invalid_attachment_state", 409);
          const cleaned = await removeObject(identity, record.object_key);
          if (!cleaned) throw new IdentityError("attachment_cleanup_failed", 502);
          const failed = await markFailed(identity, profile.id, record.id);
          if (!failed) throw new IdentityError("metadata_finalization_failed", 502);
          return response(200, { data: { id: record.id, aborted: true } });
        }
      }
      return response(405, { error: { code: "method_not_allowed" } });
    } catch (error) {
      if (error instanceof IdentityError) return response(error.status, { error: { code: error.code } });
      return response(500, { error: { code: "internal_error" } });
    }
  };
}

module.exports = { BUCKET, MAX_FILE_SIZE, FILE_TYPES, createAttachmentHandler };
