import {
  parseCanonicalIPv4,
  classifyIPv4Address,
} from './ipv4-policy.js';
import {
  parseCanonicalIPv6,
  classifyIPv6Address,
} from './ipv6-policy.js';

export {
  parseCanonicalIPv4,
  classifyIPv4Address,
} from './ipv4-policy.js';

export {
  parseCanonicalIPv6,
  classifyIPv6Address,
} from './ipv6-policy.js';

/**
 * Universal IP address classifier supporting IPv4 and IPv6 string inputs.
 */
export function classifyAddress(input) {
  if (typeof input !== 'string') {
    return Object.freeze({
      family: null,
      normalized_address: null,
      globally_reachable: false,
      allowed: false,
      classification: 'invalid_input',
      matched_prefix: null,
      prefix_length: 0,
      registry_source: null,
      error: 'input_must_be_string',
    });
  }

  if (input.includes(':')) {
    return classifyIPv6Address(input);
  }

  return classifyIPv4Address(input);
}

/**
 * Pure evaluation of a resolved address set (e.g. from DNS resolution).
 * Fail-closed: Every address in the set MUST be globally reachable and valid.
 * Deterministic selection: IPv4 before IPv6, then ascending numeric order.
 */
export function evaluateResolvedAddressSet(records) {
  if (!Array.isArray(records)) {
    return Object.freeze({ success: false, error: 'records_must_be_array' });
  }

  if (records.length === 0) {
    return Object.freeze({ success: false, error: 'empty_record_set' });
  }

  if (records.length > 32) {
    return Object.freeze({ success: false, error: 'exceeds_maximum_record_limit' });
  }

  const approvedRecords = [];
  const seenAddresses = new Set();
  let minTtl = Infinity;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];

    if (!rec || typeof rec !== 'object') {
      return Object.freeze({ success: false, error: 'invalid_record_object', index: i });
    }

    // Prototype safety checks
    const keys = Object.keys(rec);
    for (const key of keys) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return Object.freeze({ success: false, error: 'prototype_sensitive_key_rejected', key });
      }
    }

    // Own property check
    if (!Object.prototype.hasOwnProperty.call(rec, 'address') || !Object.prototype.hasOwnProperty.call(rec, 'family')) {
      return Object.freeze({ success: false, error: 'missing_required_record_properties', index: i });
    }

    const { address, family, ttl } = rec;

    if (family !== 4 && family !== 6) {
      return Object.freeze({ success: false, error: 'invalid_address_family', family, index: i });
    }

    if (typeof ttl === 'number') {
      if (ttl < 0 || !Number.isInteger(ttl)) {
        return Object.freeze({ success: false, error: 'invalid_ttl_value', ttl, index: i });
      }
      if (ttl < minTtl) minTtl = ttl;
    }

    // Parse and classify address
    const classification = classifyAddress(address);

    if (classification.family !== family) {
      return Object.freeze({ success: false, error: 'family_mismatch_with_parsed_address', declared_family: family, index: i });
    }

    if (!classification.allowed || !classification.globally_reachable) {
      return Object.freeze({
        success: false,
        error: 'non_global_or_forbidden_address_in_set',
        address,
        classification: classification.classification,
        index: i,
      });
    }

    if (!seenAddresses.has(classification.normalized_address)) {
      seenAddresses.add(classification.normalized_address);

      let numericSortKey = 0n;
      if (family === 4) {
        const p4 = parseCanonicalIPv4(classification.normalized_address);
        numericSortKey = BigInt(p4.numeric_value);
      } else {
        const p6 = parseCanonicalIPv6(classification.normalized_address);
        numericSortKey = p6.bigint_value;
      }

      approvedRecords.push(Object.freeze({
        address: classification.normalized_address,
        family,
        numeric_sort_key: numericSortKey,
        classification,
      }));
    }
  }

  // Deterministic Sorting Rule:
  // 1. IPv4 (family 4) before IPv6 (family 6)
  // 2. Ascending numeric order within family
  approvedRecords.sort((a, b) => {
    if (a.family !== b.family) {
      return a.family - b.family;
    }
    if (a.numeric_sort_key < b.numeric_sort_key) return -1;
    if (a.numeric_sort_key > b.numeric_sort_key) return 1;
    return 0;
  });

  const finalApprovedAddresses = Object.freeze(approvedRecords.map((r) => Object.freeze({
    address: r.address,
    family: r.family,
    classification: r.classification.classification,
  })));

  const selected = finalApprovedAddresses[0];

  return Object.freeze({
    success: true,
    approved_addresses: finalApprovedAddresses,
    selected_address: selected.address,
    selected_family: selected.family,
    min_ttl: minTtl === Infinity ? null : minTtl,
    total_input_records: records.length,
    deduplicated_count: finalApprovedAddresses.length,
  });
}
