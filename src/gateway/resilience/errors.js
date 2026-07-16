import { createGatewayError } from '../protocol/errors.js';

export class GatewayResilienceError extends Error {
  constructor({ code, message, request_id = null, provider = null, model = null, details = null, cause = null }) {
    super(message);
    this.name = 'GatewayResilienceError';
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

export function createResilienceError(options) {
  return new GatewayResilienceError(options);
}

export function toResilienceErrorPayload(error) {
  if (error instanceof GatewayResilienceError) return error.gatewayError;
  return createGatewayError({
    code: 'internal_error',
    message: error?.message || 'Gateway resilience simulation failed',
    cause: error?.name || 'unknown',
  });
}
