const SECRET_KEY_PATTERN = /authorization|cookie|token|secret|api[_-]?key|credential|password|bearer/i;
const PATH_PATTERN = /[A-Za-z]:\\|\/home\/|\/Users\//;
const TOKEN_VALUE_PATTERN = /Bearer\s+[A-Za-z0-9._~+/-]+=*|sk-[A-Za-z0-9]|AIza[A-Za-z0-9]/;

const ALLOWED_METADATA_KEYS = new Set([
  'mode',
  'route',
  'strategy',
  'streamed',
  'chunk_count',
  'validation',
  'source',
  'mock',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function redactString(value) {
  if (TOKEN_VALUE_PATTERN.test(value)) return '[REDACTED]';
  if (PATH_PATTERN.test(value)) return '[PATH OMITTED]';
  return value;
}

export function redactGatewayObservability(value, { allowMetadata = false } = {}) {
  if (Array.isArray(value)) {
    return value.map((entry) => redactGatewayObservability(entry, { allowMetadata }));
  }

  if (isObject(value)) {
    const output = {};
    for (const [key, entry] of Object.entries(value)) {
      if (SECRET_KEY_PATTERN.test(key)) {
        output[key] = '[REDACTED]';
        continue;
      }
      if (/prompt|completion|request_body|response_body|messages|content|tool_arguments/i.test(key)) {
        output[key] = '[CONTENT OMITTED]';
        continue;
      }
      if (allowMetadata && !ALLOWED_METADATA_KEYS.has(key) && isObject(value)) {
        continue;
      }
      output[key] = redactGatewayObservability(entry, { allowMetadata: false });
    }
    return output;
  }

  return typeof value === 'string' ? redactString(value) : value;
}

export function safeMetadata(metadata = {}) {
  if (!isObject(metadata)) return {};
  const output = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!ALLOWED_METADATA_KEYS.has(key)) continue;
    output[key] = redactGatewayObservability(value);
  }
  return output;
}
