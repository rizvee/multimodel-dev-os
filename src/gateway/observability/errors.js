export class GatewayObservabilityError extends Error {
  constructor({ code = 'observability_error', message = 'Gateway observability error', details = null } = {}) {
    super(message);
    this.name = 'GatewayObservabilityError';
    this.code = code;
    this.details = details;
  }
}

export function createObservabilityError(options = {}) {
  return new GatewayObservabilityError(options);
}
