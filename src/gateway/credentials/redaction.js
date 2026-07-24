import { SENSITIVE_KEY_PATTERN, PROTOTYPE_NAMES_PATTERN } from '../protocol/constants.js';

const ABSOLUTE_PATH_PATTERN = /(?:[a-zA-Z]:[\\\/][^:\s\n\r]+|\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)+)/g;
const SECRET_TOKEN_PATTERN = /(?:sk-[A-Za-z0-9_-]{8,}|key=[A-Za-z0-9_-]+|(?:Bearer|Token)\s+[A-Za-z0-9._~+/-]+=*)/gi;

export function redactSensitiveValue(target, knownSecrets = []) {
  const secrets = [];
  const secretList = Array.isArray(knownSecrets) ? knownSecrets : [knownSecrets];
  for (const item of secretList) {
    if (item && typeof item === 'object' && typeof item.withSecret === 'function') {
      try {
        item.withSecret((raw) => {
          if (typeof raw === 'string' && raw.length >= 3) secrets.push(raw);
        });
      } catch (_) {}
    } else if (typeof item === 'string' && item.length >= 3) {
      secrets.push(item);
    }
  }

  function cleanString(str) {
    if (typeof str !== 'string') return str;
    let res = str;
    for (const secret of secrets) {
      if (secret) {
        res = res.split(secret).join('[REDACTED]');
      }
    }
    res = res
      .replace(ABSOLUTE_PATH_PATTERN, '[REDACTED_PATH]')
      .replace(SECRET_TOKEN_PATTERN, '[REDACTED]');
    return res;
  }

  function walk(val, seen = new WeakSet(), depth = 0) {
    if (val === null || val === undefined) return val;
    if (typeof val === 'string') return cleanString(val);
    if (typeof val === 'number' || typeof val === 'boolean') return val;
    if (typeof val === 'function') return '[FUNCTION]';
    if (depth > 10) return '[REDACTED_MAX_DEPTH]';

    if (typeof val === 'object') {
      if (seen.has(val)) return '[CIRCULAR]';
      seen.add(val);

      if (Array.isArray(val)) {
        return val.slice(0, 100).map((item) => walk(item, seen, depth + 1));
      }

      const copy = {};
      let keys = [];
      try {
        keys = Object.getOwnPropertyNames(val);
      } catch (_) {
        return '[UNREADABLE_OBJECT]';
      }

      for (const key of keys.slice(0, 100)) {
        if (PROTOTYPE_NAMES_PATTERN.test(key)) continue;
        if (SENSITIVE_KEY_PATTERN.test(key)) {
          copy[key] = '[REDACTED]';
          continue;
        }
        if (['stack', 'trace', 'raw_body', 'headers'].includes(key.toLowerCase())) {
          copy[key] = '[REDACTED]';
          continue;
        }
        try {
          const propVal = val[key];
          copy[key] = walk(propVal, seen, depth + 1);
        } catch (_) {
          copy[key] = '[UNREADABLE_PROPERTY]';
        }
      }
      return copy;
    }
    return String(val);
  }

  try {
    return walk(target);
  } catch (_) {
    return '[REDACTION_ERROR]';
  }
}
