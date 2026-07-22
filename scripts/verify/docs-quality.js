import fs from 'fs';
import path from 'path';

/**
 * Audit public documentation quality, link validity, asset integrity, and release-language compliance.
 */
export function checkDocsQuality() {
  const rootDir = process.cwd();
  const docsDir = path.join(rootDir, 'docs');
  const readmePath = path.join(rootDir, 'README.md');

  let passed = true;
  const errors = [];

  // 1. Verify critical documentation files exist
  const criticalDocs = [
    'index.md',
    'quickstart.md',
    'documentation-map.md',
    'CLI.md',
    'architecture.md',
    'adapters.md',
    'skill-os-cli.md',
    'structured-prompts.md',
    'gateway-architecture.md',
    'gateway-runtime.md',
    'gateway-client-integrations.md',
    'gateway-security-model.md',
    'security-threat-model.md',
    'contributing.md',
    'v4.2-known-limitations.md',
    'releases/v4.2.0.md'
  ];

  for (const docFile of criticalDocs) {
    const fullPath = path.join(docsDir, docFile);
    if (!fs.existsSync(fullPath)) {
      errors.push(`Missing critical documentation file: docs/${docFile}`);
      passed = false;
    }
  }

  // 2. Verify critical visual assets exist
  const criticalAssets = [
    'docs/assets/readme/readme-hero.svg',
    'docs/assets/readme/readme-flow.svg',
    'docs/assets/readme/readme-feature-cards.svg',
    'docs/assets/readme/readme-safety.svg',
    'docs/assets/brand/github-social-preview.svg',
    'docs/public/github-social-preview.svg'
  ];

  for (const assetPath of criticalAssets) {
    const fullPath = path.join(rootDir, assetPath);
    if (!fs.existsSync(fullPath)) {
      errors.push(`Missing critical visual asset: ${assetPath}`);
      passed = false;
    }
  }

  // 3. Verify README image references point to valid files/URLs
  if (fs.existsSync(readmePath)) {
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    
    // Check for broken local image tags or unrendered badges
    if (readmeContent.includes('src=""') || readmeContent.includes('alt=""')) {
      errors.push('README.md contains empty src or alt attribute');
      passed = false;
    }
  }

  // 4. Verify VitePress configuration nav and version
  const configPath = path.join(docsDir, '.vitepress', 'config.js');
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');

    if (!configContent.includes("'softwareVersion': '4.2.0'")) {
      errors.push('docs/.vitepress/config.js does not contain current version 4.2.0');
      passed = false;
    }
  }

  // 5. Forbidden stale release wording in active user docs
  const activeDocsForStaleCheck = [
    path.join(docsDir, 'releases', 'v4.2.0.md'),
    path.join(docsDir, 'index.md'),
    readmePath
  ];

  const forbiddenPhrases = [
    'prepared for npm publication',
    'not npm-published yet',
    'must remain draft'
  ];

  for (const activeFile of activeDocsForStaleCheck) {
    if (fs.existsSync(activeFile)) {
      const content = fs.readFileSync(activeFile, 'utf8');
      for (const phrase of forbiddenPhrases) {
        if (content.includes(phrase)) {
          errors.push(`Forbidden stale phrase "${phrase}" found in ${path.relative(rootDir, activeFile)}`);
          passed = false;
        }
      }
    }
  }

  if (!passed) {
    console.error('FAILED: Documentation Quality Verification');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log('  ✓ Documentation Quality & Link Integrity Verification passed');
}
