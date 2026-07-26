import { EXECUTION_ERROR_CATEGORIES } from '../protocol/constants.js';

export const CATEGORY_STATUS_MAP = Object.freeze({
  request_invalid: 400,
  unsupported_capability: 400,
  execution_disabled: 403,
  provider_not_enabled: 403,
  endpoint_forbidden: 403,
  credential_reference_invalid: 400,
  credential_unavailable: 503,
  endpoint_invalid: 400,
  request_too_large: 413,
  timeout: 504,
  upstream_authentication: 401,
  upstream_rate_limit: 429,
  upstream_quota: 429,
  upstream_client_error: 400,
  upstream_server_error: 502,
  upstream_protocol_error: 502,
  stream_error: 502,
  response_too_large: 502,
  cancelled: 499,
  internal_execution_error: 500,
});

export function mapCategoryToStatus(category) {
  if (category && CATEGORY_STATUS_MAP[category]) {
    return CATEGORY_STATUS_MAP[category];
  }
  return 500;
}

export function validateCategoryStatusMapping() {
  for (const cat of EXECUTION_ERROR_CATEGORIES) {
    if (typeof CATEGORY_STATUS_MAP[cat] !== 'number') {
      throw new Error(`EXECUTION_ERROR_CATEGORIES entry ${cat} is missing from CATEGORY_STATUS_MAP`);
    }
  }
  return true;
}

validateCategoryStatusMapping();
