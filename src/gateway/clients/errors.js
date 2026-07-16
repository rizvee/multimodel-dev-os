export class GatewayClientIntegrationError extends Error {
  constructor(message, { code = 'invalid_client_config', details = null } = {}) {
    super(message);
    this.name = 'GatewayClientIntegrationError';
    this.code = code;
    this.details = details;
  }
}

export function createClientError(code, message, details = null) {
  return new GatewayClientIntegrationError(message, { code, details });
}
