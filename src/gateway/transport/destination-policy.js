import {
  parseCanonicalIPv4,
  classifyIPv4Address,
} from './ipv4-policy.js';
import {
  parseCanonicalIPv6,
  classifyIPv6Address,
} from './ipv6-policy.js';
import { classifyAddress } from './address-policy.js';

/**
 * Pure Destination URL Policy Evaluator.
 * Validates target endpoint URLs against raw-input, scheme, path, hostname, and IP literal rules.
 */
export function evaluateDestinationUrl(input) {
  if (typeof input !== 'string') {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'raw_input_must_be_string',
    });
  }

  if (input.length === 0 || input.length > 2048) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'input_length_out_of_bounds',
    });
  }

  // Raw-input safety checks (before WHATWG URL parsing to prevent silent normalization attacks)
  if (/[\s\r\n\t\0]/.test(input)) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'whitespace_or_control_characters_rejected',
    });
  }

  if (input.includes('\\')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'backslash_rejected',
    });
  }

  if (/[^\x20-\x7E]/.test(input)) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'non_ascii_characters_rejected',
    });
  }

  if (input.includes('@')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_forbidden',
      reason: 'userinfo_not_permitted',
    });
  }

  if (input.includes('?')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_forbidden',
      reason: 'query_string_not_permitted',
    });
  }

  if (input.includes('#')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_forbidden',
      reason: 'fragment_not_permitted',
    });
  }

  // Scheme check
  if (!input.startsWith('https://')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'scheme_must_be_exact_https',
    });
  }

  // Path traversal checks (raw & percent-encoded)
  const lowerInput = input.toLowerCase();
  if (
    lowerInput.includes('%5c') || // \
    lowerInput.includes('%2f') || // /
    lowerInput.includes('%2e%2e') || // ..
    lowerInput.includes('..') ||
    lowerInput.includes('.%2e') ||
    lowerInput.includes('%2e.')
  ) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'encoded_separator_or_path_traversal_rejected',
    });
  }

  // Parse using WHATWG URL parser
  let parsedUrl;
  try {
    parsedUrl = new URL(input);
  } catch (_) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'malformed_url',
    });
  }

  if (parsedUrl.protocol !== 'https:') {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'scheme_must_be_exact_https',
    });
  }

  if (parsedUrl.port !== '' && parsedUrl.port !== '443') {
    return Object.freeze({
      success: false,
      error: 'endpoint_forbidden',
      reason: 'alternate_ports_not_permitted',
    });
  }

  // Extract host component directly from raw input before WHATWG URL normalization
  const hostMatch = input.match(/^https:\/\/([^/:]+)/i);
  const rawHostInput = hostMatch ? hostMatch[1] : parsedUrl.hostname;
  const rawHostname = parsedUrl.hostname;

  // Check raw host input for alternate/non-canonical IPv4 numeric syntax (octal, hex, dword, leading zeros)
  if (/^[\d.xXa-fA-F]+$/.test(rawHostInput)) {
    const rawIpParse = parseCanonicalIPv4(rawHostInput);
    if (!rawIpParse.success) {
      return Object.freeze({
        success: false,
        error: 'endpoint_invalid',
        reason: `non_canonical_ipv4_literal: ${rawIpParse.error}`,
      });
    }
  }

  if (rawHostname.endsWith('.')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'trailing_dot_hostname_rejected',
    });
  }

  if (rawHostname.includes('*')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'wildcard_hostname_rejected',
    });
  }

  if (rawHostname.includes('%')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'zone_identifier_rejected',
    });
  }

  // Check if IP literal
  let isIpLiteral = false;
  let addressFamily = null;
  let normalizedAddress = null;
  let classificationResult = null;

  if (rawHostname.startsWith('[') && rawHostname.endsWith(']')) {
    isIpLiteral = true;
    const ipv6Text = rawHostname.slice(1, -1);
    const p6 = parseCanonicalIPv6(ipv6Text);
    if (!p6.success) {
      return Object.freeze({
        success: false,
        error: 'endpoint_invalid',
        reason: `non_canonical_ipv6_literal: ${p6.error}`,
      });
    }
    classificationResult = classifyIPv6Address(p6.normalized_address);
    if (!classificationResult.allowed || !classificationResult.globally_reachable) {
      return Object.freeze({
        success: false,
        error: 'endpoint_forbidden',
        reason: `non_global_ipv6_literal: ${classificationResult.classification}`,
      });
    }
    addressFamily = 6;
    normalizedAddress = p6.normalized_address;
  } else if (/^[\d.]+$/.test(rawHostname)) {
    isIpLiteral = true;
    const p4 = parseCanonicalIPv4(rawHostname);
    if (!p4.success) {
      return Object.freeze({
        success: false,
        error: 'endpoint_invalid',
        reason: `non_canonical_ipv4_literal: ${p4.error}`,
      });
    }
    classificationResult = classifyIPv4Address(p4.normalized_address);
    if (!classificationResult.allowed || !classificationResult.globally_reachable) {
      return Object.freeze({
        success: false,
        error: 'endpoint_forbidden',
        reason: `non_global_ipv4_literal: ${classificationResult.classification}`,
      });
    }
    addressFamily = 4;
    normalizedAddress = p4.normalized_address;
  } else {
    // DNS Hostname checks
    if (!rawHostname.includes('.')) {
      return Object.freeze({
        success: false,
        error: 'endpoint_invalid',
        reason: 'single_label_hostname_rejected',
      });
    }

    if (rawHostname.length > 253) {
      return Object.freeze({
        success: false,
        error: 'endpoint_invalid',
        reason: 'hostname_exceeds_max_length',
      });
    }

    const labels = rawHostname.split('.');
    for (const label of labels) {
      if (label.length === 0 || label.length > 63) {
        return Object.freeze({
          success: false,
          error: 'endpoint_invalid',
          reason: 'invalid_label_length',
        });
      }
      if (label.startsWith('-') || label.endsWith('-')) {
        return Object.freeze({
          success: false,
          error: 'endpoint_invalid',
          reason: 'hyphen_at_label_boundary_rejected',
        });
      }
      if (label.includes('_')) {
        return Object.freeze({
          success: false,
          error: 'endpoint_invalid',
          reason: 'underscore_in_hostname_rejected',
        });
      }
      if (!/^[a-z0-9-]+$/.test(label)) {
        return Object.freeze({
          success: false,
          error: 'endpoint_invalid',
          reason: 'invalid_hostname_characters',
        });
      }
    }
  }

  // Normalized path check
  const pathname = parsedUrl.pathname;
  if (!pathname.startsWith('/')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'pathname_must_be_absolute',
    });
  }

  return Object.freeze({
    success: true,
    canonical_url: `https://${rawHostname}${pathname}`,
    scheme: 'https',
    hostname: rawHostname,
    port: 443,
    pathname,
    is_ip_literal: isIpLiteral,
    address_family: addressFamily,
    normalized_address: normalizedAddress,
    classification: classificationResult ? classificationResult.classification : 'DNS Hostname',
    safe_policy_metadata: Object.freeze({
      enforces_https: true,
      allows_query: false,
      allows_fragment: false,
      allows_userinfo: false,
    }),
  });
}
