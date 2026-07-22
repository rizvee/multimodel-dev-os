import { existsSync, readFileSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const projectRoot = resolve(__dirname, '..', '..');

export const EXPECTED_LANE_VERSION = '4.3.0-dev.0';

export function validateLaneVersion(version, expectedLane = EXPECTED_LANE_VERSION) {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  if (!version || typeof version !== 'string' || !semverRegex.test(version)) {
    return { valid: false, reason: `Version format is invalid semver: "${version}"` };
  }
  if (version !== expectedLane) {
    return { valid: false, reason: `Version "${version}" does not match expected development lane "${expectedLane}"` };
  }
  return { valid: true };
}

export const stats = {
  pass: 0,
  fail: 0,
  warn: 0
};

export const RED = '\x1b[31m';
export const GREEN = '\x1b[32m';
export const YELLOW = '\x1b[33m';
export const NC = '\x1b[0m';

const originalConsoleError = console.error;
console.error = function(...args) {
  originalConsoleError.apply(console, args);
  if (process.env.GITHUB_ACTIONS === 'true') {
    const cleanMsg = args.join(' ').replace(/\x1b\[[0-9;]*m/g, '');
    console.log(`::error::${cleanMsg}`);
  }
};

const originalConsoleWarn = console.warn;
console.warn = function(...args) {
  originalConsoleWarn.apply(console, args);
  if (process.env.GITHUB_ACTIONS === 'true') {
    const cleanMsg = args.join(' ').replace(/\x1b\[[0-9;]*m/g, '');
    console.log(`::warning::${cleanMsg}`);
  }
};

export function checkFile(relPath, required = true) {
  const fullPath = join(projectRoot, relPath);
  if (existsSync(fullPath) && statSync(fullPath).isFile()) {
    console.log(`  ${GREEN}✓${NC} ${relPath}`);
    stats.pass++;
    return true;
  } else if (required) {
    console.error(`  ${RED}✗${NC} ${relPath} (missing)`);
    stats.fail++;
    return false;
  } else {
    console.log(`  ${YELLOW}?${NC} ${relPath} (optional, not found)`);
    stats.warn++;
    return false;
  }
}

export function checkDir(relPath) {
  const fullPath = join(projectRoot, relPath);
  if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
    console.log(`  ${GREEN}✓${NC} ${relPath}/`);
    stats.pass++;
    return true;
  } else {
    console.error(`  ${RED}✗${NC} ${relPath}/ (missing)`);
    stats.fail++;
    return false;
  }
}

export function parseFlowArray(str) {
  const contents = str.slice(1, -1).trim();
  if (!contents) return [];

  const result = [];
  const regex = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^,\s][^,]*[^,\s]|[^,\s])/g;
  let match;
  while ((match = regex.exec(contents)) !== null) {
    if (match[1] !== undefined) {
      result.push(match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
    } else if (match[2] !== undefined) {
      result.push(match[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
    } else if (match[3] !== undefined) {
      let val = match[3].trim();
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === 'null') val = null;
      else if (/^-?\d+$/.test(val)) val = parseInt(val, 10);
      result.push(val);
    }
  }
  return result;
}

export function parseYaml(content) {
  try {
    const root = {};
    const stack = [{ obj: root, indent: -1, key: null, isArray: false }];
    const lines = content.split(/\r?\n/);
    for (let line of lines) {
      // Find comment index outside quotes
      let commentIdx = -1;
      let insideDouble = false;
      let insideSingle = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
          insideDouble = !insideDouble;
        } else if (char === "'" && (i === 0 || line[i-1] !== '\\')) {
          insideSingle = !insideSingle;
        } else if (char === '#' && !insideDouble && !insideSingle) {
          commentIdx = i;
          break;
        }
      }
      if (commentIdx !== -1) {
        line = line.substring(0, commentIdx);
      }
      line = line.trimEnd();
      if (!line.trim()) continue;
      const indent = line.match(/^ */)[0].length;
      let trimmed = line.trim();
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }
      const parent = stack[stack.length - 1];
      if (trimmed.startsWith('-')) {
        trimmed = trimmed.substring(1).trim();
        if (!Array.isArray(parent.obj)) {
          const grandparent = stack[stack.length - 2];
          if (grandparent) {
            grandparent.obj[parent.key] = [];
            parent.obj = grandparent.obj[parent.key];
          }
        }
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) {
          let val = trimmed;
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (val.startsWith('[') && val.endsWith(']')) {
            val = parseFlowArray(val);
          }
          parent.obj.push(val);
        } else {
          const key = trimmed.substring(0, colonIdx).trim();
          let val = trimmed.substring(colonIdx + 1).trim();
          let isQuoted = false;
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
            isQuoted = true;
          }
          if (val.startsWith('[') && val.endsWith(']')) {
            val = parseFlowArray(val);
          } else if (!isQuoted) {
            if (val === 'true') val = true;
            else if (val === 'false') val = false;
            else if (val === 'null') val = null;
            else if (/^-?\d+$/.test(val)) val = parseInt(val, 10);
          }
          const newObj = { [key]: val };
          parent.obj.push(newObj);
          stack.push({ obj: newObj, indent: indent, key: key, isArray: false });
        }
      } else {
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) continue;
        const key = trimmed.substring(0, colonIdx).trim();
        let val = trimmed.substring(colonIdx + 1).trim();
        let isQuoted = false;
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
          isQuoted = true;
        }
        if (val.startsWith('[') && val.endsWith(']')) {
          val = parseFlowArray(val);
        } else if (!isQuoted) {
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (val === 'null') val = null;
          else if (/^\d+$/.test(val)) val = parseInt(val, 10);
        }
        if (val === '') {
          parent.obj[key] = {};
          stack.push({ obj: parent.obj[key], indent: indent, key: key, isArray: false });
        } else {
          parent.obj[key] = val;
        }
      }
    }
    return root;
  } catch (e) {
    return null;
  }
}

export function computeSHA256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function verifyRegistryParsed(relPath, requiredRootKey) {
  const fullPath = join(projectRoot, relPath);
  if (!existsSync(fullPath)) {
    console.error(`  ${RED}✗${NC} ${relPath} (missing for parsing)`);
    stats.fail++;
    return;
  }
  try {
    const data = parseYaml(readFileSync(fullPath, 'utf8'));
    if (!data || typeof data !== 'object') {
      console.error(`  ${RED}✗${NC} ${relPath} (YAML parsing returned invalid object)`);
      stats.fail++;
    } else if (requiredRootKey && !data[requiredRootKey]) {
      console.error(`  ${RED}✗${NC} ${relPath} (missing root key: "${requiredRootKey}")`);
      stats.fail++;
    } else {
      console.log(`  ${GREEN}✓${NC} ${relPath} (parsed successfully, verified root key "${requiredRootKey}")`);
      stats.pass++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} ${relPath} (failed parsing: ${e.message})`);
    stats.fail++;
  }
}
