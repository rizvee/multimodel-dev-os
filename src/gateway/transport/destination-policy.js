import {
  parseCanonicalIPv4,
  classifyIPv4Address,
} from './ipv4-policy.js';
import {
  parseCanonicalIPv6,
  classifyIPv6Address,
} from './ipv6-policy.js';

/**
 * Pure Destination Authority & WHATWG Equivalence URL Evaluator.
 * Validates raw authority/path before WHATWG URL parsing and verifies 100% equivalence.
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

  // Exact lowercase scheme check
  if (!input.startsWith('https://')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'scheme_must_be_exact_https',
    });
  }

  // Extract raw authority and raw path prior to WHATWG normalization
  const urlWithoutScheme = input.slice(8);
  const slashIndex = urlWithoutScheme.indexOf('/');
  const rawAuthority = slashIndex === -1 ? urlWithoutScheme : urlWithoutScheme.slice(0, slashIndex);
  const rawPath = slashIndex === -1 ? '/' : urlWithoutScheme.slice(slashIndex);

  if (!rawAuthority || rawAuthority.trim() === '') {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'empty_authority_rejected',
    });
  }

  // Reject raw userinfo
  if (rawAuthority.includes('@')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_forbidden',
      reason: 'userinfo_not_permitted',
    });
  }

  if (rawPath.includes('?')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_forbidden',
      reason: 'query_string_not_permitted',
    });
  }

  if (rawPath.includes('#')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_forbidden',
      reason: 'fragment_not_permitted',
    });
  }

  // Extract raw hostname and port from authority
  let rawHost = rawAuthority;
  let rawPort = null;

  if (rawAuthority.startsWith('[')) {
    const closeBracket = rawAuthority.indexOf(']');
    if (closeBracket === -1) {
      return Object.freeze({
        success: false,
        error: 'endpoint_invalid',
        reason: 'malformed_bracketed_ipv6_authority',
      });
    }
    rawHost = rawAuthority.slice(0, closeBracket + 1);
    const portPart = rawAuthority.slice(closeBracket + 1);
    if (portPart.startsWith(':')) {
      rawPort = portPart.slice(1);
    } else if (portPart !== '') {
      return Object.freeze({
        success: false,
        error: 'endpoint_invalid',
        reason: 'malformed_port_after_bracketed_ipv6',
      });
    }
  } else {
    if (rawAuthority.includes(':')) {
      const parts = rawAuthority.split(':');
      if (parts.length > 2) {
        return Object.freeze({
          success: false,
          error: 'endpoint_invalid',
          reason: 'unbracketed_ipv6_literal_rejected',
        });
      }
      rawHost = parts[0];
      rawPort = parts[1];
    }
  }

  // Explicit port check
  if (rawPort !== null && rawPort !== '443') {
    return Object.freeze({
      success: false,
      error: 'endpoint_forbidden',
      reason: 'alternate_ports_not_permitted',
    });
  }

  // Raw Host checks
  if (rawHost.includes('%')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'percent_encoding_in_hostname_rejected',
    });
  }

  if (rawHost.endsWith('.')) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'trailing_dot_hostname_rejected',
    });
  }

  let isIpLiteral = false;
  let addressFamily = null;
  let normalizedAddress = null;
  let classificationResult = null;

  if (rawHost.startsWith('[') && rawHost.endsWith(']')) {
    isIpLiteral = true;
    const rawIpv6Text = rawHost.slice(1, -1);
    const p6 = parseCanonicalIPv6(rawIpv6Text);
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
  } else if (/^[\d.xXa-fA-F+-]+$/.test(rawHost)) {
    isIpLiteral = true;
    const p4 = parseCanonicalIPv4(rawHost);
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
    // Hostname checks
    if (/[A-Z]/.test(rawHost)) {
      return Object.freeze({
        success: false,
        error: 'endpoint_invalid',
        reason: 'uppercase_hostname_rejected',
      });
    }

    if (!rawHost.includes('.')) {
      return Object.freeze({
        success: false,
        error: 'endpoint_invalid',
        reason: 'single_label_hostname_rejected',
      });
    }

    if (rawHost.length > 253) {
      return Object.freeze({
        success: false,
        error: 'endpoint_invalid',
        reason: 'hostname_exceeds_max_length',
      });
    }

    const labels = rawHost.split('.');
    for (const label of labels) {
      if (label.length === 0 || label.length > 63) {
        return Object.freeze({
          success: false,
          error: 'endpoint_invalid',
          reason: 'invalid_label_length',
        });
      }
      if (label.startsWith('xn--') || label.includes('xn--')) {
        return Object.freeze({
          success: false,
          error: 'endpoint_invalid',
          reason: 'punycode_hostname_unsupported',
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

  // Recursive Path Safety Check
  const pathEval = evaluatePathSafety(rawPath);
  if (!pathEval.success) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: pathEval.reason,
    });
  }

  // WHATWG URL Equivalence Verification
  let parsedUrl;
  try {
    parsedUrl = new URL(input);
  } catch (_) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'whatwg_url_parse_failed',
    });
  }

  if (parsedUrl.protocol !== 'https:') {
    return Object.freeze({ success: false, error: 'endpoint_invalid', reason: 'whatwg_scheme_mismatch' });
  }
  if (parsedUrl.username !== '' || parsedUrl.password !== '') {
    return Object.freeze({ success: false, error: 'endpoint_forbidden', reason: 'whatwg_userinfo_mismatch' });
  }
  if (parsedUrl.search !== '' || parsedUrl.hash !== '') {
    return Object.freeze({ success: false, error: 'endpoint_forbidden', reason: 'whatwg_query_or_hash_mismatch' });
  }
  if (parsedUrl.port !== '' && parsedUrl.port !== '443') {
    return Object.freeze({ success: false, error: 'endpoint_forbidden', reason: 'whatwg_port_mismatch' });
  }

  // Compare raw host and WHATWG parsed host
  let expectedWhatwgHost = rawHost.toLowerCase();
  if (isIpLiteral && addressFamily === 6) {
    expectedWhatwgHost = `[${normalizedAddress}]`;
  }
  if (parsedUrl.hostname !== expectedWhatwgHost && parsedUrl.hostname !== rawHost) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'whatwg_hostname_normalization_mismatch',
    });
  }

  if (parsedUrl.pathname !== pathEval.normalized_path) {
    return Object.freeze({
      success: false,
      error: 'endpoint_invalid',
      reason: 'whatwg_pathname_normalization_mismatch',
    });
  }

  const canonicalUrl = `https://${rawHost}${pathEval.normalized_path}`;

  return Object.freeze({
    success: true,
    canonical_url: canonicalUrl,
    scheme: 'https',
    hostname: rawHost,
    port: 443,
    pathname: pathEval.normalized_path,
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

/**
 * Hardened Path Safety Evaluator with literal control check and max 3 decode passes.
 */
export function evaluatePathSafety(rawPath) {
  if (typeof rawPath !== 'string' || !rawPath.startsWith('/')) {
    return { success: false, reason: 'pathname_must_be_absolute' };
  }

  // Reject literal control characters [\x00-\x1f\x7f] and whitespace
  if (/[\x00-\x1f\x7f\s]/.test(rawPath)) {
    return { success: false, reason: 'literal_control_characters_rejected' };
  }

  if (rawPath.includes('\\')) {
    return { success: false, reason: 'backslash_rejected' };
  }

  // Multi-pass percent decoding (max 3 passes)
  let currentPass = rawPath;
  const maxPasses = 3;

  for (let passIndex = 0; passIndex < maxPasses; passIndex++) {
    // Reject control characters before and after every pass
    if (/[\x00-\x1f\x7f]/.test(currentPass)) {
      return { success: false, reason: 'literal_control_characters_rejected' };
    }

    // Check for malformed percent encoding: % followed by non-hex
    if (/%(?![0-9a-fA-F]{2})/.test(currentPass)) {
      return { success: false, reason: 'malformed_percent_encoding' };
    }

    const lowerPass = currentPass.toLowerCase();

    // Check encoded slashes & backslashes
    if (lowerPass.includes('%2f') || lowerPass.includes('%5c')) {
      return { success: false, reason: 'encoded_separator_rejected' };
    }

    // Check encoded dot traversal & NUL
    if (
      lowerPass.includes('%2e%2e') ||
      lowerPass.includes('.%2e') ||
      lowerPass.includes('%2e.') ||
      lowerPass.includes('..') ||
      lowerPass.includes('%00')
    ) {
      return { success: false, reason: 'encoded_traversal_or_nul_rejected' };
    }

    let decoded;
    try {
      decoded = decodeURIComponent(currentPass);
    } catch (_) {
      return { success: false, reason: 'malformed_percent_encoding' };
    }

    if (decoded === currentPass) {
      break;
    }
    currentPass = decoded;
  }

  // Fail closed if any undecoded percent sequence remains after 3 passes
  if (/%[0-9a-fA-F]{2}/.test(currentPass)) {
    return { success: false, reason: 'undecoded_percent_sequence_remaining_after_max_passes' };
  }

  // Verify final path structure
  if (currentPass.includes('\\') || currentPass.includes('..') || /[\x00-\x1f\x7f]/.test(currentPass)) {
    return { success: false, reason: 'path_traversal_or_control_rejected' };
  }

  const segments = rawPath.split('/');
  for (const seg of segments) {
    if (seg === '.' || seg === '..') {
      return { success: false, reason: 'dot_traversal_segment_rejected' };
    }
  }

  return {
    success: true,
    normalized_path: rawPath,
  };
}
