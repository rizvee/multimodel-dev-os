import { createRuntimeError } from './errors.js';

function isJsonContentType(value) {
  return typeof value === 'string' && value.toLowerCase().split(';')[0].trim() === 'application/json';
}

function parseDeclaredContentLength(value) {
  if (value === undefined || value === null || value === '') return 0;
  const raw = String(value).trim();
  if (!/^(0|[1-9][0-9]*)$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function readJsonBody(request, context, config) {
  return new Promise((resolve, reject) => {
    if (!isJsonContentType(request.headers['content-type'])) {
      reject(createRuntimeError({
        code: 'invalid_request',
        message: 'POST requests require application/json',
        request_id: context.request_id,
        status: 415,
        cause: 'unsupported_content_type',
      }));
      return;
    }

    const declaredLength = parseDeclaredContentLength(request.headers['content-length']);
    if (declaredLength === null) {
      reject(createRuntimeError({
        code: 'invalid_request',
        message: 'Content-Length header must be a non-negative integer',
        request_id: context.request_id,
        status: 400,
        cause: 'invalid_content_length',
      }));
      return;
    }
    if (declaredLength > config.request_size_limit_bytes) {
      reject(createRuntimeError({
        code: 'request_too_large',
        message: 'Request body exceeds configured size limit',
        request_id: context.request_id,
        cause: 'content_length_too_large',
      }));
      return;
    }

    let size = 0;
    let body = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      request.destroy();
      reject(createRuntimeError({
        code: 'timeout',
        message: 'Request body timed out',
        request_id: context.request_id,
        cause: 'body_timeout',
      }));
    }, config.request_timeout_ms);
    timer.unref?.();

    function finish(callback) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback();
    }

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      if (settled) return;
      size += Buffer.byteLength(chunk, 'utf8');
      if (size > config.request_size_limit_bytes) {
        finish(() => reject(createRuntimeError({
          code: 'request_too_large',
          message: 'Request body exceeds configured size limit',
          request_id: context.request_id,
          cause: 'body_too_large',
        })));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on('aborted', () => {
      context.aborted = true;
      finish(() => reject(createRuntimeError({
        code: 'invalid_request',
        message: 'Request body was aborted',
        request_id: context.request_id,
        cause: 'request_aborted',
      })));
    });
    request.on('error', (error) => {
      finish(() => reject(createRuntimeError({
        code: 'internal_error',
        message: 'Request body could not be read',
        request_id: context.request_id,
        cause: error.name || 'body_read_error',
      })));
    });
    request.on('end', () => {
      finish(() => {
        if (body.trim() === '') {
          reject(createRuntimeError({
            code: 'invalid_request',
            message: 'Request body must not be empty',
            request_id: context.request_id,
            cause: 'empty_body',
          }));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(createRuntimeError({
            code: 'invalid_request',
            message: 'Request body must be valid JSON',
            request_id: context.request_id,
            cause: 'malformed_json',
          }));
        }
      });
    });
  });
}
