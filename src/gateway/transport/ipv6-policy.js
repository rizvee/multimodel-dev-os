import {
  parseCanonicalIPv4,
  classifyIPv4Address,
} from './ipv4-policy.js';
import {
  IANA_IPV6_SPECIAL_RECORDS,
  IANA_IPV6_SPECIAL_REGISTRY_METADATA,
} from './registry-snapshot.js';

/**
 * Strict RFC 5952 canonical IPv6 parser.
 */
export function parseCanonicalIPv6(input) {
  if (typeof input !== 'string') {
    return Object.freeze({ success: false, error: 'input_must_be_string' });
  }

  if (input.length === 0 || input.length > 45) {
    return Object.freeze({ success: false, error: 'invalid_length' });
  }

  // Reject scope/zone identifiers, brackets, uppercase, leading zeros in hex words
  if (input.includes('%') || input.includes('[') || input.includes(']')) {
    return Object.freeze({ success: false, error: 'zone_or_bracket_rejected' });
  }

  if (/[A-Z]/.test(input)) {
    return Object.freeze({ success: false, error: 'uppercase_rejected' });
  }

  // Check for IPv4-mapped IPv6 syntax: e.g., ::ffff:192.0.2.1
  const mappedIndex = input.lastIndexOf(':');
  const possibleIpv4 = input.slice(mappedIndex + 1);
  if (possibleIpv4.includes('.')) {
    const prefixPart = input.slice(0, mappedIndex);
    // RFC 5952 canonical mapped prefix is strictly '::ffff'
    if (prefixPart !== '::ffff') {
      return Object.freeze({ success: false, error: 'non_canonical_mapped_prefix' });
    }
    const ipv4Result = parseCanonicalIPv4(possibleIpv4);
    if (!ipv4Result.success) {
      return Object.freeze({ success: false, error: `mapped_ipv4_invalid: ${ipv4Result.error}` });
    }

    // Convert mapped IPv4 to 128-bit BigInt
    // ::ffff:a.b.c.d -> words [0,0,0,0,0,0xffff, (a<<8)+b, (c<<8)+d]
    const [a, b, c, d] = ipv4Result.octets;
    const w6 = (a << 8) | b;
    const w7 = (c << 8) | d;
    const words = Object.freeze([0, 0, 0, 0, 0, 0xffff, w6, w7]);
    
    let bigintVal = 0n;
    bigintVal = (bigintVal << 16n) | 0xffffn;
    bigintVal = (bigintVal << 16n) | BigInt(w6);
    bigintVal = (bigintVal << 16n) | BigInt(w7);

    const canonicalString = `::ffff:${ipv4Result.normalized_address}`;

    return Object.freeze({
      success: true,
      normalized_address: canonicalString,
      words,
      bigint_value: bigintVal,
      is_mapped_ipv4: true,
      mapped_ipv4_address: ipv4Result.normalized_address,
    });
  }

  // Parse pure IPv6
  const doubleColonCount = (input.match(/::/g) || []).length;
  if (doubleColonCount > 1) {
    return Object.freeze({ success: false, error: 'multiple_double_colons' });
  }

  let partsLeft = [];
  let partsRight = [];

  if (doubleColonCount === 1) {
    const [leftStr, rightStr] = input.split('::');
    partsLeft = leftStr ? leftStr.split(':') : [];
    partsRight = rightStr ? rightStr.split(':') : [];
  } else {
    partsLeft = input.split(':');
  }

  const totalSegmentsGiven = partsLeft.length + partsRight.length;
  if (doubleColonCount === 0 && totalSegmentsGiven !== 8) {
    return Object.freeze({ success: false, error: 'invalid_segment_count' });
  }
  if (doubleColonCount === 1 && totalSegmentsGiven >= 8) {
    return Object.freeze({ success: false, error: 'invalid_segment_count_with_compression' });
  }

  const missingZerosCount = 8 - totalSegmentsGiven;
  const zeroSegments = new Array(missingZerosCount).fill('0');
  const allHexParts = [...partsLeft, ...zeroSegments, ...partsRight];

  const words = [];
  for (const part of allHexParts) {
    if (!/^[0-9a-f]{1,4}$/.test(part)) {
      return Object.freeze({ success: false, error: 'invalid_hex_segment' });
    }
    // Strict RFC 5952: no unnecessary leading zeros (e.g. '0001' must be '1', '0000' must be '0')
    if (part.length > 1 && part.startsWith('0')) {
      return Object.freeze({ success: false, error: 'unnecessary_leading_zero' });
    }
    words.push(parseInt(part, 16));
  }

  // Verify RFC 5952 canonical formatting (compression of longest zero run, leftmost tie-breaker)
  const canonicalString = formatRfc5952(words);
  if (canonicalString !== input) {
    return Object.freeze({ success: false, error: 'non_canonical_rfc5952_format' });
  }

  let bigintVal = 0n;
  for (const w of words) {
    bigintVal = (bigintVal << 16n) | BigInt(w);
  }

  return Object.freeze({
    success: true,
    normalized_address: canonicalString,
    words: Object.freeze(words),
    bigint_value: bigintVal,
    is_mapped_ipv4: false,
    mapped_ipv4_address: null,
  });
}

/**
 * Format 8 16-bit words into strict RFC 5952 canonical IPv6 text.
 */
function formatRfc5952(words) {
  // Find longest zero run of length >= 2
  let maxRunStart = -1;
  let maxRunLen = 0;
  let currentRunStart = -1;
  let currentRunLen = 0;

  for (let i = 0; i < 8; i++) {
    if (words[i] === 0) {
      if (currentRunStart === -1) {
        currentRunStart = i;
        currentRunLen = 1;
      } else {
        currentRunLen++;
      }
      if (currentRunLen > maxRunLen && currentRunLen >= 2) {
        maxRunLen = currentRunLen;
        maxRunStart = currentRunStart;
      }
    } else {
      currentRunStart = -1;
      currentRunLen = 0;
    }
  }

  const parts = [];
  for (let i = 0; i < 8; i++) {
    if (i === maxRunStart) {
      parts.push('');
      i += maxRunLen - 1;
      if (i === 7) parts.push('');
    } else {
      parts.push(words[i].toString(16));
    }
  }

  let result = parts.join(':');
  if (result.startsWith(':') && !result.startsWith('::')) {
    result = ':' + result;
  }
  if (result.endsWith(':') && !result.endsWith('::')) {
    result = result + ':';
  }
  return result;
}

function ipv6CidrToBigInt(prefixStr) {
  const [ipStr, lenStr] = prefixStr.split('/');
  const prefixLength = parseInt(lenStr, 10);

  // Helper for CIDR parsing without requiring full RFC 5952 canonical check for snapshot prefixes
  const [left, right] = ipStr.includes('::') ? ipStr.split('::') : [ipStr, ''];
  const pLeft = left ? left.split(':') : [];
  const pRight = right ? right.split(':') : [];
  const missing = 8 - (pLeft.length + pRight.length);
  const allHex = [...pLeft, ...new Array(missing).fill('0'), ...pRight];
  
  let val = 0n;
  for (const h of allHex) {
    val = (val << 16n) | BigInt(parseInt(h || '0', 16));
  }

  const mask = prefixLength === 0 ? 0n : ((~0n) << BigInt(128 - prefixLength)) & ((1n << 128n) - 1n);
  return { prefixBigInt: val, prefixLength, mask };
}

/**
 * Classify a canonical IPv6 address string against IANA special-purpose registry & longest-prefix matching.
 */
export function classifyIPv6Address(input) {
  const parseResult = parseCanonicalIPv6(input);
  if (!parseResult.success) {
    return Object.freeze({
      family: 6,
      normalized_address: null,
      globally_reachable: false,
      allowed: false,
      classification: 'malformed_ipv6',
      matched_prefix: null,
      prefix_length: 0,
      registry_source: IANA_IPV6_SPECIAL_REGISTRY_METADATA.source_url,
      error: parseResult.error,
    });
  }

  // Special handling for IPv4-mapped IPv6 Addresses: classify mapped IPv4 portion directly
  if (parseResult.is_mapped_ipv4) {
    const mappedClass = classifyIPv4Address(parseResult.mapped_ipv4_address);
    return Object.freeze({
      family: 6,
      normalized_address: parseResult.normalized_address,
      globally_reachable: mappedClass.globally_reachable,
      allowed: mappedClass.allowed,
      classification: `IPv4-mapped (${mappedClass.classification})`,
      matched_prefix: '::ffff:0:0/96',
      prefix_length: 96,
      registry_source: IANA_IPV6_SPECIAL_REGISTRY_METADATA.source_url,
      reference: 'RFC 4291 / Embedded IPv4 Policy',
      mapped_ipv4_classification: mappedClass,
    });
  }

  const ipBigInt = parseResult.bigint_value;

  for (const record of IANA_IPV6_SPECIAL_RECORDS) {
    const { prefixBigInt, prefixLength, mask } = ipv6CidrToBigInt(record.prefix);
    if ((ipBigInt & mask) === (prefixBigInt & mask)) {
      const isGlobal = record.globally_reachable === true;
      return Object.freeze({
        family: 6,
        normalized_address: parseResult.normalized_address,
        globally_reachable: isGlobal,
        allowed: isGlobal,
        classification: record.name,
        matched_prefix: record.prefix,
        prefix_length: record.prefix_length,
        registry_source: IANA_IPV6_SPECIAL_REGISTRY_METADATA.source_url,
        reference: record.reference,
      });
    }
  }

  // Default-Public Rule for IPv6
  return Object.freeze({
    family: 6,
    normalized_address: parseResult.normalized_address,
    globally_reachable: true,
    allowed: true,
    classification: 'Global Unicast',
    matched_prefix: '::/0',
    prefix_length: 0,
    registry_source: IANA_IPV6_SPECIAL_REGISTRY_METADATA.source_url,
    reference: 'Default Public Unicast Rule',
  });
}
