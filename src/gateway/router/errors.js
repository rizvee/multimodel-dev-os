import { createGatewayError } from '../protocol/errors.js';

export class GatewayRoutingError extends Error {
  constructor({ code, message, request_id = null, provider = null, model = null, details = null, cause = null }) {
    super(message);
    this.name = 'GatewayRoutingError';
    this.gatewayError = createGatewayError({
      code,
      message,
      request_id,
      provider,
      model,
      details,
      cause,
    });
  }
}

export function createRoutingError(options) {
  return new GatewayRoutingError(options);
}

export function toRoutingErrorPayload(error) {
  if (error instanceof GatewayRoutingError) return error.gatewayError;
  return createGatewayError({
    code: 'internal_error',
    message: error?.message || 'Gateway routing failed',
    cause: error?.name || 'unknown',
  });
}
