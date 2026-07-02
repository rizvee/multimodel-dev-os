import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { shouldIgnorePath } from './security.js';

/**
 * Scan target workspace directory.
 * @param {string} targetDir
 */
export function scanTarget(targetDir) {
  const files = [];
  let ignoredCount = 0;
  
  function walk(dir) {
    if (!existsSync(dir)) return;
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const relPath = relative(targetDir, fullPath).replace(/\\/g, '/');
      
      if (shouldIgnorePath(relPath)) {
        ignoredCount++;
        continue;
      }
      
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (stat.isFile()) {
          files.push({
            relPath,
            fullPath,
            size: stat.size,
            mtime: stat.mtime.toISOString()
          });
        }
      } catch (e) {
        // Skip inaccessible files or broken links
      }
    }
  }
  
  walk(targetDir);
  return { files, ignoredCount };
}

/**
 * Detect framework signals.
 * @param {Array} files
 * @param {string} targetDir
 */
export function detectFrameworkSignals(files, targetDir) {
  const signals = [];
  const hasFile = (name) => files.some(f => f.relPath.toLowerCase() === name.toLowerCase());
  
  if (hasFile('next.config.js') || hasFile('next.config.mjs')) signals.push('Next.js');
  if (hasFile('nuxt.config.js') || hasFile('nuxt.config.ts')) signals.push('Nuxt.js');
  if (hasFile('wp-config.php') || hasFile('index.php')) signals.push('WordPress/PHP');
  if (hasFile('tsconfig.json')) signals.push('TypeScript');
  if (hasFile('package.json')) {
    signals.push('Node.js');
    try {
      const pkg = JSON.parse(readFileSync(join(targetDir, 'package.json'), 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['react']) signals.push('React');
      if (deps['vue']) signals.push('Vue');
      if (deps['svelte']) signals.push('Svelte');
      if (deps['expo']) signals.push('Expo');
      if (deps['react-native']) signals.push('React Native');
      if (deps['vite']) signals.push('Vite');
      if (deps['express']) signals.push('Express');
      if (deps['angular']) signals.push('Angular');
    } catch (e) {}
  }
  if (hasFile('requirements.txt') || hasFile('pyproject.toml')) signals.push('Python');
  if (hasFile('cargo.toml')) signals.push('Rust');
  if (hasFile('gemfile')) signals.push('Ruby');
  if (hasFile('go.mod')) signals.push('Go');
  
  if (signals.length === 0) signals.push('Generic/Unknown');
  return [...new Set(signals)];
}

/**
 * Detect dependency signals.
 * @param {Array} files
 * @param {string} targetDir
 */
export function detectDependencySignals(files, targetDir) {
  const signals = [];
  const hasFile = (name) => files.some(f => f.relPath.toLowerCase() === name.toLowerCase());
  
  if (hasFile('package-lock.json')) signals.push('npm');
  else if (hasFile('yarn.lock')) signals.push('Yarn');
  else if (hasFile('pnpm-lock.yaml')) signals.push('pnpm');
  else if (hasFile('bun.lockb')) signals.push('Bun');
  
  if (hasFile('requirements.txt')) signals.push('pip');
  if (hasFile('poetry.lock')) signals.push('Poetry');
  if (hasFile('cargo.lock')) signals.push('Cargo');
  
  return signals;
}

/**
 * Detect AI Dev OS signals.
 * @param {Array} files
 */
export function detectAiDevOsSignals(files) {
  const signals = [];
  const hasFile = (name) => files.some(f => f.relPath.toLowerCase() === name.toLowerCase());
  
  if (hasFile('agents.md')) signals.push('AGENTS.md');
  if (hasFile('memory.md')) signals.push('MEMORY.md');
  if (hasFile('tasks.md')) signals.push('TASKS.md');
  if (hasFile('runbook.md')) signals.push('RUNBOOK.md');
  if (hasFile('.ai/config.yaml')) signals.push('.ai/config.yaml');
  
  const hasPrefix = (prefix) => files.some(f => f.relPath.startsWith(prefix));
  if (hasPrefix('.ai/templates/')) signals.push('Templates Registry');
  if (hasPrefix('.ai/adapters/')) signals.push('Adapters Registry');
  if (hasPrefix('.ai/skills/')) signals.push('Skills Registry');
  if (hasPrefix('.ai/intelligence/')) signals.push('Intelligence Layer');
  if (hasPrefix('.ai/policies/')) signals.push('Policy Layer');
  if (hasPrefix('.ai/registries/')) signals.push('Registry Layer');
  
  return signals;
}

/**
 * Detect codebase risks.
 * @param {Array} files
 * @param {string} targetDir
 */
export function detectRisks(files, targetDir) {
  const risks = [];
  const gitignorePath = join(targetDir, '.gitignore');
  const gitignoreContent = existsSync(gitignorePath) ? readFileSync(gitignorePath, 'utf8') : '';
  
  const hasFolder = (name) => files.some(f => f.relPath.split('/')[0] === name);
  
  if (hasFolder('node_modules') && !gitignoreContent.includes('node_modules')) {
    risks.push({
      file_pattern: 'node_modules/',
      risk_description: 'Large token-sink directory node_modules/ is present but not ignored in .gitignore.',
      severity: 'high'
    });
  }
  
  files.forEach(f => {
    if (f.relPath.endsWith('.json') && f.relPath.toLowerCase().includes('config') && f.size > 50000) {
      risks.push({
        file_pattern: f.relPath,
        risk_description: `Large config file (${(f.size / 1024).toFixed(1)} KB) might contain sensitive parameters or inflate prompt context.`,
        severity: 'medium'
      });
    }
  });
  
  return risks;
}

/**
 * Perform codebase analysis.
 * @param {string} target
 */
export function getAnalysis(target) {
  const { files, ignoredCount } = scanTarget(target);
  const frameworks = detectFrameworkSignals(files, target);
  const packageManagers = detectDependencySignals(files, target);
  const aiSignals = detectAiDevOsSignals(files);

  let jsCount = 0, tsCount = 0, phpCount = 0, pyCount = 0, mdCount = 0;
  files.forEach(f => {
    const ext = f.relPath.substring(f.relPath.lastIndexOf('.')).toLowerCase();
    if (ext === '.js' || ext === '.mjs' || ext === '.cjs') jsCount++;
    else if (ext === '.ts' || ext === '.tsx') tsCount++;
    else if (ext === '.php') phpCount++;
    else if (ext === '.py') pyCount++;
    else if (ext === '.md') mdCount++;
  });

  let language = 'mixed';
  if (tsCount > jsCount && tsCount > phpCount && tsCount > pyCount && tsCount > mdCount) language = 'TS';
  else if (jsCount > tsCount && jsCount > phpCount && jsCount > pyCount && jsCount > mdCount) language = 'JS';
  else if (phpCount > jsCount && phpCount > tsCount && phpCount > pyCount && phpCount > mdCount) language = 'PHP';
  else if (pyCount > jsCount && pyCount > tsCount && phpCount > pyCount && phpCount > mdCount) language = 'Python';
  else if (mdCount > jsCount && mdCount > tsCount && mdCount > phpCount && mdCount > pyCount) language = 'Markdown-heavy';

  let repoType = 'app';
  if (files.some(f => f.relPath.includes('wp-content/themes') || f.relPath.includes('wp-content/plugins'))) {
    repoType = 'WordPress theme/plugin';
  } else if (files.some(f => f.relPath.includes('app.json') || f.relPath.includes('eas.json'))) {
    repoType = 'mobile app';
  } else if (files.some(f => f.relPath.includes('lerna.json') || f.relPath.includes('pnpm-workspace.yaml'))) {
    repoType = 'monorepo';
  } else if (files.some(f => f.relPath.includes('docs/')) && mdCount > (files.length * 0.4)) {
    repoType = 'docs';
  } else if (files.some(f => f.relPath === 'package.json')) {
    try {
      const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
      if (pkg.main && (pkg.main.includes('dist/') || pkg.main.includes('lib/'))) {
        repoType = 'library';
      }
    } catch (e) {}
  }

  const existingTools = [];
  if (files.some(f => f.relPath === '.cursorrules')) existingTools.push('Cursor');
  if (files.some(f => f.relPath === 'CLAUDE.md')) existingTools.push('Claude');
  if (files.some(f => f.relPath === 'GEMINI.md')) existingTools.push('Gemini');
  if (files.some(f => f.relPath.startsWith('.vscode/'))) existingTools.push('VS Code');
  if (files.some(f => f.relPath.startsWith('.gemini/'))) existingTools.push('Antigravity');

  const packageScripts = [];
  if (files.some(f => f.relPath === 'package.json')) {
    try {
      const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
      if (pkg.scripts) {
        Object.keys(pkg.scripts).forEach(k => packageScripts.push(k));
      }
    } catch (e) {}
  }

  const githubWorkflows = [];
  const githubDir = join(target, '.github', 'workflows');
  if (existsSync(githubDir)) {
    try {
      readdirSync(githubDir).forEach(f => {
        if (f.endsWith('.yml') || f.endsWith('.yaml')) githubWorkflows.push(f);
      });
    } catch (e) {}
  }

  const envRiskMarkers = [];
  files.forEach(f => {
    const name = f.relPath.toLowerCase();
    if (name.includes('.env') || name.includes('id_rsa') || name.includes('credential') || name.endsWith('.pem') || name.endsWith('.key') || name.endsWith('.keystore') || name.endsWith('.jks')) {
      envRiskMarkers.push(f.relPath);
    }
  });

  return {
    packageManagers,
    frameworks,
    language,
    repoType,
    existingTools,
    packageScripts,
    githubWorkflows,
    envRiskMarkers,
    aiSignals,
    filesCount: files.length,
    ignoredCount
  };
}
