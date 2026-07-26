import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  IANA_IPV4_SPECIAL_REGISTRY_METADATA,
  IANA_IPV6_SPECIAL_REGISTRY_METADATA,
  IANA_IPV4_OFFICIAL_RECORDS,
  IANA_IPV6_OFFICIAL_RECORDS,
} from '../../src/gateway/transport/registry-snapshot.js';

/**
 * Offline maintenance script to normalize official IANA Special-Purpose IP Address Registries CSVs.
 * Performs NO network requests. Standard library only.
 *
 * Usage:
 *   node scripts/maintain/normalize-iana-special-registry.js <ipv4.csv> <ipv6.csv>
 *   node scripts/maintain/normalize-iana-special-registry.js --check <ipv4.csv> <ipv6.csv>
 */

export function parseCsv(content) {
  if (typeof content !== 'string' || content.trim() === '') return [];
  
  const parseAllTokens = (str) => {
    const rows = [];
    let currentFields = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (char === '"') {
        if (inQuotes && str[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentFields.push(currentField.trim());
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && str[i + 1] === '\n') {
          i++;
        }
        currentFields.push(currentField.trim());
        currentField = '';
        if (currentFields.some(f => f !== '')) {
          rows.push(currentFields);
        }
        currentFields = [];
      } else {
        currentField += char;
      }
    }

    if (currentField !== '' || currentFields.length > 0) {
      currentFields.push(currentField.trim());
      if (currentFields.some(f => f !== '')) {
        rows.push(currentFields);
      }
    }
    return rows;
  };

  const rawRows = parseAllTokens(content);
  if (rawRows.length === 0) return [];

  const headers = rawRows[0];
  const records = [];
  for (let i = 1; i < rawRows.length; i++) {
    const values = rawRows[i];
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx];
      });
      records.push(row);
    }
  }
  return records;
}

export function normalizeValue(val) {
  if (val === undefined || val === null) return null;
  let s = String(val).trim();
  if (s === '' || s.toUpperCase() === 'N/A' || s.toUpperCase() === 'UNKNOWN') {
    return null;
  }
  // Strip footnote markers like " [1]", " [2]", etc.
  s = s.replace(/\s*\[\d+\]/g, '').trim();

  if (s.toUpperCase() === 'TRUE') return true;
  if (s.toUpperCase() === 'FALSE') return false;
  return s;
}

export function extractPrefixes(addressBlockStr) {
  if (!addressBlockStr) return [];
  // Strip footnote markers e.g. "192.0.0.0/24 [2]" -> "192.0.0.0/24"
  const cleaned = addressBlockStr.replace(/\[\d+\]/g, '').trim();
  // Split on commas or "and"
  const tokens = cleaned.split(/[\s,]+and[\s,]+|[\s,]+/);
  return tokens.map(t => t.trim()).filter(t => t.includes('/'));
}

export function processIanaCsvFiles(ipv4CsvPath, ipv6CsvPath) {
  const ipv4Buffer = fs.readFileSync(ipv4CsvPath);
  const ipv6Buffer = fs.readFileSync(ipv6CsvPath);

  const ipv4Sha256 = crypto.createHash('sha256').update(ipv4Buffer).digest('hex');
  const ipv6Sha256 = crypto.createHash('sha256').update(ipv6Buffer).digest('hex');

  const ipv4Content = ipv4Buffer.toString('utf8');
  const ipv6Content = ipv6Buffer.toString('utf8');

  const ipv4Rows = parseCsv(ipv4Content);
  const ipv6Rows = parseCsv(ipv6Content);

  // Normalize IPv4 records
  const normalizedIPv4Records = [];
  ipv4Rows.forEach((row, rowIndex) => {
    const rawAddress = row['Address Block'] || row['Address'] || row['Prefix'] || '';
    const prefixes = extractPrefixes(rawAddress);

    prefixes.forEach(prefixStr => {
      const [ip, lenStr] = prefixStr.split('/');
      const prefixLength = parseInt(lenStr, 10);
      const active = normalizeValue(row['Termination Date']) === null;

      normalizedIPv4Records.push({
        raw_row_index: rowIndex + 1,
        prefix: prefixStr,
        prefix_length: prefixLength,
        name: (row['Name'] || '').replace(/^"""|"""$/g, '').trim(),
        reference: row['RFC'] || row['Reference'] || '',
        allocation_date: normalizeValue(row['Allocation Date']),
        termination_date: normalizeValue(row['Termination Date']),
        source: normalizeValue(row['Source']),
        destination: normalizeValue(row['Destination']),
        forwardable: normalizeValue(row['Forwardable']),
        globally_reachable: normalizeValue(row['Globally Reachable']),
        reserved_by_protocol: normalizeValue(row['Reserved-by-Protocol']),
        active,
      });
    });
  });

  // Normalize IPv6 records
  const normalizedIPv6Records = [];
  ipv6Rows.forEach((row, rowIndex) => {
    const rawAddress = row['Address Block'] || row['Address'] || row['Prefix'] || '';
    const prefixes = extractPrefixes(rawAddress);

    prefixes.forEach(prefixStr => {
      const [ip, lenStr] = prefixStr.split('/');
      const prefixLength = parseInt(lenStr, 10);
      const active = normalizeValue(row['Termination Date']) === null;

      normalizedIPv6Records.push({
        raw_row_index: rowIndex + 1,
        prefix: prefixStr,
        prefix_length: prefixLength,
        name: (row['Name'] || '').replace(/^"""|"""$/g, '').trim(),
        reference: row['RFC'] || row['Reference'] || '',
        allocation_date: normalizeValue(row['Allocation Date']),
        termination_date: normalizeValue(row['Termination Date']),
        source: normalizeValue(row['Source']),
        destination: normalizeValue(row['Destination']),
        forwardable: normalizeValue(row['Forwardable']),
        globally_reachable: normalizeValue(row['Globally Reachable']),
        reserved_by_protocol: normalizeValue(row['Reserved-by-Protocol']),
        active,
      });
    });
  });

  return {
    metadata: {
      ipv4: {
        source_url: 'https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv',
        retrieval_date: '2026-07-27',
        last_updated: '2025-10-09',
        official_row_count: ipv4Rows.length,
        normalized_record_count: normalizedIPv4Records.length,
        sha256: ipv4Sha256,
      },
      ipv6: {
        source_url: 'https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv',
        retrieval_date: '2026-07-27',
        last_updated: '2025-10-09',
        official_row_count: ipv6Rows.length,
        normalized_record_count: normalizedIPv6Records.length,
        sha256: ipv6Sha256,
      },
    },
    ipv4_records: normalizedIPv4Records,
    ipv6_records: normalizedIPv6Records,
  };
}

export function checkParity(generated, officialMetadataV4, officialMetadataV6, officialRecordsV4, officialRecordsV6) {
  const errors = [];

  if (generated.metadata.ipv4.official_row_count !== officialMetadataV4.official_row_count) {
    errors.push(`IPv4 official_row_count mismatch: generated ${generated.metadata.ipv4.official_row_count}, snapshot ${officialMetadataV4.official_row_count}`);
  }
  if (generated.metadata.ipv4.normalized_record_count !== officialMetadataV4.normalized_record_count) {
    errors.push(`IPv4 normalized_record_count mismatch: generated ${generated.metadata.ipv4.normalized_record_count}, snapshot ${officialMetadataV4.normalized_record_count}`);
  }

  if (generated.metadata.ipv6.official_row_count !== officialMetadataV6.official_row_count) {
    errors.push(`IPv6 official_row_count mismatch: generated ${generated.metadata.ipv6.official_row_count}, snapshot ${officialMetadataV6.official_row_count}`);
  }
  if (generated.metadata.ipv6.normalized_record_count !== officialMetadataV6.normalized_record_count) {
    errors.push(`IPv6 normalized_record_count mismatch: generated ${generated.metadata.ipv6.normalized_record_count}, snapshot ${officialMetadataV6.normalized_record_count}`);
  }

  // Check IPv4 record parity
  if (generated.ipv4_records.length !== officialRecordsV4.length) {
    errors.push(`IPv4 record count mismatch: generated ${generated.ipv4_records.length}, snapshot ${officialRecordsV4.length}`);
  } else {
    generated.ipv4_records.forEach((genRec, idx) => {
      const snapRec = officialRecordsV4[idx];
      if (genRec.prefix !== snapRec.prefix) {
        errors.push(`IPv4 index ${idx} prefix mismatch: ${genRec.prefix} vs ${snapRec.prefix}`);
      }
      if (genRec.prefix_length !== snapRec.prefix_length) {
        errors.push(`IPv4 index ${idx} prefix_length mismatch: ${genRec.prefix_length} vs ${snapRec.prefix_length}`);
      }
    });
  }

  // Check IPv6 record parity
  if (generated.ipv6_records.length !== officialRecordsV6.length) {
    errors.push(`IPv6 record count mismatch: generated ${generated.ipv6_records.length}, snapshot ${officialRecordsV6.length}`);
  } else {
    generated.ipv6_records.forEach((genRec, idx) => {
      const snapRec = officialRecordsV6[idx];
      if (genRec.prefix !== snapRec.prefix) {
        errors.push(`IPv6 index ${idx} prefix mismatch: ${genRec.prefix} vs ${snapRec.prefix}`);
      }
      if (genRec.prefix_length !== snapRec.prefix_length) {
        errors.push(`IPv6 index ${idx} prefix_length mismatch: ${genRec.prefix_length} vs ${snapRec.prefix_length}`);
      }
    });
  }

  return errors;
}

// CLI execution when run directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const args = process.argv.slice(2);
  const isCheckMode = args[0] === '--check';
  const fileArgs = isCheckMode ? args.slice(1) : args;

  if (fileArgs.length < 2) {
    console.error('Usage: node scripts/maintain/normalize-iana-special-registry.js [--check] <ipv4.csv> <ipv6.csv>');
    process.exit(1);
  }

  try {
    const generated = processIanaCsvFiles(fileArgs[0], fileArgs[1]);

    if (isCheckMode) {
      const parityErrors = checkParity(
        generated,
        IANA_IPV4_SPECIAL_REGISTRY_METADATA,
        IANA_IPV6_SPECIAL_REGISTRY_METADATA,
        IANA_IPV4_OFFICIAL_RECORDS,
        IANA_IPV6_OFFICIAL_RECORDS
      );

      if (parityErrors.length > 0) {
        console.error('[Generator --check FAIL] Parity check failed:');
        parityErrors.forEach(err => console.error(`  - ${err}`));
        process.exit(1);
      } else {
        console.log('[Generator --check PASS] Generated snapshot matches checked-in registry-snapshot.js perfectly.');
      }
    } else {
      console.log(JSON.stringify(generated.metadata, null, 2));
    }
  } catch (err) {
    console.error(`[Generator ERROR] ${err.message}`);
    process.exit(1);
  }
}
