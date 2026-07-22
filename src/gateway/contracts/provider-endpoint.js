export {
  validateProviderEndpoint,
} from '../protocol/validation.js';

import { EXECUTION_DEFAULTS } from '../protocol/constants.js';

export function createProviderEndpoint(overrides = {}) {
  return {
    url: null,
    protocol: 'https',
    headers_allowlist: ['authorization', 'content-type', 'user-agent', 'accept'],
    follow_redirects: EXECUTION_DEFAULTS.follow_redirects,
    ssrf_check_required: EXECUTION_DEFAULTS.ssrf_check_required,
    ...overrides,
  };
}
