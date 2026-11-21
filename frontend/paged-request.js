"use strict";

(function attachMihwerPagination(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MihwerPagination = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const { isUuid } = globalThis.MihwerDataValidation || require("./data-validation");
  const PAGE_SIZE = 100;

  async function listPages(client, resource, { query = {}, signal } = {}) {
    if (!client || typeof client.request !== "function") throw new TypeError("API client is required");
    if (query.id || query.before_id || query.limit) throw new TypeError("pagination fields are managed internally");
    const result = [];
    let previousId = null;
    let cursor = null;
    while (true) {
      const rows = await client.request(resource, {
        query: { ...query, limit: PAGE_SIZE, ...(cursor ? { before_id: cursor } : {}) },
        signal
      });
      if (!Array.isArray(rows) || rows.length > PAGE_SIZE) throw new Error("invalid_paginated_response");
      for (const row of rows) {
        const id = typeof row?.id === "string" ? row.id.toLowerCase() : "";
        if (!isUuid(id) || previousId !== null && id >= previousId) {
          throw new Error("invalid_paginated_response");
        }
        previousId = id;
        result.push(row);
      }
      if (rows.length < PAGE_SIZE) return result;
      cursor = previousId;
    }
  }

  return Object.freeze({ listPages });
});
