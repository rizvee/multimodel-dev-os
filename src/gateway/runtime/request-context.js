import { randomUUID } from 'node:crypto';
import { normalizeRemoteAddress } from './limits.js';

const SAFE_REQUEST_ID_REGEX = /^[a-zA-Z0-9_\-.:]{1,128}$/;

function isValidSafeRequestId(val) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed.length === 0 || trimmed.length > 128) return false;
  if (!SAFE_REQUEST_ID_REGEX.test(trimmed)) return false;
  if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) return false;
  if (/[\x00-\x1F\x7F-\x9F]/.test(trimmed)) return false;
  return true;
}

export function validateAndSanitizeRequestId(rawId, requestIdFactory = null) {
  if (isValidSafeRequestId(rawId)) {
    return rawId.trim();
  }

  if (typeof requestIdFactory === 'function') {
    try {
      const generatedId = requestIdFactory();
      if (isValidSafeRequestId(generatedId)) {
        return generatedId.trim();
      }
    } catch {
      // Custom requestIdFactory threw an error, fall back to randomUUID
    }
  }

  return randomUUID();
}

export function createRequestContext(request, { requestIdFactory = null, now = () => Date.now() } = {}) {
  const url = new URL(request.url || '/', 'http://localhost');
  const headerReqId = request.headers ? (request.headers['x-request-id'] || request.headers['X-Request-Id']) : null;
  const requestId = validateAndSanitizeRequestId(headerReqId, requestIdFactory);

  return {
    request_id: requestId,
    method: request.method || 'GET',
    pathname: url.pathname,
    start_time: now(),
    remote_address: normalizeRemoteAddress(request.socket?.remoteAddress),
    local_address: normalizeRemoteAddress(request.socket?.localAddress),
    content_type: request.headers ? request.headers['content-type'] : null,
    content_length: request.headers ? request.headers['content-length'] : null,
    aborted: false,
    metadata: {},
  };
}
