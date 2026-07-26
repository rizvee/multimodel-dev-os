import {
  parseCanonicalIPv4,
  classifyIPv4Address,
} from './ipv4-policy.js';
import {
  IANA_IPV6_SPECIAL_REGISTRY_METADATA,
  COMBINED_IPV6_RECORDS,
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
    if (prefixPart !== '::ffff' && prefixPart !== '64:ff9b:') {
      return Object.freeze({ success: false, error: 'non_canonical_mapped_prefix' });
    }
    const ipv4Result = parseCanonicalIPv4(possibleIpv4);
    if (!ipv4Result.success) {
      return Object.freeze({ success: false, error: `mapped_ipv4_invalid: ${ipv4Result.error}` });
    }

    const [a, b, c, d] = ipv4Result.octets;
    const w6 = (a << 8) | b;
    const w7 = (c << 8) | d;

    let bigintVal = 0n;
    if (prefixPart === '::ffff') {
      bigintVal = (0xffffn << 32n) | BigInt(ipv4Result.numeric_value);
    } else {
      // 64:ff9b::/96 -> (0x00640ff9n << 96n) | BigInt(ipv4Result.numeric_value)
      bigintVal = (0x00640ff9n << 96n) | BigInt(ipv4Result.numeric_value);
    }

    const canonicalString = prefixPart.endsWith(':') ? `${prefixPart}${ipv4Result.normalized_address}` : `${prefixPart}:${ipv4Result.normalized_address}`;

    return Object.freeze({
      success: true,
      normalized_address: canonicalString,
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
    if (part.length > 1 && part.startsWith('0')) {
      return Object.freeze({ success: false, error: 'unnecessary_leading_zero' });
    }
    words.push(parseInt(part, 16));
  }

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

function formatRfc5952(words) {
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

  const [left, right] = ipStr.includes('::') ? ipStr.split('::') : [ipStr, ''];
  const pLeft = left ? left.split(':') : [];
  const pRight = right ? right.split(':') : [];
  const missing = 8 - (pLeft.length + pRight.length);
  const allHex = [...pLeft, ...new Array(missing).fill('0'), ...pRight];

  let val = 0n;
  for (const h of allHex) {
    val = (val << 16n) | BigInt(parseInt(h || '0', 16));
  }

  const mask = prefixLength === 0 ? 0n : (((~0n) << BigInt(128 - prefixLength)) & ((1n << 128n) - 1n));
  return { prefixBigInt: val, prefixLength, mask };
}

// Precompile IPv6 Cidr masks once
const PRECOMPILED_IPV6_RECORDS = COMBINED_IPV6_RECORDS.map(rec => {
  const { prefixBigInt, prefixLength, mask } = ipv6CidrToBigInt(rec.prefix);
  return { ...rec, prefixBigInt, prefixLength, mask };
});

const IPV6_GLOBAL_UNICAST_MASK = ((~0n) << BigInt(128 - 3)) & ((1n << 128n) - 1n);
const IPV6_GLOBAL_UNICAST_PREFIX = 0x20000000000000000000000000000000n; // 2000::/3

/**
 * Classify a canonical IPv6 address string against IANA special-purpose registry & 2000::/3 Global Unicast boundary.
 */
export function classifyIPv6Address(input) {
  const parseResult = parseCanonicalIPv6(input);
  if (!parseResult.success) {
    return Object.freeze({
      family: 6,
      normalized_address: null,
      globally_reachable: false,
      allowed: false,
      active: false,
      classification: 'malformed_ipv6',
      matched_prefix: null,
      prefix_length: 0,
      registry_source: IANA_IPV6_SPECIAL_REGISTRY_METADATA.source_url,
      error: parseResult.error,
    });
  }

  if (parseResult.is_mapped_ipv4) {
    const mappedClass = classifyIPv4Address(parseResult.mapped_ipv4_address);
    const isAllowed = mappedClass.allowed === true;
    const matchedPrefix = parseResult.normalized_address.startsWith('64:ff9b::') ? '64:ff9b::/96' : '::ffff:0:0/96';
    return Object.freeze({
      family: 6,
      normalized_address: parseResult.normalized_address,
      globally_reachable: mappedClass.globally_reachable,
      allowed: isAllowed,
      active: true,
      classification: parseResult.normalized_address.startsWith('64:ff9b::') ? `64:ff9b NAT64 (${mappedClass.classification})` : `IPv4-mapped (${mappedClass.classification})`,
      matched_prefix: matchedPrefix,
      prefix_length: 96,
      registry_source: IANA_IPV6_SPECIAL_REGISTRY_METADATA.source_url,
      reference: 'RFC 6052 / RFC 4291 / Embedded IPv4 Policy',
      mapped_ipv4_classification: mappedClass,
    });
  }

  const ipBigInt = parseResult.bigint_value;

  // Real Longest-Prefix Matching
  const matchingRecords = [];
  for (const record of PRECOMPILED_IPV6_RECORDS) {
    if ((ipBigInt & record.mask) === (record.prefixBigInt & record.mask)) {
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

    // Special IPv4-embedded check for 64:ff9b::/96
    if (bestRecord.prefix === '64:ff9b::/96') {
      const embeddedIpv4BigInt = ipBigInt & 0xffffffffn;
      const octet1 = Number((embeddedIpv4BigInt >> 24n) & 0xffn);
      const octet2 = Number((embeddedIpv4BigInt >> 16n) & 0xffn);
      const octet3 = Number((embeddedIpv4BigInt >> 8n) & 0xffn);
      const octet4 = Number(embeddedIpv4BigInt & 0xffn);
      const embeddedIpv4Str = `${octet1}.${octet2}.${octet3}.${octet4}`;

      const mappedClass = classifyIPv4Address(embeddedIpv4Str);
      const isAllowed = mappedClass.allowed === true;

        return Object.freeze({
          family: 6,
          normalized_address: parseResult.normalized_address,
          globally_reachable: mappedClass.globally_reachable,
          allowed: isAllowed,
          active: bestRecord.active,
          classification: `64:ff9b NAT64 (${mappedClass.classification})`,
          matched_prefix: '64:ff9b::/96',
          prefix_length: 96,
          registry_source: IANA_IPV6_SPECIAL_REGISTRY_METADATA.source_url,
          reference: bestRecord.reference,
          raw_official_record: bestRecord,
        });
    }

    // Effective Allow Rule: active === true && destination === true && globally_reachable === true
    const isEffectiveAllowed = (
      bestRecord.active === true &&
      bestRecord.destination === true &&
      bestRecord.globally_reachable === true
    );

    return Object.freeze({
      family: 6,
      normalized_address: parseResult.normalized_address,
      globally_reachable: bestRecord.globally_reachable,
      allowed: isEffectiveAllowed,
      active: bestRecord.active,
      classification: bestRecord.name,
      matched_prefix: bestRecord.prefix,
      prefix_length: bestRecord.prefixLength,
      registry_source: IANA_IPV6_SPECIAL_REGISTRY_METADATA.source_url,
      reference: bestRecord.reference,
      raw_official_record: bestRecord,
    });
  }

  // IPv6 Default Unicast Rule: Default allow ONLY inside 2000::/3 Global Unicast space
  const isIn2000_3 = (ipBigInt & IPV6_GLOBAL_UNICAST_MASK) === IPV6_GLOBAL_UNICAST_PREFIX;

  if (isIn2000_3) {
    return Object.freeze({
      family: 6,
      normalized_address: parseResult.normalized_address,
      globally_reachable: true,
      allowed: true,
      active: true,
      classification: 'Global Unicast (2000::/3)',
      matched_prefix: '2000::/3',
      prefix_length: 3,
      registry_source: IANA_IPV6_SPECIAL_REGISTRY_METADATA.source_url,
      reference: 'RFC 4291 Global Unicast Boundary Rule',
    });
  }

  // Deny unmatched addresses outside 2000::/3
  return Object.freeze({
    family: 6,
    normalized_address: parseResult.normalized_address,
    globally_reachable: false,
    allowed: false,
    active: false,
    classification: 'Reserved Unmatched IPv6 (Outside 2000::/3)',
    matched_prefix: null,
    prefix_length: 0,
    registry_source: IANA_IPV6_SPECIAL_REGISTRY_METADATA.source_url,
    reference: 'RFC 4291 Reserved IPv6 Range Rejection',
  });
}
