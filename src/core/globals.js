import { existsSync, readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseYaml } from './yaml.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// When bundled, __dirname will resolve to F:\multimodel-dev-os\bin or equivalent
// So resolving '..' will give the project root directory
export const sourceRoot = resolve(__dirname, '..');

let pkgVersion = '3.5.0';
try {
  const pkgData = JSON.parse(readFileSync(resolve(sourceRoot, 'package.json'), 'utf8'));
  pkgVersion = pkgData.version;
} catch (e) {}

export const version = pkgVersion;

export function loadTemplates(customPath) {
  let path = customPath || join(sourceRoot, '.ai', 'templates', 'registry.yaml');
  try {
    if (existsSync(path)) {
      const templatesRegistry = parseYaml(readFileSync(path, 'utf8'));
      return templatesRegistry.templates || {};
    }
  } catch (e) {}
  return {
    'general-app': {
      name: 'general-app',
      description: 'Baseline generic fallback profile for standard backend systems.',
      stack: 'Universal backends baseline structure',
      skill: 'example-skill.md',
      skillDesc: 'Generic baseline instructions and coding standards.',
      status: 'stable',
      maturity: 'production-ready',
      required_files: ['AGENTS.md', 'MEMORY.md', 'TASKS.md', 'RUNBOOK.md', '.ai/config.yaml']
    }
  };
}

export function loadAdapters(customPath) {
  let path = customPath || join(sourceRoot, '.ai', 'adapters', 'registry.yaml');
  try {
    if (existsSync(path)) {
      const adaptersRegistry = parseYaml(readFileSync(path, 'utf8'));
      return adaptersRegistry.adapters || {};
    }
  } catch (e) {}
  return {};
}
