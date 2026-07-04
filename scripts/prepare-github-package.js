import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, join, normalize, relative, resolve, sep } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const stagingRoot = join(projectRoot, '.release', 'github-package');
const scopedName = '@rizvee/multimodel-dev-os';
const npmCommand = 'npm';

function fail(message) {
  console.error(`[github-package] ${message}`);
  process.exit(1);
}

function assertSafePackPath(packPath) {
  const normalized = normalize(packPath);
  if (normalized.startsWith('..') || normalized.includes(`..${sep}`) || resolve(projectRoot, normalized) === projectRoot) {
    fail(`Unsafe pack path reported by npm: ${packPath}`);
  }
  return normalized;
}

function runNpmPackDryRun() {
  const result = spawnSync(npmCommand, ['pack', '--dry-run', '--json'], {
    cwd: projectRoot,
    env: { ...process.env, MMDO_ALLOW_PUBLISH: 'true' },
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    fail(`npm pack --dry-run failed:\n${result.error?.message || result.stderr || result.stdout}`);
  }

  try {
    const parsed = JSON.parse(result.stdout || '[]');
    const packData = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!packData || !Array.isArray(packData.files)) {
      fail('npm pack --dry-run did not return a files list.');
    }
    return packData.files.map((file) => assertSafePackPath(file.path || file));
  } catch (error) {
    fail(`Failed to parse npm pack --dry-run JSON: ${error.message}`);
  }
}

function copyPackFiles(files) {
  rmSync(stagingRoot, { recursive: true, force: true });
  mkdirSync(stagingRoot, { recursive: true });

  for (const packPath of files.sort()) {
    const source = join(projectRoot, packPath);
    const destination = join(stagingRoot, packPath);
    const relativeDestination = relative(stagingRoot, destination);
    if (relativeDestination.startsWith('..') || relativeDestination === '') {
      fail(`Unsafe staging path: ${packPath}`);
    }

    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
  }
}

function rewritePackageManifest() {
  const manifestPath = join(stagingRoot, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  manifest.name = scopedName;
  manifest.publishConfig = {
    ...(manifest.publishConfig || {}),
    registry: 'https://npm.pkg.github.com',
  };

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest.version;
}

const files = runNpmPackDryRun();
copyPackFiles(files);
const version = rewritePackageManifest();

console.log(`Prepared GitHub Packages staging directory: .release/github-package`);
console.log(`Package: ${scopedName}@${version}`);
