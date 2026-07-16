import { statusForGatewayError, toRuntimeError } from './errors.js';

export function writeJson(response, status, body, context, headers = {}) {
  if (response.writableEnded) return;
  if (response.headersSent) {
    response.end();
    return;
  }
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'x-request-id': context.request_id,
    ...headers,
  });
  response.end(payload);
}

export function writeError(response, error, context) {
  const runtimeError = toRuntimeError(error, { request_id: context.request_id });
  const body = runtimeError.gatewayError;
  const status = runtimeError.status || statusForGatewayError(body);
  writeJson(response, status, body, context);
}
