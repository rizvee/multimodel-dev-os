export {
  validateProviderEndpoint,
} from '../protocol/validation.js';

import { EXECUTION_CONTRACT_VERSION } from '../protocol/constants.js';

export function createProviderEndpoint(overrides = {}) {
  const { follow_redirects, ssrf_check_required, protocol, contract_version, ...rest } = overrides || {};
  return {
    contract_version: EXECUTION_CONTRACT_VERSION,
    url: null,
    headers_allowlist: ['authorization', 'content-type', 'user-agent', 'accept'],
    ...rest,
    protocol: 'https',
    follow_redirects: false,
    ssrf_check_required: true,
  };
}
