export {
  validateCredentialRef,
} from '../protocol/validation.js';

export function createCredentialRef(overrides = {}) {
  return {
    source: 'environment',
    env_var: null,
    required: true,
    ...overrides,
  };
}
