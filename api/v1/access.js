"use strict";

const { SarhIdentityProvider } = require("../_lib/identity");
const { createAccessHandler } = require("../_lib/access");

const handlerPromise = createAccessHandler({ provider: new SarhIdentityProvider() });

module.exports = async function handler(request, response) {
  const routeHandler = await handlerPromise;
  const result = await routeHandler({
    method: request.method,
    headers: request.headers,
    query: request.query,
    body: request.body
  });
  response.status(result.status);
  response.setHeader("content-type", result.headers["content-type"]);
  response.setHeader("cache-control", result.headers["cache-control"]);
  response.end(JSON.stringify(result.body));
};
