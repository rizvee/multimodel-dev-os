import { redactSensitiveValue } from './redaction.js';
import { EXECUTION_CONTRACT_VERSION } from '../protocol/constants.js';

export class ResolvedCredential {
  #secret;
  #destroyed = false;

  constructor({ provider_id, env_var, secret, source = 'environment' }) {
    if (!secret || typeof secret !== 'string') {
      throw new TypeError('ResolvedCredential requires a non-empty string secret');
    }
    this.contract_version = EXECUTION_CONTRACT_VERSION;
    this.provider_id = provider_id || null;
    this.env_var = env_var || null;
    this.source = source;
    this.resolved = true;
    this.destroyed = false;
    this.#secret = secret;
  }

  withSecret(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('withSecret expects a callback function');
    }
    if (this.#destroyed || !this.#secret) {
      const err = new Error('Cannot access destroyed credential');
      err.code = 'credential_unavailable';
      err.category = 'credential_unavailable';
      throw err;
    }
    try {
      return callback(this.#secret);
    } catch (error) {
      if (error && typeof error === 'object') {
        const secret = this.#secret;
        if (typeof error.message === 'string') {
          error.message = redactSensitiveValue(error.message, [secret]);
        }
        if (typeof error.stack === 'string') {
          error.stack = redactSensitiveValue(error.stack, [secret]);
        }
        if (error.cause !== undefined) {
          error.cause = redactSensitiveValue(error.cause, [secret]);
        }
        if (error.details !== undefined) {
          error.details = redactSensitiveValue(error.details, [secret]);
        }
      }
      throw error;
    }
  }

  destroy() {
    this.#secret = null;
    this.#destroyed = true;
    this.resolved = false;
    this.destroyed = true;
    return true;
  }

  toJSON() {
    return {
      contract_version: this.contract_version,
      provider_id: this.provider_id,
      env_var: this.env_var,
      source: this.source,
      resolved: this.resolved,
      destroyed: this.destroyed,
      value: '[REDACTED]',
    };
  }

  toString() {
    return `[ResolvedCredential ${this.provider_id}:${this.env_var} (redacted)]`;
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return `[ResolvedCredential ${this.provider_id}:${this.env_var} (redacted)]`;
  }
}

export function createResolvedCredential(params) {
  return new ResolvedCredential(params);
}
