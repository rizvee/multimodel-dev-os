/**
 * Registry Trust Verdict Helper
 *
 * Builds a deterministic, JSON-serializable structured trust verdict object.
 * Used for both CLI display and provenance lockfile persistence.
 */

/**
 * Creates a structured trust verdict object.
 *
 * @param {Object} options
 * @param {string} options.source                   Registry name.
 * @param {string} options.source_type              "bundled" | "local" | "remote".
 * @param {string} [options.manifest_hash_status]   Manifest verification status.
 * @param {string} [options.catalog_hash_status]    Catalog verification status.
 * @param {string} [options.lockfile_status]       Lockfile existence status.
 * @param {string} [options.provenance_status]     Provenance lock match status.
 * @param {string} [options.signature_status]      Signature check status.
 * @param {string} [options.trusted_publisher_status] Trust store lookup status.
 * @param {string[]} [options.errors]               List of verification errors.
 * @param {string[]} [options.warnings]             List of verification warnings.
 * @param {"trusted"|"warning"|"untrusted"|"unknown"} [options.final_status] Overall trust state.
 * @returns {Object}
 */
export function createTrustVerdict({
  source,
  source_type,
  manifest_hash_status = 'N/A',
  catalog_hash_status = 'N/A',
  lockfile_status = 'N/A',
  provenance_status = 'N/A',
  signature_status = 'N/A',
  trusted_publisher_status = 'N/A',
  errors = [],
  warnings = [],
  final_status = 'unknown'
}) {
  return {
    source,
    source_type,
    manifest_hash_status,
    catalog_hash_status,
    lockfile_status,
    provenance_status,
    signature_status,
    trusted_publisher_status,
    errors: Array.isArray(errors) ? errors : [],
    warnings: Array.isArray(warnings) ? warnings : [],
    final_status
  };
}
