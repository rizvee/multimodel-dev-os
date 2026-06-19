export function validateRegistryUrl(urlStr, policy = {}) {
  if (!urlStr || typeof urlStr !== 'string') {
    throw new Error('Registry URL must be a non-empty string.');
  }

  // Reject empty/whitespace/control characters
  if (urlStr.trim() === '' || /\s/.test(urlStr) || /[\x00-\x1F\x7F-\x9F]/.test(urlStr)) {
    throw new Error('Registry URL must not contain whitespace or control characters.');
  }

  // Reject single quotes, double quotes, backticks
  if (/['"`]/.test(urlStr)) {
    throw new Error('Registry URL must not contain quotes or backticks.');
  }

  // Reject shell metacharacters
  if (/[\$\;\&\|<>\(\)\*]/.test(urlStr)) {
    throw new Error('Registry URL must not contain shell metacharacters.');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlStr);
  } catch (e) {
    throw new Error('Registry URL is malformed or invalid.');
  }

  // Reject username/password credentials
  if (parsedUrl.username || parsedUrl.password) {
    throw new Error('Registry URL must not contain credentials.');
  }

  const protocol = parsedUrl.protocol;
  const allowedProtocols = ['https:'];

  if (policy.allow_http_localhost === true) {
    if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
      allowedProtocols.push('http:');
    }
  }

  if (!allowedProtocols.includes(protocol)) {
    throw new Error(`Registry URL protocol '${protocol}' is not allowed. Only HTTPS is permitted.`);
  }
}
