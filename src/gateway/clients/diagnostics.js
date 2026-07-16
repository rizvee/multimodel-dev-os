function redactUrl(value) {
  if (!value) return value;
  try {
    const url = new URL(value);
    url.username = '';
    url.password = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return String(value).replace(/Bearer\s+[^\s]+/gi, 'Bearer ${TOKEN}');
  }
}

export function createGatewayClientDiagnostics({ client, endpoint, model, compatibility, files = [], testResults = null } = {}) {
  return {
    client_id: client?.id || null,
    base_url: redactUrl(endpoint?.base_url || null),
    model: model || null,
    auth_mode: endpoint?.auth_mode || 'none-localhost-only',
    token_present: Boolean(endpoint?.token_env),
    configuration_files: files.map((file) => file.relative_path),
    compatibility_level: compatibility?.level || null,
    test_results: testResults,
    warnings: [...(compatibility?.warnings || [])],
  };
}
