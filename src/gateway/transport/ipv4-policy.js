import {
  IANA_IPV4_SPECIAL_REGISTRY_METADATA,
  COMBINED_IPV4_RECORDS,
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

// Precompile IPv4 CIDR records once
const PRECOMPILED_IPV4_RECORDS = COMBINED_IPV4_RECORDS.map(rec => {
  const [prefixIp, prefixLenStr] = rec.prefix.split('/');
  const prefixLength = parseInt(prefixLenStr, 10);
  const prefixNumeric = ipv4ToNumeric(prefixIp);
  const mask = prefixLength === 0 ? 0 : (((0xffffffff << (32 - prefixLength)) >>> 0));
  return { ...rec, prefixNumeric, prefixLength, mask };
});

/**
 * Classify a canonical IPv4 address string against IANA special-purpose registry using TRUE longest-prefix matching.
 */
export function classifyIPv4Address(input) {
  const parseResult = parseCanonicalIPv4(input);
  if (!parseResult.success) {
    return Object.freeze({
      family: 4,
      normalized_address: null,
      globally_reachable: false,
      allowed: false,
      active: false,
      classification: 'malformed_ipv4',
      matched_prefix: null,
      prefix_length: 0,
      registry_source: IANA_IPV4_SPECIAL_REGISTRY_METADATA.source_url,
      error: parseResult.error,
    });
  }

  const ipNumeric = parseResult.numeric_value;

  // Real Longest-Prefix Matching
  const matchingRecords = [];
  for (const record of PRECOMPILED_IPV4_RECORDS) {
    if ((ipNumeric & record.mask) === (record.prefixNumeric & record.mask)) {
      matchingRecords.push(record);
    }
  }

  if (matchingRecords.length > 0) {
    matchingRecords.sort((a, b) => {
      if (b.prefixLength !== a.prefixLength) {
        return b.prefixLength - a.prefixLength;
      }
      return a.prefix.localeCompare(b.prefix);
    });

    const bestRecord = matchingRecords[0];
    const isEffectiveAllowed = (
      bestRecord.active === true &&
      bestRecord.destination === true &&
      bestRecord.globally_reachable === true
    );

    return Object.freeze({
      family: 4,
      normalized_address: parseResult.normalized_address,
      globally_reachable: bestRecord.globally_reachable,
      allowed: isEffectiveAllowed,
      active: bestRecord.active,
      classification: bestRecord.name,
      matched_prefix: bestRecord.prefix,
      prefix_length: bestRecord.prefixLength,
      registry_source: IANA_IPV4_SPECIAL_REGISTRY_METADATA.source_url,
      reference: bestRecord.reference,
      raw_official_record: bestRecord,
    });
  }

  // Default-Public Rule for IPv4 outside special-purpose ranges
  return Object.freeze({
    family: 4,
    normalized_address: parseResult.normalized_address,
    globally_reachable: true,
    allowed: true,
    active: true,
    classification: 'Global Unicast',
    matched_prefix: '0.0.0.0/0',
    prefix_length: 0,
    registry_source: IANA_IPV4_SPECIAL_REGISTRY_METADATA.source_url,
    reference: 'Default Public Unicast Rule',
  });
}
