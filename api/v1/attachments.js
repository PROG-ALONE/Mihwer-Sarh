"use strict";

const { SarhIdentityProvider } = require("../_lib/identity");
const { createAttachmentHandler } = require("../_lib/mihwar-attachments");

const handlerPromise = createAttachmentHandler({ provider: new SarhIdentityProvider() });

module.exports = async function handler(request, response) {
  const routeHandler = await handlerPromise;
  const result = await routeHandler({
    method: request.method,
    headers: request.headers,
    query: request.query,
    body: request.body
  });
  response.status(result.status);
  for (const [name, value] of Object.entries(result.headers)) response.setHeader(name, value);
  response.end(JSON.stringify(result.body));
};
