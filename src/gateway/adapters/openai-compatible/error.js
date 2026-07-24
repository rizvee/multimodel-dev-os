import { createExecutionError, validateExecutionError } from '../../contracts/execution-error.js';
import { redactSensitiveValue } from '../../protocol/errors.js';
import { validateSafeMetadata } from '../../protocol/validation.js';
import { SENSITIVE_KEY_PATTERN, PROTOTYPE_NAMES_PATTERN, EXECUTION_CONTRACT_VERSION } from '../../protocol/constants.js';

const ABSOLUTE_PATH_PATTERN = /(?:[a-zA-Z]:[\\\/][^:\s\n\r]+|\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)+)/g;

function sanitizeMessage(msg) {
  if (typeof msg !== 'string') {
    return 'An upstream execution error occurred';
  }
  let clean = msg
    .replace(ABSOLUTE_PATH_PATTERN, '[REDACTED_PATH]')
    .replace(/(?:Bearer|Token)\s+[A-Za-z0-9._~+/-]+=*/gi, '[REDACTED_TOKEN]')
    .replace(/sk-[A-Za-z0-9_-]{8,}/gi, '[REDACTED_KEY]')
    .replace(/key=[A-Za-z0-9_-]+/gi, 'key=[REDACTED]');
  if (clean.length > 512) {
    clean = clean.slice(0, 509) + '...';
  }
  return clean || 'An upstream execution error occurred';
}

function safeCleanObject(obj, seen = new WeakSet(), depth = 0) {
  if (obj === null || typeof obj !== 'object' || depth > 5) {
    return null;
  }
  if (seen.has(obj)) {
    return '[CIRCULAR]';
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.slice(0, 50).map((item) => {
      if (item === null || typeof item !== 'object') return item;
      return safeCleanObject(item, seen, depth + 1);
    });
  }

  const result = {};
  let keys = [];
  try {
    keys = Object.getOwnPropertyNames(obj);
  } catch (_) {
    return null;
  }

  for (const key of keys) {
    if (PROTOTYPE_NAMES_PATTERN.test(key) || SENSITIVE_KEY_PATTERN.test(key)) {
      continue;
    }
    if (['stack', 'trace', 'raw_body', 'headers', 'url'].includes(key.toLowerCase())) {
      continue;
    }
    try {
      const val = obj[key];
      if (typeof val === 'function') {
        continue;
      }
      if (typeof val === 'string') {
        result[key] = sanitizeMessage(val);
      } else if (val === null || typeof val !== 'object') {
        result[key] = val;
      } else {
        result[key] = safeCleanObject(val, seen, depth + 1);
      }
    } catch (_) {
      // Ignore getters throwing errors
    }
  }
  return result;
}

function sanitizeDetails(detailsInput) {
  if (!detailsInput || typeof detailsInput !== 'object') {
    return null;
  }
  try {
    const cleaned = safeCleanObject(detailsInput);
    if (!cleaned || typeof cleaned !== 'object') {
      return null;
    }
    const redacted = redactSensitiveValue(cleaned);
    const dummyResult = { success: true, errors: [] };
    validateSafeMetadata(redacted, dummyResult, 'details');
    if (!dummyResult.success) {
      return { redacted_reason: 'unsafe_fields_stripped' };
    }
    return redacted;
  } catch (_) {
    return { redacted_reason: 'unparseable_error_details' };
  }
}

export function normalizeOpenAIError(errorInput, context = {}) {
  try {
    let status = typeof context.status === 'number' ? context.status : null;
    let rawMsg = null;
    let rawCode = null;
    let rawType = null;
    let detailsObj = null;

    if (errorInput && typeof errorInput === 'object') {
      try {
        if (typeof errorInput.status === 'number') {
          status = errorInput.status;
        }
        if (errorInput.error && typeof errorInput.error === 'object') {
          rawMsg = typeof errorInput.error.message === 'string' ? errorInput.error.message : errorInput.message;
          rawCode = typeof errorInput.error.code === 'string' ? errorInput.error.code : errorInput.code;
          rawType = typeof errorInput.error.type === 'string' ? errorInput.error.type : errorInput.type;
          detailsObj = errorInput.error;
        } else {
          rawMsg = errorInput.message;
          rawCode = errorInput.code;
          rawType = errorInput.type;
          detailsObj = errorInput;
        }
      } catch (_) {
        rawMsg = 'Malformed error object';
      }
    } else if (typeof errorInput === 'string') {
      rawMsg = errorInput;
    }

    if (context.code) {
      rawCode = rawCode || context.code;
    }

    let code = 'internal_execution_error';
    let category = 'internal_execution_error';
    let retryable = false;

    const lowerMsg = typeof rawMsg === 'string' ? rawMsg.toLowerCase() : '';
    const lowerCode = typeof rawCode === 'string' ? rawCode.toLowerCase() : '';
    const lowerType = typeof rawType === 'string' ? rawType.toLowerCase() : '';

    if (context.code === 'unsupported_capability' || lowerCode === 'unsupported_capability') {
      code = 'unsupported_capability';
      category = 'unsupported_capability';
      retryable = false;
    } else if (context.code === 'stream_error' || lowerCode === 'stream_error' || lowerMsg.includes('stream') || lowerMsg.includes('sse')) {
      code = 'stream_error';
      category = 'stream_error';
      retryable = true;
    } else if (context.code === 'upstream_protocol_error' || lowerCode === 'upstream_protocol_error') {
      code = 'upstream_protocol_error';
      category = 'upstream_protocol_error';
      retryable = false;
    } else if (status === 401 || status === 403 || lowerMsg.includes('api key') || lowerMsg.includes('unauthorized') || lowerCode.includes('invalid_api_key')) {
      code = 'upstream_authentication';
      category = 'upstream_authentication';
      retryable = false;
    } else if (status === 429 || lowerCode.includes('rate_limit') || lowerType.includes('requests')) {
      if (lowerCode.includes('quota') || lowerType.includes('quota') || lowerMsg.includes('quota')) {
        code = 'upstream_quota';
        category = 'upstream_quota';
        retryable = false;
      } else {
        code = 'upstream_rate_limit';
        category = 'upstream_rate_limit';
        retryable = true;
      }
    } else if (status === 408 || status === 504 || lowerCode.includes('timeout') || lowerMsg.includes('timeout')) {
      code = 'timeout';
      category = 'timeout';
      retryable = true;
    } else if (status === 413 || context.is_payload_too_large) {
      code = context.is_response_too_large ? 'response_too_large' : 'request_too_large';
      category = code;
      retryable = false;
    } else if (status === 404 && (lowerMsg.includes('model') || context.model_id)) {
      code = 'request_invalid';
      category = 'request_invalid';
      retryable = false;
    } else if (status === 400 || status === 404 || status === 422 || lowerCode.includes('invalid') || lowerType.includes('invalid')) {
      code = 'request_invalid';
      category = 'request_invalid';
      retryable = false;
    } else if (status && status >= 500 && status <= 599) {
      code = 'upstream_server_error';
      category = 'upstream_server_error';
      retryable = true;
    }

    const sanitizedMsg = sanitizeMessage(rawMsg || context.message || 'An upstream execution error occurred');
    const safeDetails = sanitizeDetails(detailsObj);

    const execErr = createExecutionError({
      contract_version: EXECUTION_CONTRACT_VERSION,
      code,
      category,
      message: sanitizedMsg,
      retryable,
      request_id: context.request_id || null,
      provider_id: context.provider_id || null,
      status: Number.isInteger(status) && status >= 100 && status <= 599 ? status : 500,
      details: safeDetails,
      redacted: true,
    });

    const validationCheck = validateExecutionError(execErr);
    if (!validationCheck.success) {
      return createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'internal_execution_error',
        category: 'internal_execution_error',
        message: 'Normalized execution error failed validation',
        retryable: false,
        request_id: context.request_id || null,
        provider_id: context.provider_id || null,
        status: 500,
        details: null,
        redacted: true,
      });
    }

    return execErr;
  } catch (_) {
    return createExecutionError({
      contract_version: EXECUTION_CONTRACT_VERSION,
      code: 'internal_execution_error',
      category: 'internal_execution_error',
      message: 'Failed to normalize error safely',
      retryable: false,
      request_id: context.request_id || null,
      provider_id: context.provider_id || null,
      status: 500,
      details: null,
      redacted: true,
    });
  }
}
