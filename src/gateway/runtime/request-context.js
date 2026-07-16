import { randomUUID } from 'node:crypto';
import { normalizeRemoteAddress } from './limits.js';

export function createRequestContext(request, { requestIdFactory = null, now = () => Date.now() } = {}) {
  const url = new URL(request.url || '/', 'http://localhost');
  return {
    request_id: requestIdFactory ? requestIdFactory() : randomUUID(),
    method: request.method || 'GET',
    pathname: url.pathname,
    start_time: now(),
    remote_address: normalizeRemoteAddress(request.socket?.remoteAddress),
    local_address: normalizeRemoteAddress(request.socket?.localAddress),
    content_type: request.headers['content-type'] || null,
    content_length: request.headers['content-length'] || null,
    aborted: false,
    metadata: {},
  };
}
