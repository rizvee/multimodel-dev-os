export function shouldIgnorePath(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  const segments = normalized.split('/');
  
  // Ignored folders
  const ignoredFolders = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
  for (const seg of segments) {
    if (ignoredFolders.includes(seg)) return true;
  }
  
  // Special check for docs/.vitepress/dist and docs/.vitepress/cache
  if (normalized.includes('docs/.vitepress/dist') || normalized.includes('docs/.vitepress/cache')) {
    return true;
  }
  
  // Ignore generated memory and intelligence runtime files
  if (
    normalized.endsWith('memory.hash.json') ||
    normalized.endsWith('memory.summary.md') ||
    normalized.endsWith('feedback-log.jsonl') ||
    normalized.endsWith('learning-rules.md') ||
    normalized.endsWith('apply-log.jsonl') ||
    normalized.includes('.ai/proposals/')
  ) {
    return true;
  }
  
  // Skip secret-like files/patterns
  const lower = normalized.toLowerCase();
  const filePart = segments[segments.length - 1];
  if (
    lower.endsWith('.env') ||
    lower.includes('.env.') ||
    lower.endsWith('.npmrc') ||
    lower.endsWith('.keystore') ||
    lower.endsWith('.jks') ||
    lower.endsWith('.key') ||
    lower.endsWith('.pem') ||
    lower.endsWith('credentials.json') ||
    filePart === 'id_rsa' ||
    filePart === 'id_dsa' ||
    filePart === 'id_ecdsa' ||
    filePart === 'id_ed25519'
  ) {
    return true;
  }
  
  return false;
}

export function isSafePath(filePath, policy = {}) {
  const normPath = filePath.replace(/\\/g, '/').trim();
  const allowed_write_roots = policy.allowed_write_roots || ['.ai/', 'adapters/'];
  const blocked_paths = policy.blocked_paths || ['.env', '.npmrc', '.git/', 'node_modules/', 'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];

  const isSafeSubdir = allowed_write_roots.some(prefix => normPath.startsWith(prefix));
  const hasTraversal = normPath.includes('..') || normPath.startsWith('/') || /^[a-zA-Z]:/.test(normPath);
  const isBlacklisted = blocked_paths.some(black => normPath.includes(black) || normPath.split('/').includes(black.replace(/\/$/, '')));

  return isSafeSubdir && !hasTraversal && !isBlacklisted;
}
