import { randomUUID } from 'node:crypto';
import { normalizeRemoteAddress } from './limits.js';

export function createRequestContext(request, { requestIdFactory = null, now = () => Date.now() } = {}) {
  const url = new URL(request.url || '/', 'http://localhost');
  const headerReqId = request.headers ? (request.headers['x-request-id'] || request.headers['X-Request-Id']) : null;
  const requestId = (typeof headerReqId === 'string' && headerReqId.trim().length > 0)
    ? headerReqId.trim()
    : (requestIdFactory ? requestIdFactory() : randomUUID());

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
