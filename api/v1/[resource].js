"use strict";

const { SarhIdentityProvider } = require("../_lib/identity");
const { createHandler } = require("../_lib/mihwar-data");

const handlerPromise = createHandler({ provider: new SarhIdentityProvider() });

module.exports = async function handler(request, response) {
  const routeHandler = await handlerPromise;
  const result = await routeHandler({
    method: request.method,
    headers: request.headers,
    query: { ...request.query, resource: request.query?.resource || request.url?.split("?")[0]?.split("/").pop() },
    body: request.body
  });
  response.status(result.status);
  response.setHeader("content-type", result.headers["content-type"]);
  response.setHeader("cache-control", result.headers["cache-control"]);
  response.end(JSON.stringify(result.body));
};
