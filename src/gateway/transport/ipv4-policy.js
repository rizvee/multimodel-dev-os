import {
  IANA_IPV4_SPECIAL_RECORDS,
  IANA_IPV4_SPECIAL_REGISTRY_METADATA,
} from './registry-snapshot.js';

/**
 * Strict canonical IPv4 parser.
 * Rejects non-decimal, octal, hex, dword, shortened, signed, whitespace, or trailing dot forms.
 */
export function parseCanonicalIPv4(input) {
  if (typeof input !== 'string') {
    return Object.freeze({ success: false, error: 'input_must_be_string' });
  }

  if (input.length === 0 || input.length > 15) {
    return Object.freeze({ success: false, error: 'invalid_length' });
  }

  // Strict regex: exactly 4 octets separated by dots, no leading zeros unless single '0'
  const ipv4Regex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  const match = input.match(ipv4Regex);

  if (!match) {
    return Object.freeze({ success: false, error: 'non_canonical_ipv4' });
  }

  const octet1 = parseInt(match[1], 10);
  const octet2 = parseInt(match[2], 10);
  const octet3 = parseInt(match[3], 10);
  const octet4 = parseInt(match[4], 10);

  if (octet1 > 255 || octet2 > 255 || octet3 > 255 || octet4 > 255) {
    return Object.freeze({ success: false, error: 'octet_out_of_range' });
  }

  const numericValue = ((octet1 << 24) >>> 0) + (octet2 << 16) + (octet3 << 8) + octet4;

  return Object.freeze({
    success: true,
    normalized_address: `${octet1}.${octet2}.${octet3}.${octet4}`,
    octets: Object.freeze([octet1, octet2, octet3, octet4]),
    numeric_value: numericValue,
  });
}

function ipv4ToNumeric(ipStr) {
  const parsed = parseCanonicalIPv4(ipStr);
  return parsed.numeric_value;
}

/**
 * Check if a 32-bit numeric IPv4 address falls into an IPv4 CIDR prefix.
 */
function isIPv4InCidr(ipNumeric, prefixIpStr, prefixLength) {
  const prefixNumeric = ipv4ToNumeric(prefixIpStr);
  if (prefixLength === 0) return true;
  const mask = ((0xffffffff << (32 - prefixLength)) >>> 0);
  return (ipNumeric & mask) === (prefixNumeric & mask);
}

/**
 * Classify a canonical IPv4 address string against IANA special-purpose registry & longest-prefix matching.
 */
export function classifyIPv4Address(input) {
  const parseResult = parseCanonicalIPv4(input);
  if (!parseResult.success) {
    return Object.freeze({
      family: 4,
      normalized_address: null,
      globally_reachable: false,
      allowed: false,
      classification: 'malformed_ipv4',
      matched_prefix: null,
      prefix_length: 0,
      registry_source: IANA_IPV4_SPECIAL_REGISTRY_METADATA.source_url,
      error: parseResult.error,
    });
  }

  const ipNumeric = parseResult.numeric_value;

  // Longest-prefix matching: records in IANA_IPV4_SPECIAL_RECORDS are pre-sorted by prefix_length descending where specific overrides come first
  // E.g., 192.0.0.9/32 (globally_reachable: true) comes before 192.0.0.0/24 (globally_reachable: false)
  for (const record of IANA_IPV4_SPECIAL_RECORDS) {
    const [prefixIp, prefixLenStr] = record.prefix.split('/');
    const prefixLength = parseInt(prefixLenStr, 10);
    if (isIPv4InCidr(ipNumeric, prefixIp, prefixLength)) {
      const isGlobal = record.globally_reachable === true;
      return Object.freeze({
        family: 4,
        normalized_address: parseResult.normalized_address,
        globally_reachable: isGlobal,
        allowed: isGlobal,
        classification: record.name,
        matched_prefix: record.prefix,
        prefix_length: record.prefix_length,
        registry_source: IANA_IPV4_SPECIAL_REGISTRY_METADATA.source_url,
        reference: record.reference,
      });
    }
  }

  // Default-Public Rule: If an address is outside registered special-purpose / non-unicast ranges, it is globally reachable
  return Object.freeze({
    family: 4,
    normalized_address: parseResult.normalized_address,
    globally_reachable: true,
    allowed: true,
    classification: 'Global Unicast',
    matched_prefix: '0.0.0.0/0',
    prefix_length: 0,
    registry_source: IANA_IPV4_SPECIAL_REGISTRY_METADATA.source_url,
    reference: 'Default Public Unicast Rule',
  });
}
