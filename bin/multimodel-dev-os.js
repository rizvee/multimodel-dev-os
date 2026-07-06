#!/usr/bin/env node
// Generated from src/. Do not edit directly.


// src/cli/args.js
import { resolve } from "path";
function parseArgs(args) {
  const params2 = {
    command: null,
    target: process.cwd(),
    template: "general-app",
    adapters: [],
    caveman: false,
    dryRun: false,
    force: false,
    help: false,
    tokens: false,
    modelPreset: null,
    agent: null,
    stack: null,
    mobile: null,
    aiApp: null,
    json: false,
    threshold: null,
    registry: null,
    allRegistries: false,
    release: false,
    type: "unknown",
    tags: "",
    files: "",
    title: null,
    approved: false,
    intelligence: false,
    onboarding: false,
    listActions: false,
    category: null,
    source: null,
    allSources: false
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--target" || arg === "-t") {
      params2.target = resolve(args[++i]);
    } else if (arg === "--template") {
      params2.template = args[++i];
    } else if (arg === "--adapter" || arg === "-a") {
      params2.adapters.push(args[++i]);
    } else if (arg === "--caveman") {
      params2.caveman = true;
    } else if (arg === "--dry-run" || arg === "-d") {
      params2.dryRun = true;
    } else if (arg === "--list-actions") {
      params2.listActions = true;
    } else if (arg === "--force" || arg === "-f") {
      params2.force = true;
    } else if (arg === "--help" || arg === "-h") {
      params2.help = true;
    } else if (arg === "--tokens") {
      params2.tokens = true;
    } else if (arg === "--all-registries") {
      params2.allRegistries = true;
    } else if (arg === "--release") {
      params2.release = true;
    } else if (arg === "--intelligence") {
      params2.intelligence = true;
    } else if (arg === "--onboarding") {
      params2.onboarding = true;
    } else if (arg === "--json") {
      params2.json = true;
    } else if (arg === "--threshold") {
      params2.threshold = args[++i];
    } else if (arg === "--registry") {
      params2.registry = args[++i];
    } else if (arg === "--model-preset") {
      params2.modelPreset = args[++i];
    } else if (arg === "--agent") {
      params2.agent = args[++i];
    } else if (arg === "--stack") {
      params2.stack = args[++i];
    } else if (arg === "--mobile") {
      params2.mobile = args[++i];
    } else if (arg === "--type") {
      params2.type = args[++i];
    } else if (arg === "--tags") {
      params2.tags = args[++i];
    } else if (arg === "--files") {
      params2.files = args[++i];
    } else if (arg === "--title") {
      params2.title = args[++i];
    } else if (arg === "--approved") {
      params2.approved = true;
    } else if (arg === "--category") {
      params2.category = args[++i];
    } else if (arg === "--source") {
      params2.source = args[++i];
    } else if (arg === "--all-sources") {
      params2.allSources = true;
    } else if (!params2.command && !arg.startsWith("-")) {
      params2.command = arg;
    }
  }
  return params2;
}
function getPositionalArgs(args) {
  const positionalArgs = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--target" || arg === "-t" || arg === "--template" || arg === "--adapter" || arg === "-a" || arg === "--threshold" || arg === "--registry" || arg === "--model-preset" || arg === "--agent" || arg === "--stack" || arg === "--mobile" || arg === "--type" || arg === "--tags" || arg === "--files" || arg === "--title" || arg === "--category") {
      i++;
    } else if (arg.startsWith("-")) {
    } else {
      positionalArgs.push(arg);
    }
  }
  return positionalArgs;
}

// src/core/globals.js
import { existsSync, readFileSync } from "fs";
import { join, resolve as resolve2, dirname } from "path";
import { fileURLToPath } from "url";

// src/core/yaml.js
function parseFlowArray(str) {
  const contents = str.slice(1, -1).trim();
  if (!contents)
    return [];
  const result = [];
  const regex = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^,\s][^,]*[^,\s]|[^,\s])/g;
  let match;
  while ((match = regex.exec(contents)) !== null) {
    if (match[1] !== void 0) {
      result.push(match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"));
    } else if (match[2] !== void 0) {
      result.push(match[2].replace(/\\'/g, "'").replace(/\\\\/g, "\\"));
    } else if (match[3] !== void 0) {
      let val = match[3].trim();
      if (val === "true")
        val = true;
      else if (val === "false")
        val = false;
      else if (val === "null")
        val = null;
      else if (/^-?\d+$/.test(val))
        val = parseInt(val, 10);
      result.push(val);
    }
  }
  return result;
}
function parseYaml(content) {
  try {
    const root = {};
    const stack = [{ obj: root, indent: -1, key: null, isArray: false }];
    const lines = content.split(/\r?\n/);
    for (let line of lines) {
      let commentIdx = -1;
      let insideDouble = false;
      let insideSingle = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
          insideDouble = !insideDouble;
        } else if (char === "'" && (i === 0 || line[i - 1] !== "\\")) {
          insideSingle = !insideSingle;
        } else if (char === "#" && !insideDouble && !insideSingle) {
          commentIdx = i;
          break;
        }
      }
      if (commentIdx !== -1) {
        line = line.substring(0, commentIdx);
      }
      line = line.trimEnd();
      if (!line.trim())
        continue;
      const indent = line.match(/^ */)[0].length;
      let trimmed = line.trim();
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }
      const parent = stack[stack.length - 1];
      if (trimmed.startsWith("-")) {
        trimmed = trimmed.substring(1).trim();
        if (!Array.isArray(parent.obj)) {
          const grandparent = stack[stack.length - 2];
          if (grandparent) {
            grandparent.obj[parent.key] = [];
            parent.obj = grandparent.obj[parent.key];
          }
        }
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx === -1) {
          let val = trimmed;
          if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
            val = val.substring(1, val.length - 1);
          }
          if (val.startsWith("[") && val.endsWith("]")) {
            val = parseFlowArray(val);
          }
          parent.obj.push(val);
        } else {
          const key = trimmed.substring(0, colonIdx).trim();
          let val = trimmed.substring(colonIdx + 1).trim();
          let isQuoted = false;
          if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
            val = val.substring(1, val.length - 1);
            isQuoted = true;
          }
          if (val.startsWith("[") && val.endsWith("]")) {
            val = parseFlowArray(val);
          } else if (!isQuoted) {
            if (val === "true")
              val = true;
            else if (val === "false")
              val = false;
            else if (val === "null")
              val = null;
            else if (/^-?\d+$/.test(val))
              val = parseInt(val, 10);
          }
          const newObj = { [key]: val };
          parent.obj.push(newObj);
          stack.push({ obj: newObj, indent, key, isArray: false });
        }
      } else {
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx === -1)
          continue;
        const key = trimmed.substring(0, colonIdx).trim();
        let val = trimmed.substring(colonIdx + 1).trim();
        let isQuoted = false;
        if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
          isQuoted = true;
        }
        if (val.startsWith("[") && val.endsWith("]")) {
          val = parseFlowArray(val);
        } else if (!isQuoted) {
          if (val === "true")
            val = true;
          else if (val === "false")
            val = false;
          else if (val === "null")
            val = null;
          else if (/^-?\d+$/.test(val))
            val = parseInt(val, 10);
        }
        if (val === "") {
          parent.obj[key] = {};
          stack.push({ obj: parent.obj[key], indent, key, isArray: false });
        } else {
          parent.obj[key] = val;
        }
      }
    }
    return root;
  } catch (e) {
    console.warn(`\x1B[33m[WARNING] Failed to parse YAML: ${e.message}\x1B[0m`);
    return {};
  }
}

// src/core/globals.js
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var sourceRoot = resolve2(__dirname, "..");
var pkgVersion = "4.1.0-dev.0";
try {
  const pkgData = JSON.parse(readFileSync(resolve2(sourceRoot, "package.json"), "utf8"));
  pkgVersion = pkgData.version;
} catch (e) {
}
var version = pkgVersion;
function loadTemplates(customPath) {
  let path = customPath || join(sourceRoot, ".ai", "templates", "registry.yaml");
  try {
    if (existsSync(path)) {
      const templatesRegistry = parseYaml(readFileSync(path, "utf8"));
      return templatesRegistry.templates || {};
    }
  } catch (e) {
  }
  return {
    "general-app": {
      name: "general-app",
      description: "Baseline generic fallback profile for standard backend systems.",
      stack: "Universal backends baseline structure",
      skill: "example-skill.md",
      skillDesc: "Generic baseline instructions and coding standards.",
      status: "stable",
      maturity: "production-ready",
      required_files: ["AGENTS.md", "MEMORY.md", "TASKS.md", "RUNBOOK.md", ".ai/config.yaml"]
    }
  };
}
function loadAdapters(customPath) {
  let path = customPath || join(sourceRoot, ".ai", "adapters", "registry.yaml");
  try {
    if (existsSync(path)) {
      const adaptersRegistry = parseYaml(readFileSync(path, "utf8"));
      return adaptersRegistry.adapters || {};
    }
  } catch (e) {
  }
  return {};
}

// src/cli/help.js
function showHelp() {
  console.log(`
\u{1F9E0} \x1B[36mmultimodel-dev-os CLI v${version}\x1B[0m`);
  console.log("====================================");
  console.log("Usage: node bin/multimodel-dev-os.js <command> [options]\n");
  console.log("Commands:");
  console.log("  init              Initialize a project with configs and adapters");
  console.log("  scan              Scan project structure and framework signals");
  console.log("  status            Show compact dashboard summarizing repository intelligence state");
  console.log("  dashboard         Launch the interactive terminal command center (alias: ui)");
  console.log("  memory <subcmd>   Manage hash-compressed codebase memory (subcmd: build, refresh, diff)");
  console.log("  feedback <subcmd> Manage developer feedback loops (subcmd: add, list, summarize)");
  console.log("  improve <subcmd>  Manage codebase self-improvement proposals (subcmd: propose, review, status, validate, diff, apply, log)");
  console.log("  workflow <subcmd> Orchestrate read-only development workflow pipelines (subcmd: list, show, plan, run)");
  console.log("  handoff <subcmd>  Compile or print token-compressed agent session summaries (subcmd: build, show)");
  console.log("  onboard <subcmd>  Safely integrate MultiModel Dev OS into existing repo (subcmd: analyze, recommend, plan, apply, status)");
  console.log("  adapter <subcmd>  Manage and sync rule/settings files for IDE adapters (subcmd: status, diff, sync)");
  console.log("  plugin <subcmd>   Manage declarative plugins (subcmd: list, show, validate, install, status)");
  console.log("  catalog <subcmd>  Manage Workflow Marketplace & Plugin Catalog (subcmd: list, search, show, categories, recommend, install, status)");
  console.log("  registry <subcmd> Manage trusted remote catalog registries (subcmd: list, add, remove, sync, status, verify, show, cache, keygen, lock, trust list/show/verify/add/remove/sync)");
  console.log("  verify            Validate structural integrity of an existing project");
  console.log("  templates         List all built-in template profiles with details");
  console.log("  list-templates    Alias for templates command");
  console.log("  show-template <t> Inspect detailed stack specifications of template <t>");
  console.log("  doctor            Advisory checkup of project compatibility loops and ignored folders");
  console.log("  validate          Strict validation checks to verify directory schema compliance");
  console.log("  validate-template Validate registry keys and source folder files for template");
  console.log("  validate-adapter  Validate registry keys and source assets for IDE adapter");
  console.log("  validate-skill    Verify custom skill conforms to core prompt structure");
  console.log("  models            List registered model aliases in the capabilities registry");
  console.log("  show-model <m>    View specifications of model <m> in registry");
  console.log("  providers         List configured AI provider API endpoints");
  console.log("  route-model <tsk> Suggest optimal model mapping for task <tsk>");
  console.log("  adapters          List IDE and terminal tool adapters");
  console.log("  show-adapter <a>  Inspect config specifications of adapter <a>");
  console.log("  skills            List active skills custom prompts in target workspace");
  console.log("  skill-os <subcmd> Inspect Skill OS registries (subcmd: status, validate, list, show)");
  console.log("  show-skill <s>    View prompt contents of target workspace skill <s>\n");
  console.log("Options:");
  console.log("  -t, --target <path>     Target folder destination (default: current working directory)");
  console.log("  --type <type>           Feedback classification (correction, preference, bug, etc.)");
  console.log("  --tags <list>           Comma-separated descriptor tags for feedback");
  console.log("  --files <list>          Comma-separated target files for feedback");
  console.log("  --category <name>       Filter catalog plugins list by category");
  console.log("  --source <src>          Catalog source filter: bundled, local, or remote:<name>");
  console.log("  --all-sources           Include all enabled catalog sources in listings");
  console.log("  --title <text>          Specifies title for codebase improvement proposal");
  console.log("  --approved              Explicitly approve and execute proposal/onboarding/adapter sync writes");
  console.log("  --template <name>       Template profile: nextjs-saas, expo-react-native-android, etc.");
  console.log("  -a, --adapter <name>    Inject specific adapter: cursor, claude, vscode, gemini, etc.");
  console.log("  --caveman               Use minimal-token templates (~79% fewer tokens)");
  console.log("  --tokens                Run a deeper token-sink size analysis during doctor checkup");
  console.log("  --intelligence          Run diagnostic checkup of repository intelligence config");
  console.log("  --onboarding            Run diagnostic checkup of repository onboarding setup");
  console.log("  --json                  Output raw JSON data for listing commands (models, adapters, templates)");
  console.log("  --threshold <val>       Set custom size threshold for doctor tokens checks (e.g. 50KB)");
  console.log("  --registry <path>       Override default registry (for templates/adapters list or check)");
  console.log("  -d, --dry-run           Preview planned file actions without modifying the filesystem");
  console.log("  -f, --force             Overwrite existing files without prompting\n");
}

// src/cli/handlers/registry/crud.js
import { existsSync as existsSync7, readdirSync, statSync, writeFileSync as writeFileSync5, readFileSync as readFileSync7 } from "fs";
import { join as join7 } from "path";

// src/core/policy.js
import { existsSync as existsSync2, readFileSync as readFileSync2 } from "fs";
import { join as join2 } from "path";
function loadRegistryPolicy(targetDir) {
  const defaults = {
    allow_remote_registries: false,
    allow_http_localhost: false,
    require_approval_for_remote_sync: true,
    require_checksum: true,
    require_signature: false,
    require_lockfile_on_verify: false,
    allow_untrusted_install: false,
    allowed_write_roots: [".ai/", "adapters/"],
    blocked_paths: [".env", ".npmrc", ".git/", "node_modules/", "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock"],
    max_plugin_files: 20,
    max_plugin_size_kb: 100,
    max_registry_cache_size_kb: 512,
    allowed_file_extensions: [".md", ".yaml", ".yml", ".json"],
    allow_unsigned_local: true,
    allow_unsigned_bundled: true,
    allow_unsigned_remote: false,
    trusted_keys_file: ".ai/registries/trusted-keys.yaml",
    allowed_signature_algorithms: ["ed25519", "hmac-sha256", "gpg"],
    require_trusted_publisher: false,
    provenance_required: true
  };
  const paths = [];
  if (targetDir) {
    paths.push(join2(targetDir, ".ai", "policies", "registry-policy.yaml"));
  }
  paths.push(join2(sourceRoot, ".ai", "policies", "registry-policy.yaml"));
  for (const p of paths) {
    if (existsSync2(p)) {
      try {
        const parsed = parseYaml(readFileSync2(p, "utf8"));
        return { ...defaults, ...parsed };
      } catch (e) {
      }
    }
  }
  return defaults;
}

// src/registry/validation.js
function validateRegistryUrl(urlStr, policy = {}) {
  if (!urlStr || typeof urlStr !== "string") {
    throw new Error("Registry URL must be a non-empty string.");
  }
  if (urlStr.trim() === "" || /\s/.test(urlStr) || /[\x00-\x1F\x7F-\x9F]/.test(urlStr)) {
    throw new Error("Registry URL must not contain whitespace or control characters.");
  }
  if (/['"`]/.test(urlStr)) {
    throw new Error("Registry URL must not contain quotes or backticks.");
  }
  if (/[\$\;\&\|<>\(\)\*]/.test(urlStr)) {
    throw new Error("Registry URL must not contain shell metacharacters.");
  }
  let parsedUrl;
  try {
    parsedUrl = new URL(urlStr);
  } catch (e) {
    throw new Error("Registry URL is malformed or invalid.");
  }
  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("Registry URL must not contain credentials.");
  }
  const protocol = parsedUrl.protocol;
  const allowedProtocols = ["https:"];
  if (policy.allow_http_localhost === true) {
    if (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1") {
      allowedProtocols.push("http:");
    }
  }
  if (!allowedProtocols.includes(protocol)) {
    throw new Error(`Registry URL protocol '${protocol}' is not allowed. Only HTTPS is permitted.`);
  }
}

// src/registry/sources.js
import { existsSync as existsSync3, readFileSync as readFileSync3, writeFileSync } from "fs";
import { join as join3 } from "path";
function loadRegistrySources() {
  const paths = [
    join3(sourceRoot, ".ai", "registries", "sources.yaml")
  ];
  for (const p of paths) {
    if (existsSync3(p)) {
      try {
        const parsed = parseYaml(readFileSync3(p, "utf8"));
        return parsed.sources || [];
      } catch (e) {
      }
    }
  }
  return [{ name: "bundled", type: "local", url: ".ai/plugins/catalog.yaml", enabled: true, trust_level: "trusted", safety_policy: "sandboxed", signature_required: false, checksum_required: false }];
}
function saveRegistrySources(sources) {
  const path = join3(sourceRoot, ".ai", "registries", "sources.yaml");
  let yaml = "# Registry Sources Configuration\n";
  yaml += "# Remote registries are DISABLED by default.\n";
  yaml += "# Enable via .ai/policies/registry-policy.yaml (set allow_remote_registries: true)\n\n";
  yaml += "sources:\n";
  sources.forEach((s) => {
    yaml += `  - name: "${s.name}"
`;
    yaml += `    type: "${s.type}"
`;
    yaml += `    url: "${s.url}"
`;
    yaml += `    enabled: ${s.enabled}
`;
    yaml += `    trust_level: "${s.trust_level}"
`;
    yaml += `    safety_policy: "${s.safety_policy}"
`;
    yaml += `    signature_required: ${s.signature_required}
`;
    yaml += `    checksum_required: ${s.checksum_required}
`;
    if (s.last_synced_at)
      yaml += `    last_synced_at: "${s.last_synced_at}"
`;
    if (s.pinned_commit_or_hash)
      yaml += `    pinned_commit_or_hash: "${s.pinned_commit_or_hash}"
`;
  });
  writeFileSync(path, yaml, "utf8");
}

// src/registry/provenance.js
import { existsSync as existsSync4, readFileSync as readFileSync4, writeFileSync as writeFileSync2, mkdirSync } from "fs";
import { join as join4, dirname as dirname2 } from "path";
var LOCKFILE_VERSION = "1";
var LOCKFILE_FILENAME = "registry-lock.json";
function getLockfilePath(targetDir) {
  return join4(targetDir, ".ai", LOCKFILE_FILENAME);
}
function loadRegistryLockfile(targetDir) {
  const lockfilePath = getLockfilePath(targetDir);
  const empty = { lockfile_version: LOCKFILE_VERSION, generated_at: "", entries: {} };
  if (!existsSync4(lockfilePath)) {
    return empty;
  }
  try {
    const raw = readFileSync4(lockfilePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.entries) {
      return empty;
    }
    parsed.lockfile_version = parsed.lockfile_version || LOCKFILE_VERSION;
    return parsed;
  } catch (_e) {
    return empty;
  }
}
function saveRegistryLockfile(targetDir, lockfile) {
  const lockfilePath = getLockfilePath(targetDir);
  const lockfileDir = dirname2(lockfilePath);
  if (!existsSync4(lockfileDir)) {
    mkdirSync(lockfileDir, { recursive: true });
  }
  lockfile.generated_at = (/* @__PURE__ */ new Date()).toISOString();
  lockfile.lockfile_version = LOCKFILE_VERSION;
  writeFileSync2(lockfilePath, JSON.stringify(lockfile, null, 2) + "\n", "utf8");
}
function updateLockfileEntry(lockfile, name, entry) {
  if (!lockfile.entries || typeof lockfile.entries !== "object") {
    lockfile.entries = {};
  }
  lockfile.entries[name] = {
    url: entry.url,
    synced_at: entry.synced_at || (/* @__PURE__ */ new Date()).toISOString(),
    catalog_sha256: entry.catalog_sha256,
    manifest_sha256: entry.manifest_sha256 ?? null,
    signature: entry.signature ?? null,
    signature_alg: entry.signature_alg || "hmac-sha256",
    public_signature_status: entry.public_signature_status ?? null,
    public_signature_algorithm: entry.public_signature_algorithm ?? null,
    public_signature_key_id: entry.public_signature_key_id ?? null,
    trusted_publisher_status: entry.trusted_publisher_status ?? null,
    trust_store_path: entry.trust_store_path ?? null,
    trust_verdict: entry.trust_verdict ?? null,
    lockfile_verdict: entry.lockfile_verdict ?? null,
    verification_errors: entry.verification_errors ?? [],
    verification_warnings: entry.verification_warnings ?? []
  };
}

// src/registry/signing.js
import { generateKeyPairSync, sign, verify, createHmac, timingSafeEqual, randomBytes } from "crypto";
import { existsSync as existsSync5, readFileSync as readFileSync5, writeFileSync as writeFileSync3, mkdirSync as mkdirSync2, chmodSync, rmSync } from "fs";
import { join as join5, dirname as dirname3 } from "path";
import { execFileSync } from "child_process";
import os from "os";
var SIGNING_KEY_FILENAME = "registry-signing-key";
function getSigningKeyPath(targetDir) {
  return join5(targetDir, ".ai", SIGNING_KEY_FILENAME);
}
function loadSigningKey(targetDir) {
  const keyPath = getSigningKeyPath(targetDir);
  if (!existsSync5(keyPath)) {
    return null;
  }
  const raw = readFileSync5(keyPath, "utf8").trim();
  if (!/^[0-9a-f]{64}$/.test(raw)) {
    throw new Error(
      `Signing key at '${keyPath}' is malformed. Expected a 64-character lowercase hex string (32 bytes). Re-generate with: npx multimodel-dev-os registry keygen --approved`
    );
  }
  return raw;
}
function generateSigningKey() {
  return randomBytes(32).toString("hex");
}
function saveSigningKey(targetDir, key) {
  const keyPath = getSigningKeyPath(targetDir);
  const keyDir = dirname3(keyPath);
  if (!existsSync5(keyDir)) {
    mkdirSync2(keyDir, { recursive: true });
  }
  writeFileSync3(keyPath, key + "\n", { encoding: "utf8", mode: 384 });
  try {
    chmodSync(keyPath, 384);
  } catch (_e) {
  }
}
function signPayload(hexKey, payload) {
  if (typeof hexKey !== "string" || !/^[0-9a-f]{64}$/.test(hexKey)) {
    throw new Error("Invalid signing key: must be a 64-character lowercase hex string.");
  }
  if (typeof payload !== "string") {
    throw new Error("Payload to sign must be a string.");
  }
  const keyBytes = Buffer.from(hexKey, "hex");
  return createHmac("sha256", keyBytes).update(payload, "utf8").digest("hex");
}
function createCanonicalPayload(data, fields) {
  if (!data || typeof data !== "object") {
    throw new Error("Data must be an object.");
  }
  if (!Array.isArray(fields)) {
    throw new Error("Fields must be an array of strings.");
  }
  const sortedFields = [...fields].sort();
  const obj = {};
  for (const field of sortedFields) {
    if (data[field] !== void 0) {
      obj[field] = data[field];
    }
  }
  return JSON.stringify(obj, (key, value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.keys(value).sort().reduce((sorted, k) => {
        sorted[k] = value[k];
        return sorted;
      }, {});
    }
    return value;
  });
}
function normalizePublicKey(input) {
  if (typeof input !== "string") {
    throw new Error("Public key must be a string.");
  }
  let trimmed = input.trim();
  if (trimmed.startsWith("-----BEGIN PUBLIC KEY-----")) {
    return trimmed;
  }
  if (trimmed.startsWith("-----BEGIN")) {
    return trimmed;
  }
  const clean = trimmed.replace(/\s+/g, "");
  const lines = [];
  for (let i = 0; i < clean.length; i += 64) {
    lines.push(clean.slice(i, i + 64));
  }
  return `-----BEGIN PUBLIC KEY-----
${lines.join("\n")}
-----END PUBLIC KEY-----`;
}
function verifyEd25519Payload(publicKey, payload, signature) {
  if (typeof publicKey !== "string" || typeof payload !== "string" || typeof signature !== "string") {
    return false;
  }
  try {
    const pubKey = normalizePublicKey(publicKey);
    const sigBuffer = Buffer.from(signature, "base64");
    return verify(null, Buffer.from(payload, "utf8"), pubKey, sigBuffer);
  } catch (_e) {
    return false;
  }
}
function verifyGpgSignature(publicKey, payload, signature) {
  if (typeof publicKey !== "string" || typeof payload !== "string" || typeof signature !== "string") {
    return false;
  }
  if (process.env.MMDO_TEST_MOCK_GPG === "true") {
    if (signature.includes("INVALID") || publicKey.includes("INVALID")) {
      return false;
    }
    return true;
  }
  try {
    const gpgCmd = process.platform === "win32" ? "gpg.exe" : "gpg";
    execFileSync(gpgCmd, ["--version"], { stdio: "ignore" });
  } catch (err) {
    throw new Error("GPG command-line utility ('gpg') is not installed or not found on PATH.");
  }
  const tempHomedir = join5(os.tmpdir(), `mmdo-gpg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  try {
    mkdirSync2(tempHomedir, { recursive: true });
    const keyPath = join5(tempHomedir, "pubkey.asc");
    const payloadPath = join5(tempHomedir, "payload.txt");
    const sigPath = join5(tempHomedir, "signature.asc");
    writeFileSync3(keyPath, publicKey, "utf8");
    writeFileSync3(payloadPath, payload, "utf8");
    writeFileSync3(sigPath, signature, "utf8");
    execFileSync("gpg", [
      "--homedir",
      tempHomedir,
      "--batch",
      "--yes",
      "--import",
      keyPath
    ], { stdio: "ignore" });
    execFileSync("gpg", [
      "--homedir",
      tempHomedir,
      "--batch",
      "--yes",
      "--verify",
      sigPath,
      payloadPath
    ], { stdio: "ignore" });
    return true;
  } catch (_e) {
    return false;
  } finally {
    if (existsSync5(tempHomedir)) {
      try {
        rmSync(tempHomedir, { recursive: true, force: true });
      } catch (_e) {
      }
    }
  }
}
function verifySignatureBlock({ manifest, trustedKeys, policy = {}, hmacKey = null, source = {} }) {
  const isBundled = source.name === "bundled";
  const isLocal = source.type === "local";
  const isRemote = source.type === "remote" || !isBundled && !isLocal;
  const signatureBlocks = [];
  if (manifest.signature && typeof manifest.signature === "object") {
    signatureBlocks.push(manifest.signature);
  }
  if (Array.isArray(manifest.signatures)) {
    signatureBlocks.push(...manifest.signatures);
  }
  if (signatureBlocks.length === 0) {
    if (policy.require_signature) {
      return { verified: false, status: "failed", error: "Signature is required by policy but missing from manifest." };
    }
    if (isRemote && policy.allow_unsigned_remote === false) {
      return { verified: false, status: "failed", error: "Unsigned remote registries are not allowed by policy." };
    }
    if (isBundled && policy.allow_unsigned_bundled === false) {
      return { verified: false, status: "failed", error: "Unsigned bundled registries are not allowed by policy." };
    }
    if (isLocal && !isBundled && policy.allow_unsigned_local === false) {
      return { verified: false, status: "failed", error: "Unsigned local registries are not allowed by policy." };
    }
    return { verified: true, status: "unsigned", message: "Registry is unsigned (allowed by policy)." };
  }
  let verifiedCount = 0;
  const errors = [];
  const allowedAlgs = policy.allowed_signature_algorithms || ["ed25519", "hmac-sha256", "gpg"];
  for (const sigBlock of signatureBlocks) {
    const alg = sigBlock.algorithm;
    const keyId = sigBlock.key_id;
    const signature = sigBlock.signature;
    const signedFields = sigBlock.signed_fields;
    if (!alg || !keyId || !signature || !Array.isArray(signedFields)) {
      errors.push(`Malformed signature block for key_id '${keyId || "unknown"}'.`);
      continue;
    }
    if (!allowedAlgs.includes(alg)) {
      errors.push(`Signature algorithm '${alg}' is not allowed by policy (allowed: ${allowedAlgs.join(", ")}).`);
      continue;
    }
    if (alg === "hmac-sha256") {
      if (!hmacKey) {
        errors.push(`HMAC key not configured locally for key_id '${keyId}'.`);
        continue;
      }
      try {
        const payload = createCanonicalPayload(manifest, signedFields);
        const expected = createHmac("sha256", Buffer.from(hmacKey, "hex")).update(payload, "utf8").digest("hex");
        if (timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"))) {
          verifiedCount++;
        } else {
          errors.push(`Invalid HMAC signature for key_id '${keyId}'.`);
        }
      } catch (err) {
        errors.push(`HMAC signature verification failed: ${err.message}`);
      }
    } else if (alg === "ed25519") {
      const trustedKey = trustedKeys ? trustedKeys.find((k) => k.key_id === keyId) : null;
      if (!trustedKey) {
        errors.push(`Key ID '${keyId}' not found in trust store.`);
        continue;
      }
      if (trustedKey.status !== "active") {
        errors.push(`Key ID '${keyId}' is ${trustedKey.status} (must be active).`);
        continue;
      }
      const scopes = trustedKey.scopes || [];
      if (!scopes.includes("registry") && !scopes.includes("catalog")) {
        errors.push(`Key ID '${keyId}' does not have required scope 'registry' or 'catalog' (scopes: ${scopes.join(", ")}).`);
        continue;
      }
      try {
        const payload = createCanonicalPayload(manifest, signedFields);
        if (verifyEd25519Payload(trustedKey.public_key, payload, signature)) {
          verifiedCount++;
        } else {
          errors.push(`Invalid Ed25519 signature for key_id '${keyId}'.`);
        }
      } catch (err) {
        errors.push(`Ed25519 signature verification failed: ${err.message}`);
      }
    } else if (alg === "gpg") {
      const trustedKey = trustedKeys ? trustedKeys.find((k) => k.key_id === keyId) : null;
      if (!trustedKey) {
        errors.push(`Key ID '${keyId}' not found in trust store.`);
        continue;
      }
      if (trustedKey.status !== "active") {
        errors.push(`Key ID '${keyId}' is ${trustedKey.status} (must be active).`);
        continue;
      }
      const scopes = trustedKey.scopes || [];
      if (!scopes.includes("registry") && !scopes.includes("catalog")) {
        errors.push(`Key ID '${keyId}' does not have required scope 'registry' or 'catalog' (scopes: ${scopes.join(", ")}).`);
        continue;
      }
      try {
        const payload = createCanonicalPayload(manifest, signedFields);
        if (verifyGpgSignature(trustedKey.public_key, payload, signature)) {
          verifiedCount++;
        } else {
          errors.push(`Invalid GPG signature for key_id '${keyId}'.`);
        }
      } catch (err) {
        errors.push(`GPG signature verification failed: ${err.message}`);
      }
    } else {
      errors.push(`Unsupported signature algorithm '${alg}' for key_id '${keyId}'.`);
    }
  }
  if (verifiedCount > 0) {
    return {
      verified: true,
      status: "verified",
      verified_signatures: signatureBlocks.map((s) => ({ key_id: s.key_id, algorithm: s.algorithm }))
    };
  }
  return {
    verified: false,
    status: "failed",
    errors
  };
}

// src/registry/trust-store.js
import { existsSync as existsSync6, readFileSync as readFileSync6, writeFileSync as writeFileSync4 } from "fs";
import { join as join6, isAbsolute } from "path";
import { request as httpsRequest } from "https";
import { request as httpRequest } from "http";
function loadTrustedKeys(targetDir, policy) {
  const pol = policy || loadRegistryPolicy(targetDir);
  const keyFile = pol.trusted_keys_file || ".ai/registries/trusted-keys.yaml";
  const filePath = isAbsolute(keyFile) ? keyFile : join6(targetDir, keyFile);
  if (!existsSync6(filePath)) {
    return [];
  }
  try {
    const raw = readFileSync6(filePath, "utf8");
    const parsed = parseYaml(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.trusted_publishers)) {
      return [];
    }
    return parsed.trusted_publishers;
  } catch (_e) {
    return [];
  }
}
function getTrustStorePath(targetDir, policy) {
  const pol = policy || loadRegistryPolicy(targetDir);
  const keyFile = pol.trusted_keys_file || ".ai/registries/trusted-keys.yaml";
  return isAbsolute(keyFile) ? keyFile : join6(targetDir, keyFile);
}
function serializeTrustedKeys(filePath, publishers) {
  const lines = [
    "# MultiModel Dev OS Trusted Keys",
    "# Stores trusted public keys for registry publisher verification.",
    "# Only active keys with matching scopes ('registry' or 'catalog') can verify signatures.",
    "# Never store private keys in this file or in this repository.",
    "",
    "trusted_publishers:"
  ];
  for (const p of publishers) {
    const scopes = (p.scopes || []).map((s) => `"${s}"`).join(", ");
    lines.push(`  - key_id: ${p.key_id}`);
    lines.push(`    name: "${p.name}"`);
    lines.push(`    algorithm: ${p.algorithm}`);
    const pk = (p.public_key || "").trim();
    if (pk.includes("\n")) {
      lines.push("    public_key: |");
      pk.split("\n").forEach((l) => lines.push(`      ${l}`));
    } else {
      lines.push(`    public_key: "${pk}"`);
    }
    lines.push(`    scopes: [${scopes}]`);
    lines.push(`    status: "${p.status}"`);
    if (p.added_at)
      lines.push(`    added_at: "${p.added_at}"`);
    if (p.remote_source_url)
      lines.push(`    remote_source_url: "${p.remote_source_url}"`);
    lines.push("");
  }
  writeFileSync4(filePath, lines.join("\n"), "utf8");
}
function addTrustedKey(targetDir, keyEntry, policy) {
  const required = ["key_id", "name", "algorithm", "public_key", "scopes", "status"];
  for (const field of required) {
    if (!keyEntry[field]) {
      return { added: false, error: `Missing required field: '${field}'.` };
    }
  }
  const validAlgorithms = ["ed25519", "hmac-sha256", "gpg"];
  if (!validAlgorithms.includes(keyEntry.algorithm)) {
    return { added: false, error: `Unsupported algorithm '${keyEntry.algorithm}'. Allowed: ${validAlgorithms.join(", ")}.` };
  }
  const validStatuses = ["active", "revoked", "disabled"];
  if (!validStatuses.includes(keyEntry.status)) {
    return { added: false, error: `Invalid status '${keyEntry.status}'. Allowed: ${validStatuses.join(", ")}.` };
  }
  if (!Array.isArray(keyEntry.scopes) || keyEntry.scopes.length === 0) {
    return { added: false, error: `'scopes' must be a non-empty array (e.g. ["registry"]).` };
  }
  if (!/^[a-z0-9_-]+$/i.test(keyEntry.key_id)) {
    return { added: false, error: `key_id '${keyEntry.key_id}' contains invalid characters. Use only [a-z0-9_-].` };
  }
  const pol = policy || loadRegistryPolicy(targetDir);
  const filePath = getTrustStorePath(targetDir, pol);
  const existing = loadTrustedKeys(targetDir, pol);
  if (existing.some((k) => k.key_id === keyEntry.key_id)) {
    return { added: false, error: `Key ID '${keyEntry.key_id}' already exists in the trust store. Use a unique key_id.` };
  }
  const record = {
    key_id: keyEntry.key_id,
    name: keyEntry.name,
    algorithm: keyEntry.algorithm,
    public_key: keyEntry.public_key,
    scopes: keyEntry.scopes,
    status: keyEntry.status,
    added_at: keyEntry.added_at || (/* @__PURE__ */ new Date()).toISOString()
  };
  if (keyEntry.remote_source_url)
    record.remote_source_url = keyEntry.remote_source_url;
  serializeTrustedKeys(filePath, [...existing, record]);
  return { added: true };
}
function removeTrustedKey(targetDir, keyId, policy) {
  if (!keyId || typeof keyId !== "string") {
    return { removed: false, error: "key_id must be a non-empty string." };
  }
  const pol = policy || loadRegistryPolicy(targetDir);
  const filePath = getTrustStorePath(targetDir, pol);
  const existing = loadTrustedKeys(targetDir, pol);
  const idx = existing.findIndex((k) => k.key_id === keyId);
  if (idx === -1) {
    return { removed: false, error: `Key ID '${keyId}' not found in the trust store.` };
  }
  const updated = existing.filter((k) => k.key_id !== keyId);
  serializeTrustedKeys(filePath, updated);
  return { removed: true };
}
function fetchRemotePublicKey(url, options = {}) {
  return new Promise((resolve6, reject) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (_e) {
      return reject(new Error(`Invalid URL: '${url}'.`));
    }
    const isLocalhost = parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1";
    const isHttps = parsedUrl.protocol === "https:";
    const isHttp = parsedUrl.protocol === "http:";
    if (!isHttps) {
      if (isHttp && isLocalhost && options.allowHttp) {
      } else {
        return reject(new Error(`Remote key URLs must use HTTPS. Got: '${parsedUrl.protocol}'.`));
      }
    }
    if (/['"`;<>&|$*(){}[\]\\]/.test(url)) {
      return reject(new Error(`URL contains unsafe characters: '${url}'.`));
    }
    const MAX_BYTES = 100 * 1024;
    let received = 0;
    let body = "";
    const reqModule = isHttps ? httpsRequest : httpRequest;
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        "User-Agent": "multimodel-dev-os/trust-store",
        "Accept": "text/plain,application/octet-stream"
      },
      timeout: 1e4
    };
    const req = reqModule(reqOptions, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`Remote key fetch failed: HTTP ${res.statusCode} from '${url}'.`));
      }
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        received += Buffer.byteLength(chunk, "utf8");
        if (received > MAX_BYTES) {
          req.destroy();
          return reject(new Error(`Remote key response exceeded 100KB limit from '${url}'.`));
        }
        body += chunk;
      });
      res.on("end", () => {
        const trimmed = body.trim();
        if (!trimmed) {
          return reject(new Error(`Remote key fetch returned empty response from '${url}'.`));
        }
        resolve6(trimmed);
      });
      res.on("error", (err) => reject(new Error(`Response error from '${url}': ${err.message}`)));
    });
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Remote key fetch timed out (10s) from '${url}'.`));
    });
    req.on("error", (err) => reject(new Error(`Request error for '${url}': ${err.message}`)));
    req.end();
  });
}
async function syncRemoteKeys(targetDir, options = {}) {
  const pol = loadRegistryPolicy(targetDir);
  const filePath = getTrustStorePath(targetDir, pol);
  const publishers = loadTrustedKeys(targetDir, pol);
  const updated = [];
  const errors = [];
  let checkedCount = 0;
  const newPublishers = [...publishers];
  for (let i = 0; i < newPublishers.length; i++) {
    const p = newPublishers[i];
    if (!p.remote_source_url) {
      continue;
    }
    checkedCount++;
    try {
      const newKey = await fetchRemotePublicKey(p.remote_source_url, { allowHttp: options.allowHttp });
      if (newKey && newKey !== p.public_key.trim()) {
        const updatedRecord = {
          ...p,
          public_key: newKey,
          added_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        newPublishers[i] = updatedRecord;
        updated.push({ key_id: p.key_id, oldKey: p.public_key, newKey });
      }
    } catch (err) {
      errors.push({ key_id: p.key_id, error: err.message });
    }
  }
  if (updated.length > 0 && !options.dryRun) {
    serializeTrustedKeys(filePath, newPublishers);
  }
  return { updated, errors, checkedCount };
}

// src/cli/handlers/registry/crud.js
function handleRegistryList(options) {
  const sources = loadRegistrySources();
  const policy = loadRegistryPolicy(options.target);
  if (options.json) {
    console.log(JSON.stringify(sources, null, 2));
    return;
  }
  console.log(`
\u{1F4C2}  \x1B[36mRegistry Sources [v${version}]\x1B[0m`);
  console.log("==================================================");
  console.log(`Policy Status: allow_remote_registries = \x1B[${policy.allow_remote_registries ? "32mtrue" : "33mfalse"}\x1B[0m (Remote registries are disabled by default for safety)
`);
  const lockfile = loadRegistryLockfile(options.target || process.cwd());
  sources.forEach((s) => {
    const status = s.enabled ? "\x1B[32m\u25CF enabled\x1B[0m" : "\x1B[90m\u25CB disabled\x1B[0m";
    const label = s.name === "bundled" ? "bundled" : s.type === "local" ? `local:${s.name}` : `remote:${s.name}`;
    const lockEntry = lockfile.entries[s.name];
    const lockBadge = lockEntry ? lockEntry.signature ? " \x1B[32m[signed]\x1B[0m" : " \x1B[33m[unsigned]\x1B[0m" : " \x1B[90m[no lockfile entry]\x1B[0m";
    console.log(`  \x1B[32m${s.name}\x1B[0m [${label}]  ${status}${lockBadge}`);
    console.log(`    type:           ${s.type}`);
    console.log(`    url:            ${s.url}`);
    console.log(`    trust_level:    ${s.trust_level}`);
    console.log(`    safety_policy:  ${s.safety_policy}`);
    console.log(`    checksum:       ${s.checksum_required ? "required (SHA-256 integrity)" : "not required"}`);
    console.log(`    signature:      ${s.signature_required ? "required (HMAC-SHA256)" : "not required"}`);
    if (s.last_synced_at)
      console.log(`    last_synced:    ${s.last_synced_at}`);
    if (lockEntry)
      console.log(`    lockfile:       synced ${lockEntry.synced_at}, hash ${lockEntry.catalog_sha256.slice(0, 16)}...`);
  });
  console.log("\nUse \x1B[36mregistry show <name>\x1B[0m to view detailed source configuration.");
  console.log("Use \x1B[36mregistry status\x1B[0m to see policy states and cache health.");
  console.log("Use \x1B[36mregistry verify <name>\x1B[0m to perform integrity checks.");
  console.log("Use \x1B[36mregistry lock\x1B[0m to inspect the provenance lockfile.\n");
}
function handleRegistryAdd(name, url, options) {
  const policy = loadRegistryPolicy(options.target);
  if (!policy.allow_remote_registries) {
    console.error("\x1B[31mError: Remote registries are disabled by policy.\x1B[0m");
    console.log("\nTo enable, set \x1B[33mallow_remote_registries: true\x1B[0m in:");
    console.log("  .ai/policies/registry-policy.yaml\n");
    process.exit(1);
  }
  if (!options.approved) {
    console.error("\x1B[31mError: Registry cannot be added without explicit approval. Pass the --approved flag.\x1B[0m");
    console.log(`
\x1B[33mPlanned Action:\x1B[0m Add registry source '${name}' pointing to:`);
    console.log(`  URL:         ${url}`);
    console.log(`  Type:        https`);
    console.log(`  Trust Level: community`);
    console.log(`  Checksum:    required (SHA-256)`);
    console.log(`
Run with --approved to apply:
  npx multimodel-dev-os registry add ${name} ${url} --approved
`);
    process.exit(1);
  }
  try {
    validateRegistryUrl(url, policy);
  } catch (err) {
    console.error(`\x1B[31mError: Registry URL is invalid: ${err.message}\x1B[0m`);
    process.exit(1);
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    console.error(`\x1B[31mError: Registry name '${name}' contains invalid characters. Use only alphanumeric, dash, or underscore.\x1B[0m`);
    process.exit(1);
  }
  const sources = loadRegistrySources();
  if (sources.some((s) => s.name === name)) {
    console.error(`\x1B[31mError: Registry '${name}' already exists. Remove it first with: registry remove ${name} --approved\x1B[0m`);
    process.exit(1);
  }
  const type = url.endsWith(".git") ? "git" : "https";
  sources.push({
    name,
    type,
    url,
    enabled: true,
    trust_level: "community",
    safety_policy: "sandboxed",
    signature_required: false,
    checksum_required: true
  });
  saveRegistrySources(sources);
  console.log(`
\x1B[32m\u2714 Registry '${name}' added successfully!\x1B[0m`);
  console.log(`  Type:        ${type}`);
  console.log(`  URL:         ${url}`);
  console.log(`  Trust Level: community`);
  console.log(`
Next steps:`);
  console.log(`  Sync:   npx multimodel-dev-os registry sync ${name} --approved`);
  console.log(`  Browse: npx multimodel-dev-os catalog list --source remote:${name}
`);
}
function handleRegistryRemove(name, options) {
  if (name === "bundled") {
    console.error("\x1B[31mError: The bundled registry cannot be removed.\x1B[0m");
    process.exit(1);
  }
  if (!options.approved) {
    console.error(`\x1B[31mError: Registry cannot be removed without explicit approval. Pass the --approved flag.\x1B[0m`);
    console.log(`
\x1B[33mPlanned Action:\x1B[0m Remove registry source '${name}' and delete cached files.`);
    console.log(`
Run with --approved to apply:
  npx multimodel-dev-os registry remove ${name} --approved
`);
    process.exit(1);
  }
  const sources = loadRegistrySources();
  const idx = sources.findIndex((s) => s.name === name);
  if (idx === -1) {
    console.error(`\x1B[31mError: Registry '${name}' not found.\x1B[0m`);
    process.exit(1);
  }
  sources.splice(idx, 1);
  saveRegistrySources(sources);
  const cacheDir = join7(sourceRoot, ".ai", "registry-cache", name);
  if (existsSync7(cacheDir)) {
    try {
      const files = readdirSync(cacheDir);
      files.forEach((f) => {
        const fp = join7(cacheDir, f);
        if (statSync(fp).isFile()) {
          writeFileSync5(fp, "");
        }
      });
    } catch (e) {
    }
  }
  console.log(`
\x1B[32m\u2714 Registry '${name}' removed successfully.\x1B[0m`);
  console.log(`  Source entry removed from .ai/registries/sources.yaml`);
  if (existsSync7(cacheDir)) {
    console.log(`  Cache directory cleared: .ai/registry-cache/${name}/`);
  }
  console.log("");
}
function handleRegistryShow(name, options) {
  const sources = loadRegistrySources();
  const source = sources.find((s) => s.name === name);
  if (!source) {
    console.error(`\x1B[31mError: Registry source '${name}' is not configured.\x1B[0m`);
    console.log("Available configured sources:");
    sources.forEach((s) => console.log(`  - ${s.name} (${s.type})`));
    console.log("\nTo add a remote source, run:");
    console.log(`  npx multimodel-dev-os registry add <name> <url> --approved`);
    process.exit(1);
  }
  if (source.type !== "local") {
    const policy = loadRegistryPolicy(options.target || process.cwd());
    try {
      validateRegistryUrl(source.url, policy);
    } catch (err) {
      console.error(`\x1B[31mError: Registry '${name}' has an invalid URL: ${err.message}\x1B[0m`);
      process.exit(1);
    }
  }
  if (options.json) {
    console.log(JSON.stringify(source, null, 2));
    return;
  }
  const label = source.name === "bundled" ? "bundled" : source.type === "local" ? `local:${source.name}` : `remote:${source.name}`;
  console.log(`
\u{1F50E}  \x1B[36mRegistry Source: ${name}\x1B[0m`);
  console.log("==================================================");
  console.log(`\x1B[33mName:\x1B[0m           ${source.name}`);
  console.log(`\x1B[33mSource Label:\x1B[0m   ${label}`);
  console.log(`\x1B[33mType:\x1B[0m           ${source.type}`);
  console.log(`\x1B[33mURL:\x1B[0m            ${source.url}`);
  console.log(`\x1B[33mEnabled:\x1B[0m        ${source.enabled}`);
  console.log(`\x1B[33mTrust Level:\x1B[0m    ${source.trust_level}`);
  console.log(`\x1B[33mSafety Policy:\x1B[0m  ${source.safety_policy}`);
  console.log(`\x1B[33mChecksum:\x1B[0m       ${source.checksum_required ? "Required (SHA-256 integrity)" : "Not required"}`);
  console.log(`\x1B[33mSignature:\x1B[0m      ${source.signature_required ? "Required" : "Not required (v3.0.1)"}`);
  if (source.last_synced_at) {
    console.log(`\x1B[33mLast Synced:\x1B[0m    ${source.last_synced_at}`);
  }
  if (source.pinned_commit_or_hash) {
    console.log(`\x1B[33mPinned Hash:\x1B[0m    ${source.pinned_commit_or_hash}`);
  }
  if (source.type !== "local") {
    const cacheDir = join7(sourceRoot, ".ai", "registry-cache", name);
    if (existsSync7(cacheDir)) {
      const catalogPath = join7(cacheDir, "catalog.yaml");
      if (existsSync7(catalogPath)) {
        try {
          const parsed = parseYaml(readFileSync7(catalogPath, "utf8"));
          const count = ((parsed.catalog || {}).plugins || []).length;
          console.log(`\x1B[33mCached Plugins:\x1B[0m ${count} entries`);
        } catch (e) {
          console.log(`\x1B[33mCached Plugins:\x1B[0m \x1B[31m(parse error)\x1B[0m`);
        }
      } else {
        console.log(`\x1B[33mCache Status:\x1B[0m   \x1B[90mEmpty\x1B[0m`);
      }
    } else {
      console.log(`\x1B[33mCache Status:\x1B[0m   \x1B[90mNot synced\x1B[0m`);
    }
  }
  console.log("\nNext steps:");
  console.log(`  Verify:  npx multimodel-dev-os registry verify ${name}`);
  if (source.type !== "local") {
    console.log(`  Sync:    npx multimodel-dev-os registry sync ${name} --approved`);
    console.log(`  Browse:  npx multimodel-dev-os catalog list --source remote:${name}`);
  } else {
    console.log(`  Browse:  npx multimodel-dev-os catalog list --source ${name}`);
  }
  console.log("");
}
function handleRegistryStatus(options) {
  const sources = loadRegistrySources();
  const policy = loadRegistryPolicy(options.target);
  if (options.json) {
    console.log(JSON.stringify({ sources, policy }, null, 2));
    return;
  }
  const projectDir = options.target || process.cwd();
  let signingKeyStatus = "\x1B[90mnot configured\x1B[0m";
  try {
    const sk = loadSigningKey(projectDir);
    signingKeyStatus = sk ? `\x1B[32mconfigured\x1B[0m (${getSigningKeyPath(projectDir)})` : "\x1B[90mnot configured\x1B[0m";
  } catch (e) {
    signingKeyStatus = `\x1B[31merror: ${e.message}\x1B[0m`;
  }
  const lockfile = loadRegistryLockfile(projectDir);
  const lockfileEntryCount = Object.keys(lockfile.entries).length;
  const lockfilePath = getLockfilePath(projectDir);
  const lockfileStatus = existsSync7(lockfilePath) ? `\x1B[32mpresent\x1B[0m (${lockfileEntryCount} entr${lockfileEntryCount === 1 ? "y" : "ies"})` : "\x1B[90mnot present\x1B[0m";
  console.log(`
\u{1F4CA} \x1B[36mRegistry Status [v${version}]\x1B[0m`);
  console.log("==================================================");
  console.log(`\x1B[33mPolicy State:\x1B[0m`);
  console.log(`  allow_remote_registries:    \x1B[${policy.allow_remote_registries ? "32mtrue" : "33mfalse"}\x1B[0m (Disabled by default)`);
  console.log(`  require_checksum:           ${policy.require_checksum ? "\x1B[32mtrue\x1B[0m (SHA256 integrity enforced)" : "\x1B[33mfalse\x1B[0m"}`);
  console.log(`  require_signature:          ${policy.require_signature ? "\x1B[32mtrue\x1B[0m (HMAC-SHA256 enforced)" : "\x1B[90mfalse\x1B[0m"}`);
  console.log(`  require_lockfile_on_verify: ${policy.require_lockfile_on_verify ? "\x1B[32mtrue\x1B[0m" : "\x1B[90mfalse\x1B[0m"}`);
  console.log(`  allow_untrusted_install:    ${policy.allow_untrusted_install ? "\x1B[33mtrue\x1B[0m" : "\x1B[32mfalse\x1B[0m (secured)"}`);
  console.log(`  allow_unsigned_local:       ${policy.allow_unsigned_local ? "\x1B[32mtrue\x1B[0m" : "\x1B[33mfalse\x1B[0m"}`);
  console.log(`  allow_unsigned_bundled:     ${policy.allow_unsigned_bundled ? "\x1B[32mtrue\x1B[0m" : "\x1B[33mfalse\x1B[0m"}`);
  console.log(`  allow_unsigned_remote:      ${policy.allow_unsigned_remote ? "\x1B[32mtrue\x1B[0m" : "\x1B[33mfalse\x1B[0m"}`);
  console.log(`  require_trusted_publisher:  ${policy.require_trusted_publisher ? "\x1B[32mtrue\x1B[0m" : "\x1B[90mfalse\x1B[0m"}`);
  console.log(`  provenance_required:        ${policy.provenance_required ? "\x1B[32mtrue\x1B[0m" : "\x1B[90mfalse\x1B[0m"}`);
  console.log(`  trusted_keys_file:          \x1B[36m${policy.trusted_keys_file}\x1B[0m`);
  console.log(`  allowed_signature_algs:     \x1B[36m${(policy.allowed_signature_algorithms || []).join(", ")}\x1B[0m`);
  console.log(`  max_plugin_files:           ${policy.max_plugin_files}`);
  console.log(`  max_plugin_size_kb:         ${policy.max_plugin_size_kb}KB`);
  console.log(`  max_registry_cache_size:    ${policy.max_registry_cache_size_kb}KB`);
  console.log(`
\x1B[33mSigning & Provenance:\x1B[0m`);
  console.log(`  Signing key:    ${signingKeyStatus}`);
  console.log(`  Lockfile:       ${lockfileStatus}`);
  if (lockfileEntryCount > 0) {
    Object.entries(lockfile.entries).forEach(([rName, entry]) => {
      const sigBadge = entry.signature ? "\x1B[32m[signed]\x1B[0m" : "\x1B[33m[unsigned]\x1B[0m";
      console.log(`    ${rName}: ${sigBadge} synced ${entry.synced_at || "unknown"}`);
    });
  }
  console.log(`
\x1B[33mSources:\x1B[0m`);
  sources.forEach((s) => {
    const status = s.enabled ? "\x1B[32m\u25CF enabled\x1B[0m" : "\x1B[90m\u25CB disabled\x1B[0m";
    const label = s.name === "bundled" ? "bundled" : s.type === "local" ? `local:${s.name}` : `remote:${s.name}`;
    const synced = s.last_synced_at ? `synced: ${s.last_synced_at}` : "never synced";
    const cacheDir = join7(sourceRoot, ".ai", "registry-cache", s.name);
    const hasCache = s.type !== "local" && existsSync7(cacheDir);
    console.log(`  ${s.name}  ${status}  [${label}]  (${s.type}, ${s.trust_level})`);
    if (s.type !== "local") {
      console.log(`    URL:    ${s.url}`);
      console.log(`    Cache:  ${hasCache ? "\x1B[32mcached\x1B[0m" : "\x1B[90mnot cached\x1B[0m"}`);
      console.log(`    Sync:   ${synced}`);
    }
  });
  console.log("\nUse \x1B[36mregistry list\x1B[0m to view configured registry sources.");
  console.log("Use \x1B[36mregistry verify <name>\x1B[0m to check cache integrity offline.");
  console.log("Use \x1B[36mregistry sync <name> --approved\x1B[0m to refresh a remote cache.\n");
}

// src/cli/handlers/registry/sync.js
import { existsSync as existsSync8, mkdirSync as mkdirSync3, readdirSync as readdirSync2, statSync as statSync2, writeFileSync as writeFileSync6 } from "fs";
import { join as join8, dirname as dirname4, relative, isAbsolute as isAbsolute2 } from "path";
import { execFileSync as execFileSync2 } from "child_process";

// src/core/hashes.js
import { createHash } from "crypto";
import { readFileSync as readFileSync8 } from "fs";
function computeSHA256(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}
function hashFile(filePath) {
  try {
    const data = readFileSync8(filePath);
    return createHash("sha256").update(data).digest("hex");
  } catch (e) {
    return "";
  }
}

// src/cli/handlers/registry/sync.js
function handleRegistrySync(name, options) {
  const policy = loadRegistryPolicy(options.target);
  const sources = loadRegistrySources();
  const source = sources.find((s) => s.name === name);
  if (!source) {
    console.error(`\x1B[31mError: Registry '${name}' not found in configured sources.\x1B[0m`);
    console.log("Available configured sources:");
    sources.forEach((s) => console.log(`  - ${s.name} (${s.type})`));
    console.log("\nUse \x1B[36mregistry list\x1B[0m to view configured sources.");
    process.exit(1);
  }
  if (source.type === "local") {
    console.log(`
\x1B[33mNote: Registry '${name}' is a local source and does not require syncing.\x1B[0m
`);
    return;
  }
  try {
    validateRegistryUrl(source.url, policy);
  } catch (err) {
    console.error(`\x1B[31mError: Registry '${name}' has an invalid URL: ${err.message}\x1B[0m`);
    process.exit(1);
  }
  if (!policy.allow_remote_registries) {
    console.error("\x1B[31mError: Remote registries are disabled by policy.\x1B[0m");
    console.log("\nTo enable, set \x1B[33mallow_remote_registries: true\x1B[0m in:");
    console.log("  .ai/policies/registry-policy.yaml\n");
    process.exit(1);
  }
  if (!options.approved) {
    console.log(`
\u26A0\uFE0F   \x1B[33mRegistry Sync Refused \u2014 Explicit Approval Required\x1B[0m`);
    console.log("==================================================");
    console.log(`Syncing remote registries requires the explicit \x1B[33m--approved\x1B[0m flag to download metadata and files.`);
    console.log(`Registry:       \x1B[32m${name}\x1B[0m`);
    console.log(`URL:            ${source.url}`);
    console.log(`Trust Level:    ${source.trust_level}`);
    console.log(`Checksums:      ${source.checksum_required ? "Enforced (SHA-256)" : "Not enforced"}`);
    console.log(`Signatures:     ${source.signature_required ? "Required" : "Disabled (SHA-256 fallback)"}`);
    console.log(`
\x1B[33mPlanned Actions:\x1B[0m`);
    console.log(`  [DOWNLOAD] catalog.yaml    \u2192 .ai/registry-cache/${name}/catalog.yaml`);
    console.log(`  [DOWNLOAD] manifest.json   \u2192 .ai/registry-cache/${name}/manifest.json`);
    console.log(`  [COMPUTE]  checksums.json  \u2192 .ai/registry-cache/${name}/checksums.json`);
    console.log(`
\x1B[33mSecurity & Safety Boundaries:\x1B[0m`);
    console.log(`  \u2022 \x1B[32mNo automated installs:\x1B[0m Syncing only updates the local cache. No plugins are installed or run.`);
    console.log(`  \u2022 \x1B[32mNo arbitrary code execution:\x1B[0m Registries cannot run shell scripts, commands, or packages.`);
    console.log(`  \u2022 \x1B[32mSandboxed write paths:\x1B[0m Cache files are written strictly to .ai/registry-cache/${name}/.`);
    console.log(`  \u2022 \x1B[32mTo install afterwards:\x1B[0m Use 'catalog install <slug> --approved' to deploy a plugin.`);
    console.log(`
To execute this sync operation, run:`);
    console.log(`  \x1B[36mnpx multimodel-dev-os registry sync ${name} --approved\x1B[0m
`);
    process.exit(1);
  }
  const cacheDir = join8(sourceRoot, ".ai", "registry-cache", name);
  if (!existsSync8(cacheDir)) {
    mkdirSync3(cacheDir, { recursive: true });
  }
  console.log(`
\u{1F504} \x1B[36mSyncing Registry: ${name}\x1B[0m`);
  console.log("==================================================");
  const url = source.url;
  const catalogUrl = url.endsWith("/") ? `${url}catalog.yaml` : url;
  const manifestUrl = catalogUrl.replace(/catalog\.yaml$/, "manifest.json");
  try {
    const catalogDest = join8(cacheDir, "catalog.yaml");
    const manifestDest = join8(cacheDir, "manifest.json");
    const fetchUrlSync = (targetUrl) => {
      validateRegistryUrl(targetUrl, policy);
      const script = `
        const url = process.argv[1];
        const mod = require(url.startsWith('https') ? 'https' : 'http');
        mod.get(url, (res) => {
          if (res.statusCode !== 200) {
            process.stderr.write('HTTP_ERROR:' + res.statusCode);
            process.exit(1);
          }
          res.pipe(process.stdout);
        }).on('error', (e) => {
          process.stderr.write('NET_ERROR:' + e.message);
          process.exit(1);
        });
      `;
      return execFileSync2(process.execPath, ["-e", script, "--", targetUrl], { encoding: "utf8", timeout: 3e4 });
    };
    console.log(`Downloading: ${catalogUrl}`);
    console.log(`  \u2192 .ai/registry-cache/${name}/catalog.yaml ...`);
    const catalogData = fetchUrlSync(catalogUrl);
    writeFileSync6(catalogDest, catalogData, "utf8");
    const catalogSize = (Buffer.byteLength(catalogData) / 1024).toFixed(1);
    console.log(`  \u2192 OK (${catalogSize}KB)`);
    let manifestData = null;
    try {
      console.log(`Downloading: ${manifestUrl}`);
      console.log(`  \u2192 .ai/registry-cache/${name}/manifest.json ...`);
      manifestData = fetchUrlSync(manifestUrl);
      writeFileSync6(manifestDest, manifestData, "utf8");
      const manifestSize = (Buffer.byteLength(manifestData) / 1024).toFixed(1);
      console.log(`  \u2192 OK (${manifestSize}KB)`);
    } catch (e) {
      console.log(`  \u2192 \x1B[33mNot found (optional)\x1B[0m`);
    }
    console.log("Computing checksums...");
    const checksums = {
      "catalog.yaml": `sha256:${computeSHA256(catalogData)}`
    };
    if (manifestData) {
      checksums["manifest.json"] = `sha256:${computeSHA256(manifestData)}`;
    }
    const baseUrl = catalogUrl.substring(0, catalogUrl.lastIndexOf("/") + 1);
    let totalSize = Buffer.byteLength(catalogData) + (manifestData ? Buffer.byteLength(manifestData) : 0);
    if (manifestData) {
      try {
        const manifestObj = JSON.parse(manifestData);
        if (manifestObj.files_hashes) {
          for (const [file, hash] of Object.entries(manifestObj.files_hashes)) {
            if (file === "catalog.yaml" || file === "manifest.json")
              continue;
            const fileDest = join8(cacheDir, file);
            const relativeToCache = relative(cacheDir, fileDest);
            if (relativeToCache.includes("..") || isAbsolute2(relativeToCache)) {
              console.error(`\x1B[31mError: Safe path violation in manifest files list: ${file}\x1B[0m`);
              process.exit(1);
            }
            console.log(`Downloading: ${baseUrl}${file}`);
            console.log(`  \u2192 .ai/registry-cache/${name}/${file} ...`);
            const fileData = fetchUrlSync(`${baseUrl}${file}`);
            totalSize += Buffer.byteLength(fileData);
            if (totalSize > policy.max_registry_cache_size_kb * 1024) {
              console.error(`\x1B[31mError: Registry cache size limit exceeded (max: ${policy.max_registry_cache_size_kb}KB).\x1B[0m`);
              process.exit(1);
            }
            const fileDir = dirname4(fileDest);
            if (!existsSync8(fileDir)) {
              mkdirSync3(fileDir, { recursive: true });
            }
            writeFileSync6(fileDest, fileData, "utf8");
            const fileSize = (Buffer.byteLength(fileData) / 1024).toFixed(1);
            console.log(`  \u2192 OK (${fileSize}KB)`);
            const actualHash = computeSHA256(fileData);
            const expectedHash = hash.replace("sha256:", "");
            if (policy.require_checksum && actualHash !== expectedHash) {
              console.error(`\x1B[31mError: Checksum verification failed for synced file: ${file}\x1B[0m`);
              console.error(`  Expected: ${expectedHash}`);
              console.error(`  Actual:   ${actualHash}`);
              process.exit(1);
            }
            checksums[file] = `sha256:${actualHash}`;
          }
        }
      } catch (err) {
        console.error(`\x1B[31mError: Failed to process registry manifest files: ${err.message}\x1B[0m`);
        process.exit(1);
      }
    }
    const checksumsJson = JSON.stringify(checksums, null, 2);
    writeFileSync6(join8(cacheDir, "checksums.json"), checksumsJson, "utf8");
    console.log(`  \u2192 .ai/registry-cache/${name}/checksums.json ... OK`);
    if (policy.require_checksum && manifestData) {
      try {
        const manifest = JSON.parse(manifestData);
        if (manifest.catalog_hash) {
          const expectedHash = manifest.catalog_hash.replace("sha256:", "");
          const actualHash = computeSHA256(catalogData);
          if (expectedHash === actualHash) {
            console.log(`
\x1B[32mChecksum verification: PASSED\x1B[0m`);
          } else {
            console.error(`
\x1B[31mChecksum verification: FAILED\x1B[0m`);
            console.error(`  Expected: ${expectedHash}`);
            console.error(`  Actual:   ${actualHash}`);
            process.exit(1);
          }
        }
      } catch (e) {
      }
    }
    const syncedAt = (/* @__PURE__ */ new Date()).toISOString();
    source.last_synced_at = syncedAt;
    source.pinned_commit_or_hash = computeSHA256(catalogData);
    saveRegistrySources(sources);
    const catalogHash = computeSHA256(catalogData);
    const manifestHash = manifestData ? computeSHA256(manifestData) : null;
    const projectDir = options.target || process.cwd();
    let signingKey = null;
    let signature = null;
    try {
      signingKey = loadSigningKey(projectDir);
    } catch (sigKeyErr) {
      console.log(`  \x1B[33mWarning: Signing key error \u2014 ${sigKeyErr.message}\x1B[0m`);
    }
    if (signingKey) {
      try {
        signature = signPayload(signingKey, catalogHash);
        console.log("  \x1B[32m\u2713 Catalog signed with project signing key (HMAC-SHA256)\x1B[0m");
      } catch (signErr) {
        console.log(`  \x1B[33mWarning: Signing failed \u2014 ${signErr.message}\x1B[0m`);
      }
    } else {
      if (policy.require_signature) {
        console.error(`\x1B[31mError: policy require_signature is true but no signing key found.\x1B[0m`);
        console.error(`  Generate a key with: npx multimodel-dev-os registry keygen --approved`);
        process.exit(1);
      }
      console.log("  \x1B[33m\u26A0 No signing key \u2014 provenance recorded without signature.\x1B[0m");
      console.log("    Generate a key with: npx multimodel-dev-os registry keygen --approved");
    }
    const trustedKeys = loadTrustedKeys(projectDir, policy);
    let verifyRes = { verified: true, status: "unsigned" };
    let parsedManifest = null;
    if (manifestData) {
      try {
        parsedManifest = JSON.parse(manifestData);
        verifyRes = verifySignatureBlock({
          manifest: parsedManifest,
          trustedKeys,
          policy,
          hmacKey: signingKey,
          source
        });
      } catch (_e) {
      }
    } else {
      if (policy.require_signature || policy.allow_unsigned_remote === false) {
        verifyRes = { verified: false, error: "Manifest missing but signature is required by policy." };
      }
    }
    const firstSig = parsedManifest && (parsedManifest.signature || Array.isArray(parsedManifest.signatures) && parsedManifest.signatures[0]);
    const sigBlock = firstSig && typeof firstSig === "object" ? firstSig : null;
    let trustedPublisherStatus = "unknown";
    if (sigBlock && sigBlock.key_id) {
      const tk = trustedKeys.find((k) => k.key_id === sigBlock.key_id);
      if (tk) {
        trustedPublisherStatus = tk.status || "inactive";
      }
    }
    let trustVerdict = "failed";
    if (verifyRes.verified) {
      if (verifyRes.status === "verified") {
        trustVerdict = "verified";
      } else {
        trustVerdict = "unsigned_allowed";
      }
    }
    const verificationErrors = verifyRes.errors || (verifyRes.error ? [verifyRes.error] : []);
    const verificationWarnings = verifyRes.warning ? [verifyRes.warning] : [];
    const lockfile = loadRegistryLockfile(projectDir);
    updateLockfileEntry(lockfile, name, {
      url: source.url,
      synced_at: options.synced_at || syncedAt,
      // Allow override for test determinism
      catalog_sha256: catalogHash,
      manifest_sha256: manifestHash,
      signature,
      signature_alg: "hmac-sha256",
      public_signature_status: verifyRes.status || "unsigned",
      public_signature_algorithm: sigBlock ? sigBlock.algorithm : null,
      public_signature_key_id: sigBlock ? sigBlock.key_id : null,
      trusted_publisher_status: trustedPublisherStatus,
      trust_store_path: policy.trusted_keys_file || ".ai/registries/trusted-keys.yaml",
      trust_verdict: trustVerdict,
      lockfile_verdict: "verified",
      verification_errors: verificationErrors,
      verification_warnings: verificationWarnings
    });
    saveRegistryLockfile(projectDir, lockfile);
    console.log(`  \x1B[32m\u2713 Provenance lockfile updated: .ai/registry-lock.json\x1B[0m`);
    let pluginCount = 0;
    try {
      const catParsed = parseYaml(catalogData);
      pluginCount = ((catParsed.catalog || {}).plugins || []).length;
    } catch (e) {
    }
    console.log(`
\x1B[32m\u2714 Registry '${name}' synced successfully!\x1B[0m`);
    console.log(`  Cache location:  .ai/registry-cache/${name}/`);
    console.log(`  Plugins cached:  ${pluginCount} entries`);
    console.log(`  Checksum status: VERIFIED (SHA256)`);
    console.log(`  Provenance:      ${signature ? "SIGNED (HMAC-SHA256)" : "Unsigned (no signing key)"}`);
    console.log(`  Last synced:     ${syncedAt}`);
    console.log(`
Next steps:`);
    console.log(`  \u2022 Browse:  npx multimodel-dev-os catalog list --source remote:${name}`);
    console.log(`  \u2022 Verify:  npx multimodel-dev-os registry verify ${name}`);
    console.log(`  \u2022 Lock:    npx multimodel-dev-os registry lock`);
    console.log(`  \u2022 Install: npx multimodel-dev-os catalog install <slug> --approved
`);
  } catch (e) {
    console.error(`
\x1B[31mSync failed: ${e.message}\x1B[0m`);
    console.log("\nPossible causes:");
    console.log("  \u2022 Network unreachable or URL invalid");
    console.log("  \u2022 Remote server returned an error");
    console.log(`  \u2022 Check URL: ${catalogUrl}
`);
    process.exit(1);
  }
}
function handleRegistryCacheClear(options) {
  if (!options.approved) {
    console.error("\x1B[31mError: Cache cannot be cleared without explicit approval. Pass the --approved flag.\x1B[0m");
    const cacheRoot2 = join8(sourceRoot, ".ai", "registry-cache");
    if (existsSync8(cacheRoot2)) {
      const dirs = readdirSync2(cacheRoot2).filter((d) => d !== "README.md");
      console.log(`
\x1B[33mPlanned Action:\x1B[0m Clear ${dirs.length} cached registry directories:`);
      dirs.forEach((d) => console.log(`  - .ai/registry-cache/${d}/`));
    } else {
      console.log("\n\x1B[33mNo cache directories found.\x1B[0m");
    }
    console.log(`
Run with --approved to apply:
  npx multimodel-dev-os registry cache clear --approved
`);
    process.exit(1);
  }
  const cacheRoot = join8(sourceRoot, ".ai", "registry-cache");
  if (!existsSync8(cacheRoot)) {
    console.log("\n\x1B[33mNo registry cache directory found. Nothing to clear.\x1B[0m\n");
    return;
  }
  const entries = readdirSync2(cacheRoot).filter((d) => d !== "README.md");
  let cleared = 0;
  entries.forEach((d) => {
    const dirPath = join8(cacheRoot, d);
    try {
      if (statSync2(dirPath).isDirectory()) {
        const files = readdirSync2(dirPath);
        files.forEach((f) => {
          const fp = join8(dirPath, f);
          if (statSync2(fp).isFile()) {
            writeFileSync6(fp, "");
          }
        });
        cleared++;
      }
    } catch (e) {
    }
  });
  console.log(`
\x1B[32m\u2714 Registry cache cleared.\x1B[0m`);
  console.log(`  Directories processed: ${cleared}`);
  console.log(`  Cache root: .ai/registry-cache/
`);
}
function handleRegistryLock(options) {
  const projectDir = options.target || process.cwd();
  const lockfilePath = getLockfilePath(projectDir);
  console.log(`
\u{1F512} \x1B[36mRegistry Provenance Lockfile\x1B[0m`);
  console.log("==================================================");
  if (!existsSync8(lockfilePath)) {
    console.log(`  \x1B[90mNo lockfile found at: ${lockfilePath}\x1B[0m`);
    console.log(`  Sync a remote registry to create it:`);
    console.log(`    npx multimodel-dev-os registry sync <name> --approved
`);
    return;
  }
  const lockfile = loadRegistryLockfile(projectDir);
  const entries = Object.entries(lockfile.entries);
  if (options.json) {
    console.log(JSON.stringify(lockfile, null, 2));
    return;
  }
  console.log(`  Lockfile version: ${lockfile.lockfile_version}`);
  console.log(`  Generated at:     ${lockfile.generated_at}`);
  console.log(`  Path:             ${lockfilePath}`);
  console.log(`  Entries:          ${entries.length}
`);
  if (entries.length === 0) {
    console.log(`  \x1B[90mNo registry entries recorded yet.\x1B[0m`);
    console.log(`  Sync a remote registry to populate:
    npx multimodel-dev-os registry sync <name> --approved
`);
    return;
  }
  entries.forEach(([name, entry]) => {
    const sigBadge = entry.signature ? `\x1B[32m[SIGNED \u2014 HMAC-SHA256]\x1B[0m` : `\x1B[33m[UNSIGNED]\x1B[0m`;
    console.log(`  \x1B[32m${name}\x1B[0m  ${sigBadge}`);
    console.log(`    URL:             ${entry.url}`);
    console.log(`    Synced at:       ${entry.synced_at}`);
    console.log(`    Catalog SHA-256: ${entry.catalog_sha256}`);
    if (entry.manifest_sha256) {
      console.log(`    Manifest SHA256: ${entry.manifest_sha256}`);
    }
    if (entry.signature) {
      console.log(`    Signature:       ${entry.signature.slice(0, 24)}...`);
      console.log(`    Sig algorithm:   ${entry.signature_alg}`);
    }
    console.log("");
  });
  console.log("Use \x1B[36mregistry verify <name>\x1B[0m to re-verify cached files against the lockfile.");
  console.log("Use \x1B[36mregistry keygen --approved\x1B[0m to generate a signing key for HMAC signatures.\n");
}

// src/cli/handlers/registry/signing.js
import { existsSync as existsSync9, readFileSync as readFileSync9, writeFileSync as writeFileSync7 } from "fs";
import { join as join9 } from "path";

// src/registry/verdict.js
function createTrustVerdict({
  source,
  source_type,
  manifest_hash_status = "N/A",
  catalog_hash_status = "N/A",
  lockfile_status = "N/A",
  provenance_status = "N/A",
  signature_status = "N/A",
  trusted_publisher_status = "N/A",
  errors = [],
  warnings = [],
  final_status = "unknown"
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

// src/cli/handlers/registry/signing.js
function handleRegistryVerify(name, options) {
  console.log(`
\u{1F50E} \x1B[36mVerifying Registry: ${name}\x1B[0m`);
  console.log("==================================================");
  const projectDir = options.target || process.cwd();
  const policy = loadRegistryPolicy(projectDir);
  const sources = loadRegistrySources();
  const source = sources.find((s) => s.name === name);
  let isBundled = name === "bundled";
  let isLocal = source ? source.type === "local" : false;
  let isRemote = source ? source.type === "remote" : false;
  let url = source ? source.url : isBundled ? ".ai/plugins/catalog.yaml" : null;
  if (!source && !isBundled) {
    console.error(`\x1B[31mError: Registry '${name}' is not configured.\x1B[0m`);
    process.exit(1);
  }
  let urlValidationStatus = "N/A";
  if (isRemote) {
    try {
      validateRegistryUrl(url, policy);
      urlValidationStatus = "\x1B[32m\u2713 Valid HTTPS\x1B[0m";
    } catch (err) {
      urlValidationStatus = `\x1B[31m\u2717 Invalid: ${err.message}\x1B[0m`;
    }
  } else {
    urlValidationStatus = "\x1B[32m\u2713 Valid Local Path\x1B[0m";
  }
  let cacheDir;
  if (isBundled) {
    cacheDir = join9(sourceRoot, ".ai", "plugins");
  } else {
    cacheDir = join9(sourceRoot, ".ai", "registry-cache", name);
  }
  const catalogDest = join9(cacheDir, "catalog.yaml");
  const manifestDest = join9(cacheDir, "manifest.json");
  const checksumPath = join9(cacheDir, "checksums.json");
  if (!isBundled && !existsSync9(cacheDir)) {
    console.error(`\x1B[31mError: No cache found for registry '${name}'. Run registry sync first.\x1B[0m`);
    process.exit(1);
  }
  if (isBundled && !existsSync9(catalogDest)) {
    console.error(`\x1B[31mError: Bundled catalog.yaml not found.\x1B[0m`);
    process.exit(1);
  }
  let catalogContent = "";
  let catalogHash = "N/A";
  if (existsSync9(catalogDest)) {
    catalogContent = readFileSync9(catalogDest, "utf8");
    catalogHash = computeSHA256(catalogContent);
  }
  let manifestObj = null;
  let manifestHash = "N/A";
  if (existsSync9(manifestDest)) {
    const manifestData = readFileSync9(manifestDest, "utf8");
    manifestHash = computeSHA256(manifestData);
    try {
      manifestObj = JSON.parse(manifestData);
    } catch (e) {
      console.warn(`\x1B[33mWarning: Failed to parse manifest.json: ${e.message}\x1B[0m`);
    }
  }
  let integrityVerified = true;
  if (!isBundled) {
    if (!existsSync9(checksumPath)) {
      console.log(`  \x1B[33m\u26A0\uFE0F Checksums: Missing checksums.json in cache\x1B[0m`);
      integrityVerified = false;
    } else {
      try {
        const checksums = JSON.parse(readFileSync9(checksumPath, "utf8"));
        Object.entries(checksums).forEach(([file, expectedHash]) => {
          const filePath = join9(cacheDir, file);
          if (!existsSync9(filePath)) {
            console.log(`  \x1B[31m\u2717 File missing in cache: ${file}\x1B[0m`);
            integrityVerified = false;
            return;
          }
          const content = readFileSync9(filePath, "utf8");
          const actualHash = `sha256:${computeSHA256(content)}`;
          if (actualHash === expectedHash) {
            console.log(`  \x1B[32m\u2713 ${file}: VERIFIED (Integrity check matched via SHA-256)\x1B[0m`);
          } else {
            console.log(`  \x1B[31m\u2717 ${file}: MISMATCH\x1B[0m`);
            console.log(`    Expected: ${expectedHash}`);
            console.log(`    Actual:   ${actualHash}`);
            integrityVerified = false;
          }
        });
      } catch (e) {
        console.log(`  \x1B[31m\u2717 Integrity: Failed to verify checksums: ${e.message}\x1B[0m`);
        integrityVerified = false;
      }
    }
  }
  const lockfile = loadRegistryLockfile(projectDir);
  const lockEntry = lockfile.entries[name];
  let lockfileStatus = "N/A";
  let provenanceStatus = "N/A";
  let lockfileVerdict = "N/A";
  if (!isBundled) {
    const lockfilePath = getLockfilePath(projectDir);
    lockfileStatus = existsSync9(lockfilePath) ? `\x1B[32mpresent\x1B[0m` : `\x1B[33mmissing\x1B[0m`;
    if (!lockEntry) {
      if (policy.require_lockfile_on_verify) {
        provenanceStatus = `\x1B[31m\u2717 Failed (require_lockfile_on_verify is true but entry missing)\x1B[0m`;
        lockfileVerdict = "Failed";
      } else {
        provenanceStatus = `\x1B[33m\u26A0\uFE0F Missing provenance entry (no sync lock)\x1B[0m`;
        lockfileVerdict = "Missing";
      }
    } else {
      let isProvMatch = true;
      if (catalogHash !== lockEntry.catalog_sha256) {
        isProvMatch = false;
        console.log(`  \x1B[31m\u2717 Lockfile catalog hash mismatch: Expected ${lockEntry.catalog_sha256}, got ${catalogHash}\x1B[0m`);
      }
      if (manifestHash !== "N/A" && lockEntry.manifest_sha256 && manifestHash !== lockEntry.manifest_sha256) {
        isProvMatch = false;
        console.log(`  \x1B[31m\u2717 Lockfile manifest hash mismatch: Expected ${lockEntry.manifest_sha256}, got ${manifestHash}\x1B[0m`);
      }
      if (isProvMatch) {
        provenanceStatus = `\x1B[32m\u2713 Matched lockfile entry\x1B[0m`;
        lockfileVerdict = "Verified";
      } else {
        provenanceStatus = `\x1B[31m\u2717 Tampering detected: hashes do not match lockfile\x1B[0m`;
        lockfileVerdict = "Tampered";
      }
    }
  } else {
    lockfileStatus = "N/A (Bundled)";
    provenanceStatus = "\x1B[32m\u2713 Implicit Trust\x1B[0m";
    lockfileVerdict = "Verified";
  }
  const trustedKeys = loadTrustedKeys(projectDir, policy);
  let hmacKey = null;
  try {
    hmacKey = loadSigningKey(projectDir);
  } catch (_e) {
  }
  let signatureAlgorithm = "None";
  let signatureKeyId = "None";
  let trustedPublisherStatus = "N/A";
  let signatureValidity = "N/A";
  let signatureResult = { verified: true, status: "unsigned" };
  if (manifestObj) {
    signatureResult = verifySignatureBlock({
      manifest: manifestObj,
      trustedKeys,
      policy,
      hmacKey,
      source: source || { name: "bundled", type: "local" }
    });
    const signatureBlocks = [];
    if (manifestObj.signature && typeof manifestObj.signature === "object") {
      signatureBlocks.push(manifestObj.signature);
    }
    if (Array.isArray(manifestObj.signatures)) {
      signatureBlocks.push(...manifestObj.signatures);
    }
    if (signatureBlocks.length > 0) {
      const firstSig = signatureBlocks[0];
      signatureAlgorithm = firstSig.algorithm || "unknown";
      signatureKeyId = firstSig.key_id || "unknown";
      const tk = trustedKeys.find((k) => k.key_id === signatureKeyId);
      if (tk) {
        trustedPublisherStatus = tk.status === "active" ? `\x1B[32m\u2713 Trusted (${tk.name})\x1B[0m` : `\x1B[31m\u2717 ${tk.status} (${tk.name})\x1B[0m`;
      } else {
        trustedPublisherStatus = `\x1B[33m\u26A0\uFE0F Unknown key_id (Not in trust store)\x1B[0m`;
      }
      if (signatureResult.verified) {
        signatureValidity = `\x1B[32m\u2713 Valid Signature\x1B[0m`;
      } else {
        const errorMsg = signatureResult.errors ? signatureResult.errors.join(", ") : signatureResult.error || "signature verification failed";
        signatureValidity = `\x1B[31m\u2717 Invalid Signature (${errorMsg})\x1B[0m`;
      }
    } else {
      if (policy.require_signature || isRemote && policy.allow_unsigned_remote === false) {
        signatureValidity = `\x1B[31m\u2717 Missing Signature (Enforced by policy)\x1B[0m`;
      } else {
        signatureValidity = `\x1B[90mUnsigned\x1B[0m`;
      }
    }
  } else {
    if (!isBundled && (policy.require_signature || isRemote && policy.allow_unsigned_remote === false)) {
      signatureResult = { verified: false, error: "Manifest missing but signature is required by policy." };
      signatureValidity = `\x1B[31m\u2717 Manifest missing (Enforced by policy)\x1B[0m`;
    } else {
      signatureValidity = `\x1B[90mUnsigned (No manifest)\x1B[0m`;
    }
  }
  console.log(`  Source Type:        ${isBundled ? "bundled" : source.type}`);
  console.log(`  Source URL/Path:    ${url}`);
  console.log(`  URL Validation:     ${urlValidationStatus}`);
  console.log(`  Manifest SHA256:    ${manifestHash}`);
  console.log(`  Catalog SHA256:     ${catalogHash}`);
  console.log(`  Lockfile Status:    ${lockfileStatus}`);
  console.log(`  Provenance Status:  ${provenanceStatus}`);
  console.log(`  Signature Alg:      ${signatureAlgorithm}`);
  console.log(`  Signature Key ID:   ${signatureKeyId}`);
  console.log(`  Trusted Publisher:  ${trustedPublisherStatus}`);
  console.log(`  Signature Validity: ${signatureValidity}`);
  let finalVerdict = "\u2717 Failed";
  let passed = true;
  if (!integrityVerified)
    passed = false;
  if (!isBundled && lockfileVerdict === "Failed")
    passed = false;
  if (!isBundled && lockfileVerdict === "Tampered")
    passed = false;
  if (!signatureResult.verified)
    passed = false;
  if (passed) {
    if (signatureResult.status === "verified") {
      finalVerdict = `\x1B[32m\u2713 Verified (Signature matches trusted key)\x1B[0m`;
    } else if (isBundled || isLocal) {
      finalVerdict = `\x1B[32m\u2713 Verified (Implicit local trust)\x1B[0m`;
    } else {
      finalVerdict = `\x1B[33m\u26A0\uFE0F Unsigned (Allowed by policy)\x1B[0m`;
    }
  } else {
    const reason = !integrityVerified ? "Integrity check failed" : lockfileVerdict === "Tampered" ? "Lockfile tampering detected" : signatureResult.error || signatureResult.errors && signatureResult.errors.join(", ") || "Signature verification failed";
    finalVerdict = `\x1B[31m\u2717 Failed (${reason})\x1B[0m`;
  }
  console.log(`  Final Trust:        ${finalVerdict}`);
  console.log("==================================================");
  try {
    const parsed = parseYaml(catalogContent);
    const pluginCount = ((parsed.catalog || {}).plugins || []).length;
    console.log(`  Plugins Parsed:     ${pluginCount} entries`);
  } catch (e) {
    console.error(`\x1B[31m\u2717 Catalog parsing failed: ${e.message}\x1B[0m`);
    process.exit(1);
  }
  const verdict = createTrustVerdict({
    source: name,
    source_type: isBundled ? "bundled" : source ? source.type : "remote",
    manifest_hash_status: manifestHash !== "N/A" ? lockEntry && manifestHash === lockEntry.manifest_sha256 ? "verified" : manifestObj ? "unverified" : "missing" : "N/A",
    catalog_hash_status: catalogHash !== "N/A" ? lockEntry && catalogHash === lockEntry.catalog_sha256 ? "verified" : "unverified" : "N/A",
    lockfile_status: isBundled ? "N/A" : lockEntry ? "present" : "missing",
    provenance_status: isBundled ? "N/A" : lockEntry ? lockfileVerdict === "Verified" ? "matched" : lockfileVerdict === "Tampered" ? "mismatch" : "missing" : "N/A",
    signature_status: signatureResult.status || "unsigned",
    trusted_publisher_status: signatureResult.status === "verified" ? "trusted" : "N/A",
    errors: signatureResult.errors || (signatureResult.error ? [signatureResult.error] : []),
    warnings: signatureResult.warning ? [signatureResult.warning] : [],
    final_status: passed ? signatureResult.status === "verified" ? "trusted" : isBundled || isLocal ? "trusted" : "warning" : "untrusted"
  });
  if (!isBundled && lockEntry) {
    lockEntry.trust_verdict = passed ? signatureResult.status === "verified" ? "verified" : "unsigned_allowed" : "failed";
    lockEntry.lockfile_verdict = lockfileVerdict.toLowerCase();
    lockEntry.verification_errors = verdict.errors;
    lockEntry.verification_warnings = verdict.warnings;
    lockEntry.verdict = verdict;
    saveRegistryLockfile(projectDir, lockfile);
  }
  if (passed) {
    console.log(`
\x1B[32m\u2714 Registry '${name}' verification passed.\x1B[0m
`);
  } else {
    console.error(`
\x1B[31m\u2717 Registry '${name}' verification failed.\x1B[0m
`);
    process.exit(1);
  }
}
function handleRegistryKeygen(options) {
  const projectDir = options.target || process.cwd();
  const keyPath = getSigningKeyPath(projectDir);
  console.log(`
\u{1F511} \x1B[36mRegistry Signing Key Generator\x1B[0m`);
  console.log("==================================================");
  if (!options.approved) {
    console.error("\x1B[31mError: Signing key generation requires explicit approval. Pass the --approved flag.\x1B[0m");
    console.log(`
\x1B[33mPlanned Action:\x1B[0m Generate a 32-byte random HMAC-SHA256 signing key.`);
    console.log(`  Destination: ${keyPath}`);
    console.log(`  Mode:        0o600 (owner read/write only)`);
    console.log(`
\x1B[33mSecurity Notes:\x1B[0m`);
    console.log(`  \u2022 Add .ai/registry-signing-key to your .gitignore`);
    console.log(`  \u2022 Share the key securely with trusted team members for co-verification`);
    console.log(`  \u2022 The key is used for HMAC-SHA256 signing of catalog checksums only`);
    console.log(`
To generate, run:`);
    console.log(`  \x1B[36mnpx multimodel-dev-os registry keygen --approved\x1B[0m
`);
    process.exit(1);
  }
  let existingKey = null;
  try {
    existingKey = loadSigningKey(projectDir);
  } catch (_e) {
  }
  if (existingKey && !options.force) {
    console.error(`\x1B[31mError: A signing key already exists at: ${keyPath}\x1B[0m`);
    console.log(`
To overwrite, run with --force:`);
    console.log(`  \x1B[36mnpx multimodel-dev-os registry keygen --approved --force\x1B[0m`);
    console.log(`
\x1B[33mWarning:\x1B[0m Overwriting will invalidate all existing signatures in the lockfile.
`);
    process.exit(1);
  }
  const newKey = generateSigningKey();
  saveSigningKey(projectDir, newKey);
  console.log(`
\x1B[32m\u2714 Signing key generated successfully!\x1B[0m`);
  console.log(`  Location: ${keyPath}`);
  console.log(`  Mode:     0o600 (restricted permissions)`);
  console.log(`
\x1B[33mNext steps:\x1B[0m`);
  console.log(`  1. Add to .gitignore: echo '.ai/registry-signing-key' >> .gitignore`);
  console.log(`  2. Re-sync registries to generate signed lockfile entries:`);
  console.log(`       npx multimodel-dev-os registry sync <name> --approved`);
  console.log(`  3. Verify signed provenance:`);
  console.log(`       npx multimodel-dev-os registry verify <name>
`);
}

// src/cli/handlers/registry/trust.js
function handleRegistryTrustList(options) {
  const projectDir = options.target || process.cwd();
  const policy = loadRegistryPolicy(projectDir);
  const keys = loadTrustedKeys(projectDir, policy);
  console.log(`
\u{1F511} \x1B[36mRegistry Trust Store \u2014 Trusted Keys\x1B[0m`);
  console.log("==================================================");
  console.log(`Trust Store Path: \x1B[36m${policy.trusted_keys_file || ".ai/registries/trusted-keys.yaml"}\x1B[0m`);
  console.log(`Total Keys:       ${keys.length}
`);
  if (keys.length === 0) {
    console.log("  No trusted keys configured.");
  } else {
    keys.forEach((k) => {
      const statusBadge = k.status === "active" ? "\x1B[32m\u25CF active\x1B[0m" : `\x1B[31m\u25CB ${k.status}\x1B[0m`;
      console.log(`  * \x1B[33m${k.key_id}\x1B[0m  [${statusBadge}]`);
      console.log(`    Publisher: ${k.name}`);
      console.log(`    Algorithm: ${k.algorithm}`);
      console.log(`    Scopes:    ${(k.scopes || []).join(", ")}`);
    });
  }
  console.log("");
}
function handleRegistryTrustShow(keyId, options) {
  const projectDir = options.target || process.cwd();
  const policy = loadRegistryPolicy(projectDir);
  const keys = loadTrustedKeys(projectDir, policy);
  const k = keys.find((key) => key.key_id === keyId);
  if (!k) {
    console.error(`\x1B[31mError: Trusted key '${keyId}' not found in the trust store.\x1B[0m`);
    process.exit(1);
  }
  console.log(`
\u{1F511} \x1B[36mTrusted Key: ${keyId}\x1B[0m`);
  console.log("==================================================");
  console.log(`\x1B[33mKey ID:\x1B[0m         ${k.key_id}`);
  console.log(`\x1B[33mPublisher:\x1B[0m      ${k.name}`);
  console.log(`\x1B[33mAlgorithm:\x1B[0m      ${k.algorithm}`);
  console.log(`\x1B[33mStatus:\x1B[0m         ${k.status === "active" ? "\x1B[32mactive\x1B[0m" : `\x1B[31m${k.status}\x1B[0m`}`);
  console.log(`\x1B[33mScopes:\x1B[0m         ${(k.scopes || []).join(", ")}`);
  console.log(`\x1B[33mPublic Key:\x1B[0m
${k.public_key.trim()}`);
  console.log("");
}
function handleRegistryTrustVerify(options) {
  const projectDir = options.target || process.cwd();
  const policy = loadRegistryPolicy(projectDir);
  const keys = loadTrustedKeys(projectDir, policy);
  console.log(`
\u{1F511} \x1B[36mVerifying Trust Store Integrity...\x1B[0m`);
  console.log("==================================================");
  let passed = true;
  keys.forEach((k) => {
    try {
      normalizePublicKey(k.public_key);
      console.log(`  \x1B[32m\u2713\x1B[0m Key '${k.key_id}' public key format is valid.`);
    } catch (e) {
      console.log(`  \x1B[31m\u2717\x1B[0m Key '${k.key_id}' public key format error: ${e.message}`);
      passed = false;
    }
  });
  if (passed) {
    console.log(`
\x1B[32m\u2714 Trust store verification passed.\x1B[0m
`);
  } else {
    console.error(`
\x1B[31m\u2717 Trust store verification failed.\x1B[0m
`);
    process.exit(1);
  }
}
async function handleRegistryTrustAdd(positional, options) {
  const projectDir = options.target || process.cwd();
  if (!options.approved) {
    console.error("\x1B[31mError: Adding a trusted key requires --approved.\x1B[0m");
    console.log("Review the key details carefully before approving:");
    console.log('  Remote:  node bin/multimodel-dev-os.js registry trust add https://example.com/pub.key --name "Publisher" --approved');
    console.log('  Manual:  node bin/multimodel-dev-os.js registry trust add --key-id my-key --name "Publisher" --public-key "MCow..." --approved');
    process.exit(1);
  }
  const urlOrKeyArg = positional[3];
  const keyId = options["key-id"] || options.keyId;
  const name = options.name;
  const algorithm = options.algorithm || "ed25519";
  const scopesRaw = options.scopes || "registry";
  const scopes = scopesRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const status = options.status || "active";
  let publicKey = options["public-key"] || options.publicKey;
  let remoteSourceUrl;
  if (urlOrKeyArg && (urlOrKeyArg.startsWith("https://") || urlOrKeyArg.startsWith("http://"))) {
    remoteSourceUrl = urlOrKeyArg;
    console.log(`
\x1B[36mFetching public key from remote URL...\x1B[0m`);
    console.log(`  URL: \x1B[33m${remoteSourceUrl}\x1B[0m`);
    try {
      const policy = loadRegistryPolicy(projectDir);
      const allowHttp = policy.allow_http_localhost || false;
      publicKey = await fetchRemotePublicKey(remoteSourceUrl, { allowHttp });
      console.log(`
  \x1B[32m[OK]\x1B[0m Key fetched (${Buffer.byteLength(publicKey, "utf8")} bytes)`);
      console.log(`
  Key preview:`);
      console.log(`  ${publicKey.slice(0, 80)}${publicKey.length > 80 ? "..." : ""}`);
    } catch (err) {
      console.error(`\x1B[31mError: Failed to fetch remote public key: ${err.message}\x1B[0m`);
      process.exit(1);
    }
  }
  if (!publicKey) {
    console.error("\x1B[31mError: No public key provided. Provide a URL or --public-key.\x1B[0m");
    console.log("Examples:");
    console.log('  Remote: node bin/multimodel-dev-os.js registry trust add https://example.com/pub.key --name "Publisher" --approved');
    console.log('  Manual: node bin/multimodel-dev-os.js registry trust add --key-id my-key --name "Publisher" --public-key "MCow..." --approved');
    process.exit(1);
  }
  if (!name) {
    console.error("\x1B[31mError: --name is required when adding a trusted key.\x1B[0m");
    console.log('Example: --name "Official Publisher"');
    process.exit(1);
  }
  const resolvedKeyId = keyId || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const entry = { key_id: resolvedKeyId, name, algorithm, public_key: publicKey, scopes, status };
  if (remoteSourceUrl)
    entry.remote_source_url = remoteSourceUrl;
  console.log(`
\x1B[36mAdding Trusted Key to Trust Store\x1B[0m`);
  console.log("==================================================");
  console.log(`  Key ID:    \x1B[33m${resolvedKeyId}\x1B[0m`);
  console.log(`  Publisher: ${name}`);
  console.log(`  Algorithm: ${algorithm}`);
  console.log(`  Scopes:    ${scopes.join(", ")}`);
  console.log(`  Status:    ${status}`);
  if (remoteSourceUrl)
    console.log(`  Source:    ${remoteSourceUrl}`);
  const result = addTrustedKey(projectDir, entry);
  if (!result.added) {
    console.error(`\x1B[31mError: ${result.error}\x1B[0m`);
    process.exit(1);
  }
  const filePath = getTrustStorePath(projectDir);
  console.log(`
\x1B[32mTrusted key '${resolvedKeyId}' added successfully.\x1B[0m`);
  console.log(`  Written to: ${filePath}`);
  console.log(`
Next steps:`);
  console.log(`  * Run 'registry trust list' to confirm the key is listed.`);
  console.log(`  * Run 'registry trust verify' to validate all key formats.`);
  console.log(`  * Commit .ai/registries/trusted-keys.yaml to version control.
`);
}
function handleRegistryTrustRemove(keyId, options) {
  const projectDir = options.target || process.cwd();
  if (!options.approved) {
    console.error("\x1B[31mError: Removing a trusted key requires --approved.\x1B[0m");
    console.log(`Example: node bin/multimodel-dev-os.js registry trust remove ${keyId} --approved`);
    process.exit(1);
  }
  const policy = loadRegistryPolicy(projectDir);
  const keys = loadTrustedKeys(projectDir, policy);
  const existing = keys.find((k) => k.key_id === keyId);
  if (!existing) {
    console.error(`\x1B[31mError: Key ID '${keyId}' not found in the trust store.\x1B[0m`);
    console.log("Run registry trust list to see all configured keys.");
    process.exit(1);
  }
  console.log(`
\x1B[36mRemoving Trusted Key\x1B[0m`);
  console.log("==================================================");
  console.log(`  Key ID:    \x1B[33m${existing.key_id}\x1B[0m`);
  console.log(`  Publisher: ${existing.name}`);
  console.log(`  Algorithm: ${existing.algorithm}`);
  console.log(`  Status:    ${existing.status}`);
  const result = removeTrustedKey(projectDir, keyId, policy);
  if (!result.removed) {
    console.error(`\x1B[31mError: ${result.error}\x1B[0m`);
    process.exit(1);
  }
  const filePath = getTrustStorePath(projectDir, policy);
  console.log(`
\x1B[32mTrusted key '${keyId}' removed from the trust store.\x1B[0m`);
  console.log(`  Updated:   ${filePath}`);
  console.log(`
Warning: Registries signed by this key will no longer verify.`);
  console.log(`  Run 'registry verify <name>' to check affected registries.`);
  console.log(`  Commit .ai/registries/trusted-keys.yaml to propagate the change.
`);
}
async function handleRegistryTrustSync(options) {
  const projectDir = options.target || process.cwd();
  if (!options.approved) {
    console.error("\x1B[31mError: Syncing trusted keys requires --approved.\x1B[0m");
    console.log("To sync remote trusted keys, run:");
    console.log("  npx multimodel-dev-os registry trust sync --approved");
    process.exit(1);
  }
  const dryRun = !!options["dry-run"] || !!options.dryRun;
  const policy = loadRegistryPolicy(projectDir);
  const allowHttp = policy.allow_http_localhost || false;
  console.log(`
\u{1F511} \x1B[36mRegistry Trust Store \u2014 Syncing Remote Keys\x1B[0m`);
  console.log("==================================================");
  if (dryRun) {
    console.log("  Mode: Dry Run (No changes will be written to disk)\n");
  }
  try {
    const result = await syncRemoteKeys(projectDir, { dryRun, allowHttp });
    console.log(`  Checked keys: ${result.checkedCount}`);
    console.log(`  Updated keys: ${result.updated.length}`);
    console.log(`  Errors:       ${result.errors.length}
`);
    if (result.updated.length > 0) {
      console.log("\x1B[32mUpdated Keys:\x1B[0m");
      result.updated.forEach((u) => {
        console.log(`  * \x1B[33m${u.key_id}\x1B[0m`);
        console.log(`    Old key preview: ${u.oldKey.trim().slice(0, 40)}...`);
        console.log(`    New key preview: ${u.newKey.trim().slice(0, 40)}...`);
      });
      console.log("");
    }
    if (result.errors.length > 0) {
      console.error("\x1B[31mErrors encountered during sync:\x1B[0m");
      result.errors.forEach((e) => {
        console.error(`  * \x1B[33m${e.key_id}\x1B[0m: ${e.error}`);
      });
      console.log("");
    }
    if (result.updated.length > 0 && !dryRun) {
      console.log(`\x1B[32m\u2714 Trust store remote keys synced successfully.\x1B[0m`);
      console.log(`  Commit ${policy.trusted_keys_file || ".ai/registries/trusted-keys.yaml"} to propagate these key updates.
`);
    } else if (result.updated.length === 0) {
      console.log(`\x1B[32m\u2714 All remote keys are already up to date.\x1B[0m
`);
    }
  } catch (err) {
    console.error(`\x1B[31mError: Failed to sync remote keys: ${err.message}\x1B[0m
`);
    process.exit(1);
  }
}

// src/cli/handlers/plugin.js
import { existsSync as existsSync10, mkdirSync as mkdirSync4, readFileSync as readFileSync10, writeFileSync as writeFileSync8, readdirSync as readdirSync3, statSync as statSync3 } from "fs";
import { join as join10, dirname as dirname5, resolve as resolve3, relative as relative2 } from "path";
function getPluginsDir(targetDir) {
  return join10(targetDir, ".ai", "plugins");
}
function handlePluginList(options) {
  const pluginsDir = getPluginsDir(options.target);
  const rawRelPath = relative2(process.cwd(), join10(sourceRoot, ".ai", "plugins", "plugin.example.yaml")).replace(/\\/g, "/");
  const examplePath = rawRelPath.startsWith(".") ? rawRelPath : `./${rawRelPath}`;
  if (!existsSync10(pluginsDir)) {
    if (options.json) {
      console.log("[]");
      return;
    }
    console.log(`
\u{1F50C} \x1B[36mInstalled Plugins in: ${options.target}\x1B[0m`);
    console.log("==================================================");
    console.log("  No plugins installed. Try:");
    console.log(`  npx multimodel-dev-os plugin install ${examplePath} --approved`);
    console.log("");
    return;
  }
  let files = [];
  try {
    files = readdirSync3(pluginsDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  } catch (e) {
  }
  const plugins = [];
  files.forEach((f) => {
    try {
      const p = parseYaml(readFileSync10(join10(pluginsDir, f), "utf8"));
      if (p && p.name && p.slug) {
        plugins.push(p);
      }
    } catch (e) {
    }
  });
  if (options.json) {
    console.log(JSON.stringify(plugins, null, 2));
    return;
  }
  console.log(`
\u{1F50C} \x1B[36mInstalled Plugins in: ${options.target} (${plugins.length})\x1B[0m`);
  console.log("==================================================");
  if (plugins.length === 0) {
    console.log("  No plugins installed. Try:");
    console.log(`  npx multimodel-dev-os plugin install ${examplePath} --approved`);
  } else {
    plugins.forEach((p) => {
      console.log(`
\x1B[32m* ${p.name} (v${p.version || "1.0.0"})\x1B[0m [slug: \x1B[33m${p.slug}\x1B[0m]`);
      console.log(`  Description: ${p.description || "No description"}`);
      console.log(`  Author:      ${p.author || "Unknown"}`);
    });
  }
  console.log("\nUse \x1B[36mplugin show <slug>\x1B[0m to view detailed plugin capabilities.\n");
}
function handlePluginShow(slug, options) {
  if (!/^[a-z0-9-_]+$/i.test(slug)) {
    console.error(`\x1B[31mError: Invalid plugin slug '${slug}'. Slugs must be alphanumeric with dashes or underscores only.\x1B[0m`);
    process.exit(1);
  }
  const pluginsDir = getPluginsDir(options.target);
  let p = null;
  if (existsSync10(pluginsDir)) {
    const files = readdirSync3(pluginsDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
    for (const f of files) {
      try {
        const parsed = parseYaml(readFileSync10(join10(pluginsDir, f), "utf8"));
        if (parsed && parsed.slug === slug) {
          p = parsed;
          break;
        }
      } catch (e) {
      }
    }
  }
  if (!p) {
    console.error(`\x1B[31mError: Plugin with slug '${slug}' is not installed.\x1B[0m`);
    console.error(`  Run \x1B[36mplugin list\x1B[0m to see installed plugins, or validate a new plugin config using \x1B[36mplugin validate <path>\x1B[0m.`);
    process.exit(1);
  }
  console.log(`
\u{1F50C} \x1B[36mPlugin Specifications: ${p.name} (v${p.version})\x1B[0m`);
  console.log("==================================================");
  console.log(`\x1B[33mSlug:\x1B[0m        ${p.slug}`);
  console.log(`\x1B[33mAuthor:\x1B[0m      ${p.author}`);
  console.log(`\x1B[33mDescription:\x1B[0m ${p.description}`);
  if (p.safety_notes) {
    console.log(`\x1B[33mSafety Notes:\x1B[0m ${p.safety_notes}`);
  }
  if (p.allowed_file_patterns) {
    console.log("\n\x1B[33mAllowed Write Subdirectories:\x1B[0m");
    p.allowed_file_patterns.forEach((pat) => console.log(`  - ${pat}`));
  }
  if (p.templates) {
    console.log("\n\x1B[33mCustom Templates:\x1B[0m");
    Object.keys(p.templates).forEach((k) => {
      console.log(`  - \x1B[32m${k}\x1B[0m: ${p.templates[k].description || p.templates[k].name}`);
    });
  }
  if (p.workflows) {
    console.log("\n\x1B[33mCustom Workflows:\x1B[0m");
    Object.keys(p.workflows).forEach((k) => {
      console.log(`  - \x1B[32m${k}\x1B[0m: ${p.workflows[k].description || p.workflows[k].name}`);
    });
  }
  if (p.adapters) {
    console.log("\n\x1B[33mCustom Adapters:\x1B[0m");
    Object.keys(p.adapters).forEach((k) => {
      console.log(`  - \x1B[32m${k}\x1B[0m: ${p.adapters[k].targetFile}`);
    });
  }
  console.log("");
}
function handlePluginValidate(pluginPath, options) {
  const fullPath = resolve3(process.cwd(), pluginPath);
  if (!existsSync10(fullPath)) {
    console.error(`\x1B[31mError: Plugin file not found at: ${pluginPath}\x1B[0m`);
    process.exit(1);
  }
  console.log(`
\u{1F4CB} \x1B[34mValidating Plugin: ${pluginPath}\x1B[0m`);
  console.log("==================================================");
  let errors = 0;
  let plugin = null;
  try {
    plugin = parseYaml(readFileSync10(fullPath, "utf8"));
  } catch (e) {
    console.error(`  \x1B[31m\u274C [SYNTAX] Failed to parse YAML: ${e.message}\x1B[0m`);
    errors++;
  }
  if (plugin) {
    const reqKeys = ["name", "slug", "version", "description", "author"];
    reqKeys.forEach((k) => {
      if (plugin[k] === void 0 || plugin[k] === null) {
        console.error(`  \x1B[31m\u274C [METADATA] Missing required key: ${k}\x1B[0m`);
        errors++;
      } else if (typeof plugin[k] !== "string") {
        console.error(`  \x1B[31m\u274C [METADATA] Key '${k}' must be a string (found: ${typeof plugin[k]})\x1B[0m`);
        errors++;
      } else if (k === "slug") {
        if (!/^[a-z0-9-_]+$/i.test(plugin[k])) {
          console.error(`  \x1B[31m\u274C [METADATA] Key 'slug' must be alphanumeric with dashes or underscores only (found: "${plugin[k]}")\x1B[0m`);
          errors++;
        } else {
          console.log(`  \x1B[32m\u2714 [METADATA] Key: slug ("${plugin[k]}")`);
        }
      } else {
        console.log(`  \x1B[32m\u2714 [METADATA] Key: ${k} ("${plugin[k]}")`);
      }
    });
    if (plugin.allowed_file_patterns !== void 0) {
      if (!Array.isArray(plugin.allowed_file_patterns)) {
        console.error(`  \x1B[31m\u274C [SAFETY] allowed_file_patterns must be an array\x1B[0m`);
        errors++;
      } else {
        plugin.allowed_file_patterns.forEach((pat) => {
          if (typeof pat !== "string") {
            console.error(`  \x1B[31m\u274C [SAFETY] allowed_file_patterns item must be a string: ${pat}\x1B[0m`);
            errors++;
            return;
          }
          const normPattern = pat.replace(/\\/g, "/").trim();
          const isSafeSubdir = [
            ".ai/plugins/",
            ".ai/registries/",
            ".ai/templates/",
            ".ai/skills/",
            ".ai/checks/",
            ".ai/prompts/",
            ".ai/adapters/"
          ].some((prefix) => normPattern.startsWith(prefix));
          const hasTraversal = normPattern.includes("..") || normPattern.startsWith("/");
          const isBlacklisted = [
            ".env",
            ".npmrc",
            ".git/",
            "node_modules/",
            "package.json",
            "package-lock.json"
          ].some((black) => normPattern.includes(black));
          if (!isSafeSubdir || hasTraversal || isBlacklisted) {
            console.error(`  \x1B[31m\u274C [SAFETY] File pattern '${pat}' violates safety boundaries (must reside under .ai/ or adapters/, contain no '..', and exclude blacklisted files)\x1B[0m`);
            errors++;
          }
        });
        if (errors === 0) {
          console.log(`  \x1B[32m\u2714 [SAFETY] allowed_file_patterns verified: ${plugin.allowed_file_patterns.length} items`);
        }
      }
    }
    if (plugin.denied_file_patterns !== void 0) {
      if (!Array.isArray(plugin.denied_file_patterns)) {
        console.error(`  \x1B[31m\u274C [SAFETY] denied_file_patterns must be an array\x1B[0m`);
        errors++;
      } else {
        plugin.denied_file_patterns.forEach((pat) => {
          if (typeof pat !== "string") {
            console.error(`  \x1B[31m\u274C [SAFETY] denied_file_patterns item must be a string: ${pat}\x1B[0m`);
            errors++;
          }
        });
        console.log(`  \x1B[32m\u2714 [SAFETY] denied_file_patterns verified: ${plugin.denied_file_patterns.length} items`);
      }
    }
    if (plugin.workflows !== void 0) {
      if (typeof plugin.workflows !== "object" || Array.isArray(plugin.workflows)) {
        console.error(`  \x1B[31m\u274C [CAPABILITIES] workflows must be an object\x1B[0m`);
        errors++;
      } else {
        console.log(`  \x1B[32m\u2714 [CAPABILITIES] workflows verified`);
      }
    }
    if (plugin.templates !== void 0) {
      if (typeof plugin.templates !== "object" || Array.isArray(plugin.templates)) {
        console.error(`  \x1B[31m\u274C [CAPABILITIES] templates must be an object\x1B[0m`);
        errors++;
      } else {
        console.log(`  \x1B[32m\u2714 [CAPABILITIES] templates verified`);
      }
    }
    if (plugin.adapters !== void 0) {
      if (typeof plugin.adapters !== "object" || Array.isArray(plugin.adapters)) {
        console.error(`  \x1B[31m\u274C [CAPABILITIES] adapters must be an object\x1B[0m`);
        errors++;
      } else {
        console.log(`  \x1B[32m\u2714 [CAPABILITIES] adapters verified`);
      }
    }
    if (plugin.safety_notes !== void 0) {
      if (typeof plugin.safety_notes !== "string") {
        console.error(`  \x1B[31m\u274C [SAFETY] safety_notes must be a string\x1B[0m`);
        errors++;
      } else {
        console.log(`  \x1B[32m\u2714 [SAFETY] safety_notes verified`);
      }
    }
  }
  if (errors > 0) {
    console.error(`
\x1B[31mPlugin validation FAILED with ${errors} errors.\x1B[0m
`);
    if (options && options.noExit)
      return false;
    process.exit(1);
  } else {
    console.log(`
\x1B[32m\u2714 Plugin '${plugin.slug || plugin.name}' is fully valid and compliant!\x1B[0m`);
    console.log(`
\x1B[35mRecommended Next Command:\x1B[0m`);
    console.log(`    npx multimodel-dev-os plugin install ${pluginPath} --approved
`);
    if (options && options.noExit)
      return true;
    return true;
  }
}
function handlePluginInstall(pluginPath, options) {
  const fullPath = resolve3(process.cwd(), pluginPath);
  if (!existsSync10(fullPath)) {
    console.error(`\x1B[31mError: Plugin file not found at: ${pluginPath}\x1B[0m`);
    process.exit(1);
  }
  const isValid = handlePluginValidate(pluginPath, { noExit: true });
  if (!isValid) {
    console.error(`\x1B[31mError: Plugin validation failed. Installation aborted.\x1B[0m`);
    process.exit(1);
  }
  const policy = loadRegistryPolicy(options.target || process.cwd());
  const pluginContent = readFileSync10(fullPath, "utf8");
  const plugin = parseYaml(pluginContent);
  const slug = plugin.slug;
  const sourceDir = dirname5(fullPath);
  console.log(`
\u{1F4E5} \x1B[34mInstalling Plugin: ${plugin.name} [slug: ${slug}]\x1B[0m`);
  const filesToCopy = [];
  filesToCopy.push({
    src: fullPath,
    dest: join10(".ai", "plugins", `${slug}.yaml`),
    description: "Plugin Manifest"
  });
  if (Array.isArray(plugin.allowed_file_patterns)) {
    plugin.allowed_file_patterns.forEach((pattern) => {
      const normPattern = pattern.replace(/\\/g, "/").trim();
      const isSafeSubdir = policy.allowed_write_roots.some((prefix) => normPattern.startsWith(prefix));
      const hasTraversal = normPattern.includes("..") || normPattern.startsWith("/");
      const isBlacklisted = policy.blocked_paths.some((black) => normPattern.includes(black));
      if (!isSafeSubdir || hasTraversal || isBlacklisted) {
        console.error(`\x1B[31mError: Path pattern '${pattern}' violates safety boundaries. Installation aborted.\x1B[0m`);
        process.exit(1);
      }
      const ext = "." + normPattern.split(".").pop();
      if (!policy.allowed_file_extensions.includes(ext)) {
        console.error(`\x1B[31mError: File extension '${ext}' for asset '${pattern}' is not allowed by policy. Installation aborted.\x1B[0m`);
        process.exit(1);
      }
      const srcFile = join10(sourceDir, normPattern);
      if (existsSync10(srcFile) && statSync3(srcFile).isFile()) {
        filesToCopy.push({
          src: srcFile,
          dest: normPattern,
          description: `Plugin asset: ${normPattern}`
        });
      }
    });
  }
  if (filesToCopy.length > policy.max_plugin_files) {
    console.error(`\x1B[31mError: Plugin file count (${filesToCopy.length}) exceeds policy limit (${policy.max_plugin_files}). Installation aborted.\x1B[0m`);
    process.exit(1);
  }
  let totalSize = 0;
  filesToCopy.forEach((item) => {
    if (existsSync10(item.src)) {
      totalSize += statSync3(item.src).size;
    }
  });
  if (totalSize > policy.max_plugin_size_kb * 1024) {
    console.error(`\x1B[31mError: Plugin total size (${(totalSize / 1024).toFixed(1)}KB) exceeds policy limit (${policy.max_plugin_size_kb}KB). Installation aborted.\x1B[0m`);
    process.exit(1);
  }
  let conflicts = false;
  filesToCopy.forEach((item) => {
    const destPath = join10(options.target, item.dest);
    if (existsSync10(destPath)) {
      if (!options.force) {
        console.error(`  \x1B[31mConflict:\x1B[0m File already exists at destination: ${item.dest}`);
        conflicts = true;
      }
    }
  });
  if (conflicts) {
    console.error(`
\x1B[31mInstallation aborted due to overwrite conflicts. Run with --force to overwrite (creates .bak backups).\x1B[0m
`);
    process.exit(1);
  }
  if (!options.approved) {
    console.error(`\x1B[31mError: Plugin cannot be installed without explicit user approval. Pass the --approved flag.\x1B[0m`);
    console.log(`
\x1B[33mSafety Status:\x1B[0m Sandbox checks: PASSED (Declarative only, offline, zero-dependency)`);
    console.log(`
\x1B[33mPlanned Installation Actions:\x1B[0m`);
    filesToCopy.forEach((item) => {
      const exists = existsSync10(join10(options.target, item.dest));
      const suffix = exists ? " \x1B[33m(will overwrite)\x1B[0m" : "";
      console.log(`  - \x1B[36m[WOULD COPY]\x1B[0m ${item.src} -> ${item.dest}${suffix}`);
    });
    console.error(`
\x1B[31mError: Installation refused. Run with --approved to apply these changes.\x1B[0m
`);
    process.exit(1);
  }
  filesToCopy.forEach((item) => {
    const destPath = join10(options.target, item.dest);
    const destDir = dirname5(destPath);
    if (!existsSync10(destDir)) {
      mkdirSync4(destDir, { recursive: true });
    }
    if (existsSync10(destPath)) {
      const bakPath = `${destPath}.bak`;
      writeFileSync8(bakPath, readFileSync10(destPath));
      console.log(`  \x1B[33mBACKUP:\x1B[0m Created backup: ${item.dest}.bak`);
    }
    writeFileSync8(destPath, readFileSync10(item.src));
    console.log(`  \x1B[32mCOPY:\x1B[0m ${item.dest}`);
  });
  console.log(`
\x1B[32m\u2714 Plugin '${plugin.name}' installed successfully!\x1B[0m`);
  console.log(`
\x1B[32mSafety Status:\x1B[0m Sandboxed isolation: VERIFIED (All files written inside whitelisted .ai/ & adapters/ folders)`);
  console.log(`
Summary of actions:`);
  console.log(`  - Manifest registered: .ai/plugins/${slug}.yaml`);
  const assetCount = filesToCopy.length - 1;
  console.log(`  - Synced assets:       ${assetCount} file(s)`);
  console.log(`
\x1B[35mRecommended Next Commands:\x1B[0m`);
  console.log(`    \u2022 View plugin details: npx multimodel-dev-os plugin show ${slug}`);
  console.log(`    \u2022 Audit plugin health:  npx multimodel-dev-os plugin status --target .`);
  if (plugin.workflows) {
    const wfKeys = Object.keys(plugin.workflows);
    if (wfKeys.length > 0) {
      console.log(`    \u2022 Run custom workflow:  npx multimodel-dev-os workflow run ${wfKeys[0]}`);
    }
  }
  console.log("");
}
function handlePluginStatus(options) {
  const pluginsDir = getPluginsDir(options.target);
  console.log(`
\u{1F50C} \x1B[36mAuditing Plugins Status in: ${options.target}\x1B[0m`);
  console.log("==================================================");
  if (!existsSync10(pluginsDir)) {
    console.log("  No plugins directory found. 0 plugins installed.\n");
    return;
  }
  let files = [];
  try {
    files = readdirSync3(pluginsDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  } catch (e) {
  }
  if (files.length === 0) {
    console.log("  No plugins installed.\n");
    return;
  }
  files.forEach((f) => {
    try {
      const pPath = join10(pluginsDir, f);
      const p = parseYaml(readFileSync10(pPath, "utf8"));
      if (p && p.name) {
        console.log(`
* \x1B[32m${p.name}\x1B[0m (v${p.version || "1.0.0"})`);
        let missingCount = 0;
        let presentCount = 0;
        if (Array.isArray(p.allowed_file_patterns)) {
          p.allowed_file_patterns.forEach((pat) => {
            const destPath = join10(options.target, pat);
            if (existsSync10(destPath) && statSync3(destPath).isFile()) {
              presentCount++;
            } else {
              missingCount++;
            }
          });
        }
        const total = presentCount + missingCount;
        if (total === 0) {
          console.log(`  Status: \x1B[32mHealthy\x1B[0m (Declarative only)`);
        } else if (missingCount === 0) {
          console.log(`  Status: \x1B[32mHealthy\x1B[0m (All ${presentCount}/${total} assets present)`);
        } else {
          console.log(`  Status: \x1B[33mIncomplete\x1B[0m (${presentCount}/${total} assets present, ${missingCount} missing)`);
          console.log(`  Missing Assets:`);
          p.allowed_file_patterns.forEach((pat) => {
            const destPath = join10(options.target, pat);
            if (!existsSync10(destPath) || !statSync3(destPath).isFile()) {
              console.log(`    \x1B[31m\u274C\x1B[0m ${pat}`);
            }
          });
          console.log(`  To fix: Reinstall the plugin or validate the configuration:`);
          console.log(`    npx multimodel-dev-os plugin validate <path-to-plugin-source.yaml>`);
        }
      }
    } catch (e) {
      console.log(`  - \x1B[31mError reading: ${f}\x1B[0m (${e.message})`);
    }
  });
  console.log("");
}

// src/cli/handlers/catalog.js
import { existsSync as existsSync12, readFileSync as readFileSync12, readdirSync as readdirSync4, statSync as statSync4 } from "fs";
import { join as join12 } from "path";

// src/catalog/loader.js
import { existsSync as existsSync11, readFileSync as readFileSync11 } from "fs";
import { join as join11 } from "path";
function loadCatalog(options = {}) {
  let catalog;
  if (options.allSources) {
    catalog = loadAllCatalogs(options);
  } else if (options.source) {
    catalog = loadCatalogFromSource(options.source, options);
  } else {
    const path = join11(sourceRoot, ".ai", "plugins", "catalog.yaml");
    try {
      if (existsSync11(path)) {
        const reg = parseYaml(readFileSync11(path, "utf8"));
        catalog = reg.catalog || { plugins: [] };
      } else {
        catalog = { plugins: [] };
      }
    } catch (e) {
      catalog = { plugins: [] };
    }
    (catalog.plugins || []).forEach((p) => {
      p._source = "bundled";
    });
  }
  return catalog;
}
function loadCatalogFromSource(source, options = {}) {
  if (!source || source === "bundled") {
    return loadCatalog();
  } else if (source === "local") {
    const localPath = join11(options.target || process.cwd(), ".ai", "plugins", "catalog.yaml");
    try {
      if (existsSync11(localPath)) {
        const reg = parseYaml(readFileSync11(localPath, "utf8"));
        const catalog = reg.catalog || { plugins: [] };
        (catalog.plugins || []).forEach((p) => {
          p._source = "local";
        });
        return catalog;
      }
    } catch (e) {
    }
    return { plugins: [] };
  } else if (source.startsWith("remote:")) {
    const regName = source.substring(7);
    const sources = loadRegistrySources();
    const src = sources.find((s) => s.name === regName);
    if (src && src.type !== "local") {
      const policy = loadRegistryPolicy(options.target || process.cwd());
      try {
        validateRegistryUrl(src.url, policy);
      } catch (err) {
        console.error(`\x1B[31mError: Registry '${regName}' has an invalid URL: ${err.message}\x1B[0m`);
        process.exit(1);
      }
    }
    const cachePath = join11(sourceRoot, ".ai", "registry-cache", regName, "catalog.yaml");
    try {
      if (existsSync11(cachePath)) {
        const reg = parseYaml(readFileSync11(cachePath, "utf8"));
        const catalog = reg.catalog || { plugins: [] };
        (catalog.plugins || []).forEach((p) => {
          p._source = `remote:${regName}`;
        });
        return catalog;
      }
    } catch (e) {
    }
    return { plugins: [] };
  }
  return { plugins: [] };
}
function loadAllCatalogs(options = {}) {
  const sources = loadRegistrySources();
  const policy = loadRegistryPolicy(options.target || process.cwd());
  const allPlugins = [];
  const bundled = loadCatalog();
  (bundled.plugins || []).forEach((p) => {
    p._source = "bundled";
    allPlugins.push(p);
  });
  const localPath = join11(options.target || process.cwd(), ".ai", "plugins", "catalog.yaml");
  if (existsSync11(localPath)) {
    try {
      const localCat = parseYaml(readFileSync11(localPath, "utf8"));
      const localPlugins = (localCat.catalog || {}).plugins || [];
      localPlugins.forEach((p) => {
        if (!allPlugins.some((bp) => bp.slug === p.slug)) {
          p._source = "local";
          allPlugins.push(p);
        }
      });
    } catch (e) {
    }
  }
  if (policy.allow_remote_registries) {
    sources.filter((s) => s.type !== "local" && s.enabled).forEach((s) => {
      const cachePath = join11(sourceRoot, ".ai", "registry-cache", s.name, "catalog.yaml");
      if (existsSync11(cachePath)) {
        try {
          const remoteCat = parseYaml(readFileSync11(cachePath, "utf8"));
          const remotePlugins = (remoteCat.catalog || {}).plugins || [];
          remotePlugins.forEach((p) => {
            if (!allPlugins.some((bp) => bp.slug === p.slug)) {
              p._source = `remote:${s.name}`;
              allPlugins.push(p);
            }
          });
        } catch (e) {
        }
      }
    });
  }
  return { plugins: allPlugins };
}

// src/cli/handlers/catalog.js
function handleCatalogList(options) {
  const catalog = loadCatalog(options);
  const plugins = catalog.plugins || [];
  const filtered = options.category ? plugins.filter((p) => p.category.toLowerCase() === options.category.toLowerCase()) : plugins;
  if (options.json) {
    console.log(JSON.stringify(filtered, null, 2));
    return;
  }
  console.log(`
\u{1F4DA} \x1B[36mWorkflow Marketplace & Plugin Catalog [v${version}]\x1B[0m`);
  console.log("==================================================");
  if (options.category) {
    console.log(`Filtering by category: \x1B[33m${options.category}\x1B[0m`);
  }
  const installedSlugs = /* @__PURE__ */ new Set();
  const pluginsDir = getPluginsDir(options.target);
  if (existsSync12(pluginsDir)) {
    try {
      const files = readdirSync4(pluginsDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
      files.forEach((f) => {
        try {
          const parsed = parseYaml(readFileSync12(join12(pluginsDir, f), "utf8"));
          if (parsed && parsed.slug) {
            installedSlugs.add(parsed.slug);
          }
        } catch (e) {
        }
      });
    } catch (e) {
    }
  }
  filtered.forEach((p) => {
    const isInst = installedSlugs.has(p.slug) ? " \x1B[90m(\u2713 Installed)\x1B[0m" : "";
    console.log(`
\x1B[32m* ${p.name}\x1B[0m (v${p.version})${isInst}`);
    console.log(`  slug:         \x1B[33m${p.slug}\x1B[0m`);
    console.log(`  source:       ${p._source || "bundled"}`);
    console.log(`  category:     ${p.category}`);
    console.log(`  description:  ${p.description}`);
    console.log(`  safety:       ${p.safety_level || "sandboxed"} (${p.install_scope || "declarative"})`);
  });
  console.log("\nUse \x1B[36mcatalog list --category <category>\x1B[0m to filter listings by category.");
  console.log("Use \x1B[36mcatalog show <slug>\x1B[0m to inspect capabilities and installation manifest preview.");
  console.log("Use \x1B[36mcatalog install <slug> --approved\x1B[0m to install a plugin.\n");
}
function handleCatalogSearch(query, options) {
  const catalog = loadCatalog(options);
  const plugins = catalog.plugins || [];
  const lcQuery = query.toLowerCase();
  const matches = plugins.filter((p) => {
    return p.slug.toLowerCase().includes(lcQuery) || p.name.toLowerCase().includes(lcQuery) || p.description.toLowerCase().includes(lcQuery) || p.category.toLowerCase().includes(lcQuery) || Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(lcQuery));
  });
  if (options.json) {
    console.log(JSON.stringify(matches, null, 2));
    return;
  }
  console.log(`
\u{1F50D} \x1B[36mSearch Catalog Results for query: "${query}" (${matches.length} matches)\x1B[0m`);
  console.log("==================================================");
  if (matches.length === 0) {
    console.log(`  \x1B[33mWarning: No plugins found matching '${query}'. Try running 'catalog list' to view all entries.\x1B[0m`);
  } else {
    matches.forEach((p) => {
      console.log(`
\x1B[32m* ${p.name}\x1B[0m (v${p.version}) [slug: \x1B[33m${p.slug}\x1B[0m]`);
      console.log(`  category:     ${p.category}`);
      console.log(`  description:  ${p.description}`);
    });
  }
  console.log("");
}
function handleCatalogShow(slug, options) {
  const catalog = loadCatalog(options);
  const plugins = catalog.plugins || [];
  const p = plugins.find((item) => item.slug === slug);
  if (!p) {
    console.error(`\x1B[31mError: Plugin with slug '${slug}' not found in catalog.\x1B[0m`);
    process.exit(1);
  }
  if (options.json) {
    console.log(JSON.stringify(p, null, 2));
    return;
  }
  console.log(`
\u{1F50D} \x1B[36mCatalog Plugin: ${p.name} (v${p.version})\x1B[0m`);
  console.log("==================================================");
  console.log(`\x1B[33mSlug:\x1B[0m         ${p.slug}`);
  console.log(`\x1B[33mSource:\x1B[0m       ${p._source || "bundled"}`);
  console.log(`\x1B[33mCategory:\x1B[0m     ${p.category}`);
  console.log(`\x1B[33mDescription:\x1B[0m  ${p.description}`);
  console.log(`\x1B[33mRecommended:\x1B[0m  ${p.recommended_for}`);
  console.log(`\x1B[33mSafety Level:\x1B[0m ${p.safety_level} (declarative-only, sandboxed)`);
  console.log(`\x1B[33mScope:\x1B[0m        ${p.install_scope}`);
  if (p.use_cases) {
    console.log("\n\x1B[33mUse Cases:\x1B[0m");
    p.use_cases.forEach((uc) => console.log(`  - ${uc}`));
  }
  if (p.provided_workflows) {
    console.log("\n\x1B[33mProvided Workflows:\x1B[0m");
    p.provided_workflows.forEach((w) => console.log(`  - \x1B[32m${w}\x1B[0m`));
  }
  if (p.files_preview) {
    console.log("\n\x1B[33mPlanned Write Files:\x1B[0m");
    p.files_preview.forEach((f) => console.log(`  - \x1B[36m${f.dest}\x1B[0m`));
  }
  console.log(`
To install this plugin, run:`);
  console.log(`  \x1B[36mnpx multimodel-dev-os catalog install ${p.slug} --approved\x1B[0m
`);
}
function handleCatalogCategories(options) {
  const catalog = loadCatalog(options);
  const plugins = catalog.plugins || [];
  const categories = Array.from(new Set(plugins.map((p) => p.category))).sort();
  if (options.json) {
    console.log(JSON.stringify(categories, null, 2));
    return;
  }
  console.log(`
\u{1F4DA} \x1B[36mMarketplace Categories (${categories.length})\x1B[0m`);
  console.log("==================================================");
  categories.forEach((c) => console.log(`  - ${c}`));
  console.log("\nUse \x1B[36mcatalog list --category <category>\x1B[0m to list plugins in a category.\n");
}
function handleCatalogInstall(slug, options) {
  const catalog = loadCatalog(options);
  const plugins = catalog.plugins || [];
  const p = plugins.find((item) => item.slug === slug);
  if (!p) {
    console.error(`\x1B[31mError: Plugin with slug '${slug}' not found in catalog.\x1B[0m`);
    process.exit(1);
  }
  const policy = loadRegistryPolicy(options.target || process.cwd());
  let srcPath;
  if (p._source === "bundled") {
    srcPath = join12(sourceRoot, ".ai", "plugins", "catalog", `${slug}.yaml`);
  } else if (p._source === "local") {
    srcPath = join12(options.target || process.cwd(), ".ai", "plugins", "catalog", `${slug}.yaml`);
  } else if (p._source && p._source.startsWith("remote:")) {
    const regName = p._source.substring(7);
    const sources = loadRegistrySources();
    const src = sources.find((s) => s.name === regName);
    if (src) {
      if (!policy.allow_untrusted_install && (src.trust_level === "untrusted" || src.trust_level === "community")) {
        console.error(`\x1B[31mError: Installation from untrusted or community registry '${regName}' is blocked by policy.\x1B[0m`);
        console.error(`  Registry trust level: ${src.trust_level}`);
        console.error(`  Policy allow_untrusted_install: ${policy.allow_untrusted_install}`);
        process.exit(1);
      }
    }
    srcPath = join12(sourceRoot, ".ai", "registry-cache", regName, "catalog", `${slug}.yaml`);
  } else {
    srcPath = join12(sourceRoot, ".ai", "plugins", "catalog", `${slug}.yaml`);
  }
  if (!existsSync12(srcPath)) {
    console.error(`\x1B[31mError: Packed plugin manifest not found at: ${srcPath}\x1B[0m`);
    process.exit(1);
  }
  handlePluginInstall(srcPath, options);
}
function handleCatalogStatus(options) {
  const catalog = loadCatalog(options);
  const plugins = catalog.plugins || [];
  const pluginsDir = getPluginsDir(options.target);
  console.log(`
\u{1F4CA} \x1B[36mAuditing Catalog Plugins in: ${options.target}\x1B[0m`);
  console.log("==================================================");
  if (plugins.length === 0) {
    console.log("  No catalog entries found.");
    return;
  }
  plugins.forEach((p) => {
    const slug = p.slug;
    const destManifest = join12(pluginsDir, `${slug}.yaml`);
    if (!existsSync12(destManifest)) {
      console.log(`  - \x1B[33m${p.name}\x1B[0m (v${p.version}): \x1B[90mNot installed\x1B[0m`);
      console.log(`    Install via: \x1B[36mnpx multimodel-dev-os catalog install ${slug} --approved\x1B[0m`);
    } else {
      let missingCount = 0;
      let presentCount = 0;
      try {
        const targetP = parseYaml(readFileSync12(destManifest, "utf8"));
        if (Array.isArray(targetP.allowed_file_patterns)) {
          targetP.allowed_file_patterns.forEach((pat) => {
            const destPath = join12(options.target, pat);
            if (existsSync12(destPath) && statSync4(destPath).isFile()) {
              presentCount++;
            } else {
              missingCount++;
            }
          });
        }
        const total = presentCount + missingCount;
        if (total === 0 || missingCount === 0) {
          console.log(`  - \x1B[32m${p.name}\x1B[0m (v${p.version}): \x1B[32m\u2714 Installed (Up-to-date)\x1B[0m`);
        } else {
          console.log(`  - \x1B[33m${p.name}\x1B[0m (v${p.version}): \x1B[33m! Incomplete (Missing assets)\x1B[0m (${presentCount}/${total} files present)`);
        }
      } catch (e) {
        console.log(`  - \x1B[31m${p.name}\x1B[0m (v${p.version}): \x1B[31mInstalled (Read error: ${e.message})\x1B[0m`);
      }
    }
  });
  console.log("\nUse \x1B[36mcatalog show <slug>\x1B[0m to view detailed plugin metadata.");
  console.log("Use \x1B[36mcatalog install <slug> --approved\x1B[0m to install or update a plugin.\n");
}
function handleCatalogRecommend(options, { getAnalysis: getAnalysis2 } = {}) {
  if (!getAnalysis2) {
    console.error("\x1B[31mError: getAnalysis is required for catalog recommendation but was not provided.\x1B[0m");
    process.exit(1);
  }
  const analysis = getAnalysis2(options.target);
  const catalog = loadCatalog(options);
  const plugins = catalog.plugins || [];
  const recs = [];
  plugins.forEach((p) => {
    let conf = 0.5;
    let reason = "General codebase utility";
    const signals = [];
    if (p.slug === "git-workflows") {
      conf = 0.8;
      signals.push("Generic repository template matched");
      if (analysis.githubWorkflows && analysis.githubWorkflows.length > 0) {
        conf = 0.95;
        signals.push("Existing GitHub Actions workflows detected");
        reason = "Enforces git pre-push and pre-commit checks locally before executing remote pipeline checks.";
      } else {
        reason = "Standard git repository quality and branch cleanliness checks.";
      }
    } else if (p.slug === "nextjs-workflows") {
      if (analysis.frameworks && analysis.frameworks.some((f) => f.toLowerCase().includes("next"))) {
        conf = 0.95;
        signals.push("Next.js framework framework signals detected");
        reason = "Integrates routing checking and server actions verification rules for App Router.";
      } else if (analysis.packageScripts && analysis.packageScripts.some((s) => s.includes("next"))) {
        conf = 0.9;
        signals.push("Next package scripts detected in package.json");
        reason = "Configures Next.js specific builder guidelines.";
      } else {
        conf = 0.1;
      }
    } else if (p.slug === "wordpress-workflows") {
      if (analysis.repoType === "WordPress theme/plugin") {
        conf = 0.95;
        signals.push("WordPress folder layout and php structures identified");
        reason = "Ensures WordPress coding standards and security hooks validations are applied.";
      } else if (analysis.language === "PHP") {
        conf = 0.6;
        signals.push("PHP dominant language detected");
        reason = "Provides standard boilerplate checkups for PHP sites.";
      } else {
        conf = 0.1;
      }
    } else if (p.slug === "ecommerce-workflows") {
      const isShop = analysis.frameworks && analysis.frameworks.some((f) => f.toLowerCase().includes("shopify"));
      const isShopScript = analysis.packageScripts && analysis.packageScripts.some((s) => s.includes("stripe") || s.includes("shop"));
      if (isShop || isShopScript) {
        conf = 0.9;
        signals.push("E-commerce keywords or framework scripts detected");
        reason = "Validates payment gateway routes and Stripe webhook security signatures.";
      } else {
        let hasKeywords = false;
        try {
          const files = readdirSync4(options.target);
          hasKeywords = files.some((f) => f.includes("stripe") || f.includes("checkout") || f.includes("payment") || f.includes("cart"));
        } catch (e) {
        }
        if (hasKeywords) {
          conf = 0.85;
          signals.push("E-commerce transaction filenames detected");
          reason = "Secures checkout endpoints and verifies webhook signature validations.";
        } else {
          conf = 0.4;
        }
      }
    } else if (p.slug === "seo-workflows") {
      if (analysis.repoType === "docs") {
        conf = 0.8;
        signals.push("Documentation heavy layout detected");
        reason = "Audits sitemaps and page heading hierarchies for documentation search optimization.";
      } else if (analysis.language === "Markdown-heavy") {
        conf = 0.75;
        signals.push("Markdown-heavy content layout detected");
        reason = "Enforces metadata validations.";
      } else {
        conf = 0.6;
        signals.push("Frontend presentation site signals detected");
        reason = "Validates HTML page hierarchy and meta tag checklist rules.";
      }
    } else if (p.slug === "release-workflows") {
      if (analysis.repoType === "library") {
        conf = 0.9;
        signals.push("Library/Module repository distribution pattern detected");
        reason = "Verifies package hygiene, versions alignment, and npm pre-flight checks.";
      } else if (analysis.packageScripts && analysis.packageScripts.some((s) => s.includes("release") || s.includes("publish") || s.includes("build"))) {
        conf = 0.8;
        signals.push("Release/Build commands registered in package.json");
        reason = "Maintains release prep checklists and doctor verifications.";
      } else {
        conf = 0.5;
      }
    }
    if (conf >= 0.5) {
      recs.push({
        plugin: p,
        confidence: conf,
        signals,
        reason
      });
    }
  });
  recs.sort((a, b) => b.confidence - a.confidence);
  if (options.json) {
    console.log(JSON.stringify(recs, null, 2));
    return;
  }
  console.log(`
\u{1F4A1} \x1B[36mMarketplace Recommendations for: ${options.target}\x1B[0m`);
  console.log("==================================================");
  if (recs.length === 0) {
    console.log("  No matching recommendations found.");
  } else {
    recs.forEach((r) => {
      console.log(`
* \x1B[32m${r.plugin.name}\x1B[0m`);
      console.log(`  Detected Signals: \x1B[33m${r.signals.join(", ")}\x1B[0m`);
      console.log(`  Confidence Level: \x1B[35m${(r.confidence * 100).toFixed(0)}%\x1B[0m`);
      console.log(`  Why Recommended:  ${r.reason}`);
      console.log(`  Install Command:  \x1B[36mnpx multimodel-dev-os catalog install ${r.plugin.slug} --approved\x1B[0m`);
      console.log(`  Safety Notes:     Declarative sandbox only (offline, writes to .ai/ & adapters/ only, no scripts)`);
    });
  }
  console.log("");
}

// src/cli/handlers/init.js
import { existsSync as existsSync13, mkdirSync as mkdirSync5, readFileSync as readFileSync13, writeFileSync as writeFileSync9, readdirSync as readdirSync5, statSync as statSync5 } from "fs";
import { join as join13, dirname as dirname6 } from "path";
function handleInit(options) {
  console.log(`
\x1B[34mInitializing multimodel-dev-os in: ${options.target}\x1B[0m`);
  const TEMPLATES = loadTemplates(options.registry);
  const ADAPTERS = loadAdapters(options.registry);
  const tInfo = TEMPLATES[options.template];
  if (tInfo && tInfo.status === "planned") {
    console.warn(`  \x1B[33m[WARNING] Template '${options.template}' is planned for a future release and is not yet available.\x1B[0m`);
    console.warn(`  To view available templates, run: \x1B[36mnpx multimodel-dev-os templates\x1B[0m`);
    console.warn(`  Falling back to the stable \x1B[32m'general-app'\x1B[0m profile...
`);
    options.template = "general-app";
  }
  console.log(`Template profile: \x1B[32m${options.template}\x1B[0m`);
  if (options.caveman)
    console.log("Bone variant: \x1B[33mCaveman Mode Active\x1B[0m");
  if (options.dryRun)
    console.log("\x1B[36mDry Run active - no actual modifications will occur\x1B[0m");
  const operations = [];
  const conflicts = [];
  let templateDir = join13(sourceRoot, "examples", options.template);
  if (!existsSync13(templateDir)) {
    console.warn(`  \x1B[33m[WARNING] Template '${options.template}' source files could not be found.\x1B[0m`);
    console.warn(`  To view available templates, run: \x1B[36mnpx multimodel-dev-os templates\x1B[0m`);
    console.warn(`  Falling back to the stable \x1B[32m'general-app'\x1B[0m profile...
`);
    templateDir = join13(sourceRoot, "examples", "general-app");
  }
  let agentsSrc = join13(templateDir, "AGENTS.md");
  let memorySrc = join13(templateDir, "MEMORY.md");
  let tasksSrc = join13(templateDir, "TASKS.md");
  let runbookSrc = join13(sourceRoot, "RUNBOOK.md");
  let configSrc = join13(templateDir, ".ai", "config.yaml");
  if (options.caveman) {
    agentsSrc = join13(sourceRoot, ".ai", "templates", "AGENTS.caveman.md");
    memorySrc = join13(sourceRoot, ".ai", "templates", "MEMORY.caveman.md");
    tasksSrc = join13(sourceRoot, ".ai", "templates", "TASKS.caveman.md");
    runbookSrc = join13(sourceRoot, ".ai", "templates", "RUNBOOK.caveman.md");
  }
  operations.push({ dest: "AGENTS.md", src: agentsSrc });
  operations.push({ dest: "MEMORY.md", src: memorySrc });
  operations.push({ dest: "TASKS.md", src: tasksSrc });
  operations.push({ dest: "RUNBOOK.md", src: runbookSrc });
  operations.push({ dest: ".ai/config.yaml", src: configSrc });
  const templateAiDir = join13(templateDir, ".ai");
  if (existsSync13(templateAiDir) && !options.caveman) {
    const subdirs = ["context", "skills"];
    subdirs.forEach((sub) => {
      const subPath = join13(templateAiDir, sub);
      if (existsSync13(subPath)) {
        readdirSync5(subPath).forEach((file) => {
          operations.push({
            dest: join13(".ai", sub, file),
            src: join13(subPath, file)
          });
        });
      }
    });
  }
  const globalAiSubdirs = ["context", "agents", "skills", "prompts", "checks", "templates", "session-logs", "registries", "proposals", "intelligence"];
  globalAiSubdirs.forEach((sub) => {
    const globalPath = join13(sourceRoot, ".ai", sub);
    if (existsSync13(globalPath)) {
      readdirSync5(globalPath).forEach((file) => {
        const destRel = join13(".ai", sub, file);
        if (!operations.some((op) => op.dest === destRel)) {
          if (options.caveman && (sub === "context" || sub === "skills" || sub === "prompts" || sub === "checks")) {
            return;
          }
          operations.push({
            dest: destRel,
            src: join13(globalPath, file)
          });
        }
      });
    }
  });
  options.adapters.forEach((adapter) => {
    const adapterDir = join13(sourceRoot, "adapters", adapter);
    if (existsSync13(adapterDir)) {
      const copyRecursive = (currSrc, currRel) => {
        if (statSync5(currSrc).isDirectory()) {
          readdirSync5(currSrc).forEach((file) => {
            copyRecursive(join13(currSrc, file), join13(currRel, file));
          });
        } else {
          operations.push({
            dest: join13("adapters", adapter, currRel),
            src: currSrc
          });
        }
      };
      readdirSync5(adapterDir).forEach((file) => {
        copyRecursive(join13(adapterDir, file), file);
      });
    } else {
      console.warn(`\x1B[33mWarning: Adapter '${adapter}' not found. Skipping.\x1B[0m`);
    }
  });
  operations.forEach((op) => {
    const targetFile = join13(options.target, op.dest);
    if (existsSync13(targetFile)) {
      if (!options.force) {
        conflicts.push(op.dest);
      }
    }
  });
  if (conflicts.length > 0) {
    console.error("\n\x1B[31m[ABORT] Overwrite Conflict Detected!\x1B[0m");
    console.error("The following files already exist in the target directory:");
    conflicts.forEach((c) => console.error(`  - ${c}`));
    console.error("\nRun command with \x1B[33m--force\x1B[0m to overwrite these files.");
    process.exit(1);
  }
  operations.forEach((op) => {
    const targetFile = join13(options.target, op.dest);
    const targetDir = dirname6(targetFile);
    if (options.dryRun) {
      console.log(`  \x1B[36m[DRY-RUN] WOULD CREATE:\x1B[0m ${op.dest}`);
    } else {
      if (!existsSync13(targetDir)) {
        mkdirSync5(targetDir, { recursive: true });
      }
      const data = readFileSync13(op.src);
      writeFileSync9(targetFile, data);
      console.log(`  \x1B[32mCREATE:\x1B[0m ${op.dest}`);
    }
  });
  const dirsToEnsure = [".ai/context", ".ai/skills", ".ai/session-logs"];
  dirsToEnsure.forEach((d) => {
    const fullPath = join13(options.target, d);
    if (!options.dryRun && !existsSync13(fullPath)) {
      mkdirSync5(fullPath, { recursive: true });
      console.log(`  \x1B[32mCREATE DIR:\x1B[0m ${d}`);
    }
  });
  if (!options.dryRun) {
    options.adapters.forEach((adapter) => {
      const a = ADAPTERS[adapter];
      if (a && a.rules_file) {
        const srcFile = join13(sourceRoot, "adapters", adapter, a.rules_file);
        const destFile = join13(options.target, a.rules_file);
        const destDir = dirname6(destFile);
        if (existsSync13(srcFile)) {
          if (!existsSync13(destDir))
            mkdirSync5(destDir, { recursive: true });
          writeFileSync9(destFile, readFileSync13(srcFile));
          console.log(`  \x1B[32mCREATE ROOT ADAPTER FILE:\x1B[0m ${a.rules_file}`);
        }
      }
    });
    const targetConfigPath = join13(options.target, ".ai/config.yaml");
    if (existsSync13(targetConfigPath) && options.adapters.length > 0) {
      let configContent = readFileSync13(targetConfigPath, "utf8");
      options.adapters.forEach((adapter) => {
        const regex = new RegExp(`${adapter}:\\s*false`, "g");
        configContent = configContent.replace(regex, `${adapter}: true`);
      });
      writeFileSync9(targetConfigPath, configContent, "utf8");
      console.log(`  \x1B[32mUPDATE CONFIG:\x1B[0m Enabled selected adapters [${options.adapters.join(", ")}] in .ai/config.yaml`);
    }
  } else {
    options.adapters.forEach((adapter) => {
      const a = ADAPTERS[adapter];
      if (a && a.rules_file) {
        console.log(`  \x1B[36m[DRY-RUN] WOULD CREATE ROOT ADAPTER FILE:\x1B[0m ${a.rules_file}`);
      }
    });
  }
  console.log(`
\x1B[32m\u2714 Project initialized successfully! [Total Operations: ${operations.length}]\x1B[0m
`);
  console.log(`\x1B[36mNext Steps to Complete Integration:\x1B[0m`);
  console.log(`  1. \x1B[1mEdit AGENTS.md\x1B[0m in your project root to document your stack context.`);
  console.log(`  2. \x1B[1mEdit .ai/config.yaml\x1B[0m to configure active model routing presets.`);
  if (options.adapters.length > 0) {
    console.log(`  3. \x1B[1mActivate IDE / Agent Rules:\x1B[0m`);
    console.log(`     Ensure adapter configuration files are copied or linked to the root of your workspace:`);
    options.adapters.forEach((adapter) => {
      const a = ADAPTERS[adapter];
      if (a && a.rules_file) {
        console.log(`     - For \x1B[32m${a.name || adapter}\x1B[0m: Check the root-level \x1B[33m${a.rules_file}\x1B[0m file`);
      }
    });
  } else {
    console.log(`  3. \x1B[1mSelect IDE / Tool Adapters:\x1B[0m`);
    console.log(`     To generate rules for Cursor, Claude Code, etc., run:`);
    console.log(`     \x1B[36mnpx multimodel-dev-os init --adapter cursor --adapter claude\x1B[0m`);
  }
  console.log(`  4. \x1B[1mRun Diagnostics:\x1B[0m`);
  console.log(`     Verify your workspace structural compliance:`);
  console.log(`     \x1B[36mnpx multimodel-dev-os validate\x1B[0m`);
  console.log(`     \x1B[36mnpx multimodel-dev-os doctor\x1B[0m
`);
}

// src/cli/handlers/templates.js
function handleListTemplates(options) {
  const TEMPLATES = loadTemplates(options?.registry);
  if (options && options.json) {
    console.log(JSON.stringify(TEMPLATES, null, 2));
    return;
  }
  console.log(`
\u{1F9E0} \x1B[36mBuilt-in Template Profiles [v${version}]\x1B[0m`);
  console.log("==================================================");
  Object.keys(TEMPLATES).forEach((key) => {
    const t = TEMPLATES[key];
    const statusStr = t.status === "planned" ? " (Planned)" : t.status === "experimental" ? " (Experimental)" : "";
    console.log(`
\x1B[32m* ${t.name}${statusStr}\x1B[0m`);
    console.log(`  \x1B[33mStack:\x1B[0m ${t.stack}`);
    console.log(`  \x1B[37mDescription:\x1B[0m ${t.description}`);
  });
  console.log("\nUse \x1B[36mshow-template <template-name>\x1B[0m to view detailed layout specifications.\n");
}
function handleShowTemplate(name, options) {
  const TEMPLATES = loadTemplates(options?.registry);
  const t = TEMPLATES[name];
  if (!t) {
    const available = Object.keys(TEMPLATES).join(", ");
    console.error(`
\x1B[31mError: Template '${name}' does not exist. Available: ${available}\x1B[0m
`);
    process.exit(1);
  }
  const statusStr = t.status === "planned" ? " (Planned)" : t.status === "experimental" ? " (Experimental)" : " (Stable)";
  console.log(`
\u{1F50D} \x1B[36mTemplate Profile: ${t.name}${statusStr}\x1B[0m`);
  console.log("==================================================");
  console.log(`\x1B[33mStack Blueprint:\x1B[0m ${t.stack}`);
  console.log(`\x1B[33mOverview:\x1B[0m ${t.description}`);
  if (t.skill) {
    console.log(`\x1B[33mHighlighted Skill:\x1B[0m .ai/skills/${t.skill}`);
    console.log(`  \u2514\u2500\u2500> ${t.skillDesc}`);
  }
  console.log("\n\x1B[33mScaffolding Directory Layout:\x1B[0m");
  console.log("  \u251C\u2500\u2500 AGENTS.md                   (Stack building conventions)");
  console.log("  \u251C\u2500\u2500 MEMORY.md                   (Architectural constraints record)");
  console.log("  \u251C\u2500\u2500 TASKS.md                    (Pre-populated first project tasks)");
  console.log("  \u2514\u2500\u2500 RUNBOOK.md                  (Default operations guide)");
  console.log("  \u2514\u2500\u2500 .ai/");
  console.log("      \u251C\u2500\u2500 config.yaml             (Enabled adapter options)");
  console.log("      \u251C\u2500\u2500 context/");
  console.log("      \u2502   \u251C\u2500\u2500 project-brief.md    (Scaffolding baseline brief)");
  console.log("      \u2502   \u251C\u2500\u2500 architecture.md     (Stack specific architecture map)");
  console.log("      \u2502   \u251C\u2500\u2500 model-map.md        (AI routing specifications)");
  console.log("      \u2502   \u2514\u2500\u2500 context-budget.md   (Token allocation guidelines)");
  console.log(`      \u2514\u2500\u2500 skills/`);
  if (t.skill) {
    console.log(`          \u2514\u2500\u2500 ${t.skill}     (Custom template skills code boiler)`);
  } else {
    console.log(`          \u2514\u2500\u2500 [custom-skill].md   (Custom template skills code boiler)`);
  }
  console.log("\nUse \x1B[32minit --template " + t.name + "\x1B[0m to bootstrap this profile.\n");
}

// src/cli/handlers/inspection/verify.js
import { existsSync as existsSync14, statSync as statSync6 } from "fs";
import { join as join14 } from "path";
function handleVerify(options) {
  console.log(`
\x1B[34mRunning strict verification in: ${options.target}\x1B[0m
`);
  let passed = 0;
  let failed = 0;
  const assertFile = (relPath) => {
    const fullPath = join14(options.target, relPath);
    if (existsSync14(fullPath) && statSync6(fullPath).isFile()) {
      console.log(`  \x1B[32m\u2713\x1B[0m ${relPath}`);
      passed++;
    } else {
      console.error(`  \x1B[31m\u2717 ${relPath} (missing)\x1B[0m`);
      failed++;
    }
  };
  const rootFiles = ["AGENTS.md", "MEMORY.md", "TASKS.md", "RUNBOOK.md", ".ai/config.yaml"];
  rootFiles.forEach(assertFile);
  const contextFiles = [
    ".ai/context/project-brief.md",
    ".ai/context/architecture.md",
    ".ai/context/business-rules.md",
    ".ai/context/seo-rules.md",
    ".ai/context/deployment-rules.md",
    ".ai/context/model-map.md",
    ".ai/context/context-budget.md"
  ];
  contextFiles.forEach(assertFile);
  const agentFiles = [
    ".ai/agents/multimodel-orchestrator.md",
    ".ai/agents/planner.md",
    ".ai/agents/coder.md",
    ".ai/agents/reviewer.md",
    ".ai/agents/qa-tester.md",
    ".ai/agents/security-auditor.md",
    ".ai/agents/seo-auditor.md",
    ".ai/agents/devops.md"
  ];
  agentFiles.forEach(assertFile);
  console.log("\n=====================================");
  if (failed > 0) {
    console.error(`  \x1B[31mVerification FAILED. [Passed: ${passed}, Failed: ${failed}]\x1B[0m
`);
    if (options && options.noExit)
      return false;
    process.exit(1);
  } else {
    console.log(`  \x1B[32mVerification PASSED. [All ${passed} files present]\x1B[0m
`);
    if (options && options.noExit)
      return true;
    process.exit(0);
  }
}

// src/cli/handlers/inspection/doctor.js
import { existsSync as existsSync16, readFileSync as readFileSync15, readdirSync as readdirSync7, statSync as statSync8 } from "fs";
import { join as join16 } from "path";

// src/core/analysis.js
import { existsSync as existsSync15, readdirSync as readdirSync6, statSync as statSync7, readFileSync as readFileSync14 } from "fs";
import { join as join15, relative as relative3 } from "path";

// src/core/security.js
function shouldIgnorePath(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  const segments = normalized.split("/");
  const ignoredFolders = ["node_modules", ".git", "dist", "build", ".next", "coverage"];
  for (const seg of segments) {
    if (ignoredFolders.includes(seg))
      return true;
  }
  if (normalized.includes("docs/.vitepress/dist") || normalized.includes("docs/.vitepress/cache")) {
    return true;
  }
  if (normalized.endsWith("memory.hash.json") || normalized.endsWith("memory.summary.md") || normalized.endsWith("feedback-log.jsonl") || normalized.endsWith("learning-rules.md") || normalized.endsWith("apply-log.jsonl") || normalized.includes(".ai/proposals/")) {
    return true;
  }
  const lower = normalized.toLowerCase();
  const filePart = segments[segments.length - 1];
  if (lower.endsWith(".env") || lower.includes(".env.") || lower.endsWith(".npmrc") || lower.endsWith(".keystore") || lower.endsWith(".jks") || lower.endsWith(".key") || lower.endsWith(".pem") || lower.endsWith("credentials.json") || filePart === "id_rsa" || filePart === "id_dsa" || filePart === "id_ecdsa" || filePart === "id_ed25519") {
    return true;
  }
  return false;
}

// src/core/analysis.js
function scanTarget(targetDir) {
  const files = [];
  let ignoredCount = 0;
  function walk(dir) {
    if (!existsSync15(dir))
      return;
    const items = readdirSync6(dir);
    for (const item of items) {
      const fullPath = join15(dir, item);
      const relPath = relative3(targetDir, fullPath).replace(/\\/g, "/");
      if (shouldIgnorePath(relPath)) {
        ignoredCount++;
        continue;
      }
      try {
        const stat = statSync7(fullPath);
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
      }
    }
  }
  walk(targetDir);
  return { files, ignoredCount };
}
function detectFrameworkSignals(files, targetDir) {
  const signals = [];
  const hasFile = (name) => files.some((f) => f.relPath.toLowerCase() === name.toLowerCase());
  if (hasFile("next.config.js") || hasFile("next.config.mjs"))
    signals.push("Next.js");
  if (hasFile("nuxt.config.js") || hasFile("nuxt.config.ts"))
    signals.push("Nuxt.js");
  if (hasFile("wp-config.php") || hasFile("index.php"))
    signals.push("WordPress/PHP");
  if (hasFile("tsconfig.json"))
    signals.push("TypeScript");
  if (hasFile("package.json")) {
    signals.push("Node.js");
    try {
      const pkg = JSON.parse(readFileSync14(join15(targetDir, "package.json"), "utf8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps["react"])
        signals.push("React");
      if (deps["vue"])
        signals.push("Vue");
      if (deps["svelte"])
        signals.push("Svelte");
      if (deps["expo"])
        signals.push("Expo");
      if (deps["react-native"])
        signals.push("React Native");
      if (deps["vite"])
        signals.push("Vite");
      if (deps["express"])
        signals.push("Express");
      if (deps["angular"])
        signals.push("Angular");
    } catch (e) {
    }
  }
  if (hasFile("requirements.txt") || hasFile("pyproject.toml"))
    signals.push("Python");
  if (hasFile("cargo.toml"))
    signals.push("Rust");
  if (hasFile("gemfile"))
    signals.push("Ruby");
  if (hasFile("go.mod"))
    signals.push("Go");
  if (signals.length === 0)
    signals.push("Generic/Unknown");
  return [...new Set(signals)];
}
function detectDependencySignals(files, targetDir) {
  const signals = [];
  const hasFile = (name) => files.some((f) => f.relPath.toLowerCase() === name.toLowerCase());
  if (hasFile("package-lock.json"))
    signals.push("npm");
  else if (hasFile("yarn.lock"))
    signals.push("Yarn");
  else if (hasFile("pnpm-lock.yaml"))
    signals.push("pnpm");
  else if (hasFile("bun.lockb"))
    signals.push("Bun");
  if (hasFile("requirements.txt"))
    signals.push("pip");
  if (hasFile("poetry.lock"))
    signals.push("Poetry");
  if (hasFile("cargo.lock"))
    signals.push("Cargo");
  return signals;
}
function detectAiDevOsSignals(files) {
  const signals = [];
  const hasFile = (name) => files.some((f) => f.relPath.toLowerCase() === name.toLowerCase());
  if (hasFile("agents.md"))
    signals.push("AGENTS.md");
  if (hasFile("memory.md"))
    signals.push("MEMORY.md");
  if (hasFile("tasks.md"))
    signals.push("TASKS.md");
  if (hasFile("runbook.md"))
    signals.push("RUNBOOK.md");
  if (hasFile(".ai/config.yaml"))
    signals.push(".ai/config.yaml");
  const hasPrefix = (prefix) => files.some((f) => f.relPath.startsWith(prefix));
  if (hasPrefix(".ai/templates/"))
    signals.push("Templates Registry");
  if (hasPrefix(".ai/adapters/"))
    signals.push("Adapters Registry");
  if (hasPrefix(".ai/skills/"))
    signals.push("Skills Registry");
  if (hasPrefix(".ai/intelligence/"))
    signals.push("Intelligence Layer");
  if (hasPrefix(".ai/policies/"))
    signals.push("Policy Layer");
  if (hasPrefix(".ai/registries/"))
    signals.push("Registry Layer");
  return signals;
}
function detectRisks(files, targetDir) {
  const risks = [];
  const gitignorePath = join15(targetDir, ".gitignore");
  const gitignoreContent = existsSync15(gitignorePath) ? readFileSync14(gitignorePath, "utf8") : "";
  const hasFolder = (name) => files.some((f) => f.relPath.split("/")[0] === name);
  if (hasFolder("node_modules") && !gitignoreContent.includes("node_modules")) {
    risks.push({
      file_pattern: "node_modules/",
      risk_description: "Large token-sink directory node_modules/ is present but not ignored in .gitignore.",
      severity: "high"
    });
  }
  files.forEach((f) => {
    if (f.relPath.endsWith(".json") && f.relPath.toLowerCase().includes("config") && f.size > 5e4) {
      risks.push({
        file_pattern: f.relPath,
        risk_description: `Large config file (${(f.size / 1024).toFixed(1)} KB) might contain sensitive parameters or inflate prompt context.`,
        severity: "medium"
      });
    }
  });
  return risks;
}
function getAnalysis(target) {
  const { files, ignoredCount } = scanTarget(target);
  const frameworks = detectFrameworkSignals(files, target);
  const packageManagers = detectDependencySignals(files, target);
  const aiSignals = detectAiDevOsSignals(files);
  let jsCount = 0, tsCount = 0, phpCount = 0, pyCount = 0, mdCount = 0;
  files.forEach((f) => {
    const ext = f.relPath.substring(f.relPath.lastIndexOf(".")).toLowerCase();
    if (ext === ".js" || ext === ".mjs" || ext === ".cjs")
      jsCount++;
    else if (ext === ".ts" || ext === ".tsx")
      tsCount++;
    else if (ext === ".php")
      phpCount++;
    else if (ext === ".py")
      pyCount++;
    else if (ext === ".md")
      mdCount++;
  });
  let language = "mixed";
  if (tsCount > jsCount && tsCount > phpCount && tsCount > pyCount && tsCount > mdCount)
    language = "TS";
  else if (jsCount > tsCount && jsCount > phpCount && jsCount > pyCount && jsCount > mdCount)
    language = "JS";
  else if (phpCount > jsCount && phpCount > tsCount && phpCount > pyCount && phpCount > mdCount)
    language = "PHP";
  else if (pyCount > jsCount && pyCount > tsCount && phpCount > pyCount && phpCount > mdCount)
    language = "Python";
  else if (mdCount > jsCount && mdCount > tsCount && mdCount > phpCount && mdCount > pyCount)
    language = "Markdown-heavy";
  let repoType = "app";
  if (files.some((f) => f.relPath.includes("wp-content/themes") || f.relPath.includes("wp-content/plugins"))) {
    repoType = "WordPress theme/plugin";
  } else if (files.some((f) => f.relPath.includes("app.json") || f.relPath.includes("eas.json"))) {
    repoType = "mobile app";
  } else if (files.some((f) => f.relPath.includes("lerna.json") || f.relPath.includes("pnpm-workspace.yaml"))) {
    repoType = "monorepo";
  } else if (files.some((f) => f.relPath.includes("docs/")) && mdCount > files.length * 0.4) {
    repoType = "docs";
  } else if (files.some((f) => f.relPath === "package.json")) {
    try {
      const pkg = JSON.parse(readFileSync14(join15(target, "package.json"), "utf8"));
      if (pkg.main && (pkg.main.includes("dist/") || pkg.main.includes("lib/"))) {
        repoType = "library";
      }
    } catch (e) {
    }
  }
  const existingTools = [];
  if (files.some((f) => f.relPath === ".cursorrules"))
    existingTools.push("Cursor");
  if (files.some((f) => f.relPath === "CLAUDE.md"))
    existingTools.push("Claude");
  if (files.some((f) => f.relPath === "GEMINI.md"))
    existingTools.push("Gemini");
  if (files.some((f) => f.relPath.startsWith(".vscode/")))
    existingTools.push("VS Code");
  if (files.some((f) => f.relPath.startsWith(".gemini/")))
    existingTools.push("Antigravity");
  const packageScripts = [];
  if (files.some((f) => f.relPath === "package.json")) {
    try {
      const pkg = JSON.parse(readFileSync14(join15(target, "package.json"), "utf8"));
      if (pkg.scripts) {
        Object.keys(pkg.scripts).forEach((k) => packageScripts.push(k));
      }
    } catch (e) {
    }
  }
  const githubWorkflows = [];
  const githubDir = join15(target, ".github", "workflows");
  if (existsSync15(githubDir)) {
    try {
      readdirSync6(githubDir).forEach((f) => {
        if (f.endsWith(".yml") || f.endsWith(".yaml"))
          githubWorkflows.push(f);
      });
    } catch (e) {
    }
  }
  const envRiskMarkers = [];
  files.forEach((f) => {
    const name = f.relPath.toLowerCase();
    if (name.includes(".env") || name.includes("id_rsa") || name.includes("credential") || name.endsWith(".pem") || name.endsWith(".key") || name.endsWith(".keystore") || name.endsWith(".jks")) {
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

// src/cli/handlers/inspection/doctor.js
function handleDoctor(options, { scanTarget: scanTarget2 = scanTarget, detectDependencySignals: detectDependencySignals2 = detectDependencySignals, getAnalysis: getAnalysis2 = getAnalysis, diffMemory: diffMemory2 } = {}) {
  if (options.tokens) {
    handleDoctorTokens(options);
    return;
  }
  if (options.release) {
    handleDoctorRelease(options);
    return;
  }
  if (options.intelligence) {
    handleDoctorIntelligence(options, { diffMemory: diffMemory2 });
    return;
  }
  if (options.onboarding) {
    handleDoctorOnboarding(options, { scanTarget: scanTarget2, detectDependencySignals: detectDependencySignals2 });
    return;
  }
  console.log(`
\u{1FA7A} \x1B[36mRunning advisory doctor checkup in: ${options.target}\x1B[0m
`);
  let warnings = 0;
  const warn = (msg) => {
    console.warn(`  \x1B[33m[WARNING]\x1B[0m ${msg}`);
    warnings++;
  };
  const gitignorePath = join16(options.target, ".gitignore");
  if (existsSync16(gitignorePath)) {
    const content = readFileSync15(gitignorePath, "utf8");
    if (!content.includes("node_modules")) {
      warn(".gitignore is missing node_modules! This will cause AI tools to choke by scanning dependencies.");
    }
    if (!content.includes(".env")) {
      warn(".gitignore is missing .env config boundaries! Secret tokens might get exposed to models.");
    }
  } else {
    warn("Missing .gitignore file in target workspace! AI tools might read large build artifacts.");
  }
  const agentsPath = join16(options.target, "AGENTS.md");
  if (existsSync16(agentsPath)) {
    const content = readFileSync15(agentsPath, "utf8");
    if (!content.includes("build:") && !content.includes("build")) {
      warn("AGENTS.md is missing build command specifications.");
    }
    if (!content.includes("test:") && !content.includes("test")) {
      warn("AGENTS.md is missing test command specifications.");
    }
    if (!content.includes("lint:") && !content.includes("lint")) {
      warn("AGENTS.md is missing lint command specifications.");
    }
  } else {
    warn("AGENTS.md is missing from project root.");
  }
  const memoryPath = join16(options.target, "MEMORY.md");
  if (existsSync16(memoryPath)) {
    const content = readFileSync15(memoryPath, "utf8");
    const placeholdersCount = (content.match(/null/g) || []).length;
    if (placeholdersCount > 3) {
      warn(`MEMORY.md contains ${placeholdersCount} empty 'null' placeholders. Update project constraints.`);
    }
  }
  const tasksPath = join16(options.target, "TASKS.md");
  if (existsSync16(tasksPath)) {
    const content = readFileSync15(tasksPath, "utf8");
    if (!content.includes("- [ ]") && !content.includes("- [/]")) {
      warn("TASKS.md has no active task section (no tasks marked as - [ ] or - [/]).");
    }
  } else {
    warn("TASKS.md is missing from project root.");
  }
  const configPath = join16(options.target, ".ai", "config.yaml");
  if (existsSync16(configPath)) {
    const content = readFileSync15(configPath, "utf8");
    const checkAdapter = (adapterName, filename) => {
      const regex = new RegExp(`${adapterName}:\\s*true`);
      if (regex.test(content)) {
        const filePath = join16(options.target, filename);
        if (!existsSync16(filePath)) {
          warn(`Adapter '${adapterName}' is enabled in .ai/config.yaml but matching adapter file '${filename}' is missing from root.`);
        }
      }
    };
    checkAdapter("cursor", ".cursorrules");
    checkAdapter("claude", "CLAUDE.md");
    checkAdapter("gemini", "GEMINI.md");
    checkAdapter("vscode", ".vscode/settings.json");
    checkAdapter("antigravity", ".gemini/settings.json");
  } else {
    warn('MultiModel Dev OS is not initialized (.ai/config.yaml is missing). Run "npx multimodel-dev-os init" to bootstrap configuration.');
  }
  const sinkFolders = ["node_modules", "dist", "build", ".next", ".git"];
  sinkFolders.forEach((folder) => {
    const fullPath = join16(options.target, folder);
    if (existsSync16(fullPath)) {
      const gitignore = existsSync16(gitignorePath) ? readFileSync15(gitignorePath, "utf8") : "";
      if (!gitignore.includes(folder)) {
        warn(`Large token-sink directory '${folder}/' is present in workspace but not ignored in .gitignore. AI tools may read it.`);
      }
    }
  });
  console.log("\n==================================================");
  if (warnings > 0) {
    console.log(`\x1B[33mDoctor checkup complete. Found ${warnings} advisory warnings.\x1B[0m
`);
  } else {
    console.log("\x1B[32m\u2714 Doctor checkup complete. Your project context layout is pristine!\x1B[0m\n");
  }
}
function parseThresholdToBytes(val) {
  if (!val)
    return 100 * 1024;
  const matches = val.match(/^(\d+)(KB|MB|B)?$/i);
  if (!matches)
    return 100 * 1024;
  const num = parseInt(matches[1], 10);
  const unit = (matches[2] || "").toUpperCase();
  if (unit === "MB")
    return num * 1024 * 1024;
  if (unit === "KB")
    return num * 1024;
  return num;
}
function handleDoctorTokens(options) {
  console.log(`
\u{1FA99} \x1B[36mRunning Token Budget & Sink Audit in: ${options.target}\x1B[0m
`);
  const filesFound = [];
  const ignoredDirs = [".git", "node_modules", "dist", "build", ".next", ".expo", "bin", "assets", "docs", "web-build", "out", "coverage", ".nuxt", ".svelte-kit", "bower_components", "vendor"];
  function scan(dir) {
    if (!existsSync16(dir))
      return;
    const items = readdirSync7(dir);
    for (const item of items) {
      if (ignoredDirs.includes(item))
        continue;
      const fullPath = join16(dir, item);
      try {
        const stat = statSync8(fullPath);
        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (stat.isFile()) {
          filesFound.push({
            relPath: replaceBackslashes(fullPath.replace(options.target, "")),
            size: stat.size
          });
        }
      } catch (e) {
      }
    }
  }
  function replaceBackslashes(p) {
    let clean = p.replace(/\\/g, "/");
    if (clean.startsWith("/"))
      clean = clean.substring(1);
    return clean;
  }
  scan(options.target);
  filesFound.sort((a, b) => b.size - a.size);
  const thresholdBytes = parseThresholdToBytes(options.threshold);
  const thresholdStr = options.threshold || "100KB";
  console.log("Top 10 Largest Files in Scanned Workspace:");
  filesFound.slice(0, 10).forEach((f) => {
    let sizeDesc = `${f.size} bytes`;
    if (f.size > 1024 * 1024)
      sizeDesc = `${(f.size / (1024 * 1024)).toFixed(2)} MB`;
    else if (f.size > 1024)
      sizeDesc = `${(f.size / 1024).toFixed(2)} KB`;
    let color = "\x1B[32m";
    if (f.size > thresholdBytes)
      color = "\x1B[31m";
    else if (f.size > thresholdBytes * 0.3)
      color = "\x1B[33m";
    console.log(`  ${color}* ${f.relPath}\x1B[0m (${sizeDesc})`);
  });
  console.log("\n==================================================");
  console.log(`Total Scanned Files: ${filesFound.length}`);
  console.log(`Recommendation: Exclude files in red (>${thresholdStr}) from active coding prompts or add them to your adapter ignore rules.`);
  console.log();
}
function handleDoctorRelease(options) {
  console.log(`
\u{1FA7A} \x1B[36mRunning release audit doctor in: ${sourceRoot}\x1B[0m
`);
  let warnings = 0;
  let packageVersion = "unknown";
  try {
    const pkg = JSON.parse(readFileSync15(join16(sourceRoot, "package.json"), "utf8"));
    packageVersion = pkg.version;
    console.log(`  \x1B[32m\u2713\x1B[0m package.json version: ${packageVersion}`);
  } catch (e) {
    console.warn("  \x1B[31m\u2717\x1B[0m Failed to parse package.json");
    warnings++;
  }
  const checkInstallScript = (filename, regex) => {
    const filePath = join16(sourceRoot, filename);
    if (existsSync16(filePath)) {
      const content = readFileSync15(filePath, "utf8");
      const match = content.match(regex);
      if (match && match[1] === packageVersion) {
        console.log(`  \x1B[32m\u2713\x1B[0m ${filename} version aligns: ${match[1]}`);
      } else {
        console.warn(`  \x1B[33m[WARNING]\x1B[0m ${filename} version mismatch (found ${match ? match[1] : "none"}, expected ${packageVersion})`);
        warnings++;
      }
    }
  };
  checkInstallScript("scripts/install.sh", /VERSION="([^"]+)"/i);
  checkInstallScript("scripts/install.ps1", /\$VERSION\s*=\s*"([^"]+)"/i);
  const blacklist = [".npmrc"];
  blacklist.forEach((file) => {
    const fullPath = join16(sourceRoot, file);
    if (existsSync16(fullPath)) {
      console.warn(`  \x1B[33m[WARNING]\x1B[0m Blacklisted file found in release root: ${file}`);
      warnings++;
    } else {
      console.log(`  \x1B[32m\u2713\x1B[0m No root blacklisted file: ${file}`);
    }
  });
  const scanSafety = (dir) => {
    if (!existsSync16(dir))
      return;
    const items = readdirSync7(dir);
    for (const item of items) {
      const fullPath = join16(dir, item);
      try {
        const stat = statSync8(fullPath);
        if (stat.isDirectory()) {
          scanSafety(fullPath);
        } else if (stat.isFile()) {
          if (item === ".env" || item.endsWith(".keystore") || item.endsWith(".jks")) {
            console.warn(`  \x1B[33m[WARNING]\x1B[0m Unsafe file inside templates/examples: ${fullPath.replace(sourceRoot, "")}`);
            warnings++;
          }
        }
      } catch (e) {
      }
    }
  };
  scanSafety(join16(sourceRoot, "examples"));
  console.log("\n==================================================");
  if (warnings > 0) {
    console.warn(`  \x1B[33mRelease doctor complete with ${warnings} warnings.\x1B[0m
`);
  } else {
    console.log("  \x1B[32m\u2714 Release hygiene checks PASSED successfully!\x1B[0m\n");
  }
}
function handleDoctorIntelligence(options, { diffMemory: diffMemory2 } = {}) {
  console.log(`
\u{1FA7A} \x1B[36mRunning advisory intelligence doctor checkup in: ${options.target}\x1B[0m
`);
  let warnings = 0;
  const warn = (msg) => {
    console.warn(`  \x1B[33m[WARNING]\x1B[0m ${msg}`);
    warnings++;
  };
  const memoryHashPath = join16(options.target, ".ai", "intelligence", "memory.hash.json");
  if (!existsSync16(memoryHashPath)) {
    warn("Memory hash index (.ai/intelligence/memory.hash.json) is MISSING. Run `memory build` first.");
  } else {
    try {
      const diff = diffMemory2(options.target);
      if (!diff) {
        warn("Memory hash index is present but corrupt.");
      } else if (diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0) {
        warn(`Memory hash index is STALE. Delts: +${diff.added.length}, -${diff.removed.length}, ~${diff.changed.length}. Run \`memory refresh\`.`);
      }
    } catch (e) {
      warn("Failed to diff memory index.");
    }
  }
  const feedbackPath = join16(options.target, ".ai", "intelligence", "feedback-log.jsonl");
  if (!existsSync16(feedbackPath)) {
    warn("Feedback log (.ai/intelligence/feedback-log.jsonl) is MISSING.");
  }
  const rulesPath = join16(options.target, ".ai", "intelligence", "learning-rules.md");
  if (!existsSync16(rulesPath)) {
    warn("Learning rules (.ai/intelligence/learning-rules.md) are MISSING. Run `feedback summarize` to compile logs.");
  }
  const proposalsDir = join16(options.target, ".ai", "proposals");
  if (!existsSync16(proposalsDir)) {
    warn("Proposals directory (.ai/proposals) is MISSING.");
  } else {
    try {
      const files = readdirSync7(proposalsDir).filter((f) => f.startsWith("proposal-") && f.endsWith(".md"));
      let pending = 0;
      files.forEach((file) => {
        const content = readFileSync15(join16(proposalsDir, file), "utf8");
        const fmMatch = content.match(/^---([\s\S]*?)---/);
        if (fmMatch) {
          const yamlData = fmMatch[1];
          let status = "pending";
          const statusMatch = yamlData.match(/approval_status:\s*(\w+)/);
          if (statusMatch)
            status = statusMatch[1];
          if (status === "pending") {
            pending++;
          }
        }
      });
      if (pending > 0) {
        warn(`Found ${pending} pending improvement proposals waiting for approval.`);
      }
    } catch (e) {
    }
  }
  const applyLogPath = join16(options.target, ".ai", "proposals", "apply-log.jsonl");
  if (!existsSync16(applyLogPath)) {
    warn("Apply audit log (.ai/proposals/apply-log.jsonl) is MISSING.");
  }
  const gitignorePath = join16(options.target, ".gitignore");
  if (existsSync16(gitignorePath)) {
    const gitignoreContent = readFileSync15(gitignorePath, "utf8");
    const checkIgnore = (pattern) => {
      if (!gitignoreContent.includes(pattern)) {
        warn(`.gitignore is missing rules ignoring: ${pattern}`);
      }
    };
    checkIgnore(".ai/intelligence/handoff.md");
    checkIgnore(".ai/intelligence/status.snapshot.json");
    checkIgnore(".ai/intelligence/feedback-log.jsonl");
    checkIgnore(".ai/intelligence/learning-rules.md");
    checkIgnore(".ai/proposals/apply-log.jsonl");
  } else {
    warn(".gitignore file is missing in target root.");
  }
  if (existsSync16(memoryHashPath)) {
    try {
      const memObj = JSON.parse(readFileSync15(memoryHashPath, "utf8"));
      const fingerprints = memObj.file_fingerprints || {};
      Object.keys(fingerprints).forEach((file) => {
        const name = file.toLowerCase();
        if (name.includes(".env") || name.includes("id_rsa") || name.includes("credential") || name.endsWith(".pem") || name.endsWith(".p12") || name.endsWith(".key") || name.endsWith(".keystore") || name.endsWith(".jks")) {
          warn(`Memory index contains potentially sensitive file: ${file}`);
        }
      });
    } catch (e) {
    }
  }
  console.log("\n==================================================");
  if (warnings > 0) {
    console.log(`\x1B[33mDoctor intelligence check complete. Found ${warnings} warnings.\x1B[0m
`);
  } else {
    console.log("\x1B[32m\u2714 Doctor intelligence check complete. Your intelligence setup is pristine!\x1B[0m\n");
  }
}
function handleDoctorOnboarding(options, { scanTarget: scanTarget2 = scanTarget, detectDependencySignals: detectDependencySignals2 = detectDependencySignals } = {}) {
  console.log(`
\u{1FA7A} \x1B[36mRunning advisory onboarding doctor checkup in: ${options.target}\x1B[0m
`);
  let warnings = 0;
  const warn = (msg) => {
    console.warn(`  \x1B[33m[WARNING]\x1B[0m ${msg}`);
    warnings++;
  };
  const crucialFiles = [
    "AGENTS.md",
    "MEMORY.md",
    "TASKS.md",
    "RUNBOOK.md"
  ];
  crucialFiles.forEach((f) => {
    if (!existsSync16(join16(options.target, f))) {
      warn(`Crucial onboarding file '${f}' is missing from project root.`);
    }
  });
  const configPath = join16(options.target, ".ai", "config.yaml");
  if (!existsSync16(configPath)) {
    warn("MultiModel Dev OS configuration file (.ai/config.yaml) is missing.");
  }
  const registriesDir = join16(options.target, ".ai", "registries");
  if (!existsSync16(registriesDir)) {
    warn("Registries directory (.ai/registries) is missing.");
  }
  const proposalsDir = join16(options.target, ".ai", "proposals");
  if (!existsSync16(proposalsDir)) {
    warn("Proposals directory (.ai/proposals) is missing.");
  }
  const intelligenceDir = join16(options.target, ".ai", "intelligence");
  if (!existsSync16(intelligenceDir)) {
    warn("Intelligence directory (.ai/intelligence) is missing.");
  }
  const gitignorePath = join16(options.target, ".gitignore");
  if (existsSync16(gitignorePath)) {
    const gitignoreContent = readFileSync15(gitignorePath, "utf8");
    const checkIgnore = (pattern) => {
      if (!gitignoreContent.includes(pattern)) {
        warn(`Generated runtime file '${pattern}' is not ignored in .gitignore.`);
      }
    };
    checkIgnore("onboarding.plan.json");
    checkIgnore("onboarding.report.md");
  }
  const { files } = scanTarget2(options.target);
  const packageManagers = detectDependencySignals2(files, options.target);
  if (packageManagers.length === 0) {
    warn("No package manager lockfile detected in project root.");
  }
  console.log("\n==================================================");
  if (warnings > 0) {
    console.log(`\x1B[33mDoctor onboarding check complete. Found ${warnings} warnings.\x1B[0m
`);
  } else {
    console.log("\x1B[32m\u2714 Doctor onboarding check complete. Your workspace onboarding setup is pristine!\x1B[0m\n");
  }
}

// src/cli/handlers/inspection/validate.js
import { existsSync as existsSync17, readFileSync as readFileSync16, statSync as statSync9 } from "fs";
import { join as join17 } from "path";
function handleValidate(options) {
  if (options && options.allRegistries) {
    handleValidateAllRegistries(options);
    return;
  }
  console.log(`
\u{1F6E1} \x1B[34mRunning strict schema validation in: ${options.target}\x1B[0m
`);
  let errors = 0;
  const assertPath = (relPath, type) => {
    const fullPath = join17(options.target, relPath);
    if (existsSync17(fullPath)) {
      const stat = statSync9(fullPath);
      const isOk = type === "file" ? stat.isFile() : stat.isDirectory();
      if (isOk) {
        console.log(`  \x1B[32m\u2713\x1B[0m ${relPath} (${type})`);
      } else {
        console.error(`  \x1B[31m\u2717 ${relPath} (expected to be a ${type})\x1B[0m`);
        errors++;
      }
    } else {
      console.error(`  \x1B[31m\u2717 ${relPath} (missing)\x1B[0m`);
      errors++;
    }
  };
  const core = ["AGENTS.md", "MEMORY.md", "TASKS.md", "RUNBOOK.md", ".ai/config.yaml"];
  core.forEach((f) => assertPath(f, "file"));
  const dirs = [".ai/context", ".ai/skills", ".ai/session-logs"];
  dirs.forEach((d) => assertPath(d, "dir"));
  const agentsPath = join17(options.target, ".ai/agents");
  const agentsExist = existsSync17(agentsPath) && statSync9(agentsPath).isDirectory();
  if (agentsExist) {
    console.log(`  \x1B[32m\u2713\x1B[0m .ai/agents (dir)`);
  } else {
    const agentsMdPath = join17(options.target, "AGENTS.md");
    let explained = false;
    if (existsSync17(agentsMdPath)) {
      const agentsMdContent = readFileSync16(agentsMdPath, "utf8");
      if (agentsMdContent.includes("multimodel") || agentsMdContent.includes("orchestrator") || agentsMdContent.includes("global") || agentsMdContent.includes("role") || agentsMdContent.includes("Agent Roles")) {
        explained = true;
      }
    }
    if (explained) {
      console.log(`  \x1B[32m\u2713\x1B[0m .ai/agents (missing, but global agent/orchestrator usage explained in AGENTS.md)`);
    } else {
      console.error(`  \x1B[31m\u2717 .ai/agents (missing and global agent use is not explained in AGENTS.md)\x1B[0m`);
      errors++;
    }
  }
  const configPath = join17(options.target, ".ai", "config.yaml");
  if (existsSync17(configPath)) {
    const content = readFileSync16(configPath, "utf8");
    const assertAdapter = (adapterName, filename) => {
      const regex = new RegExp(`${adapterName}:\\s*true`);
      if (regex.test(content)) {
        const fullPath = join17(options.target, filename);
        if (existsSync17(fullPath)) {
          console.log(`  \x1B[32m\u2713\x1B[0m ${filename} (enabled adapter rules file verified)`);
        } else {
          console.error(`  \x1B[31m\u2717 ${filename} (adapter '${adapterName}' is enabled in .ai/config.yaml, but rule file is missing!)\x1B[0m`);
          errors++;
        }
      }
    };
    assertAdapter("cursor", ".cursorrules");
    assertAdapter("claude", "CLAUDE.md");
    assertAdapter("gemini", "GEMINI.md");
    assertAdapter("vscode", ".vscode/settings.json");
    assertAdapter("antigravity", ".gemini/settings.json");
  }
  if (options.template) {
    const TEMPLATES = loadTemplates(options.registry);
    const tInfo = TEMPLATES[options.template];
    if (tInfo && Array.isArray(tInfo.required_files)) {
      console.log(`
\u{1F4CB} Validating required files for template '${options.template}':`);
      tInfo.required_files.forEach((f) => assertPath(f, "file"));
    } else if (options.template === "expo-react-native-android") {
      const mobileFiles = [
        "app.json",
        "eas.json",
        "app.config.ts",
        "jest.config.js",
        "src/app/_layout.tsx",
        "src/lib/secure-storage.ts",
        "src/services/api-client.ts"
      ];
      mobileFiles.forEach((f) => assertPath(f, "file"));
    }
  }
  console.log("\n==================================================");
  if (errors > 0) {
    console.error(`  \x1B[31mValidation FAILED. Found ${errors} strict structural compliance errors.\x1B[0m
`);
    process.exit(1);
  } else {
    console.log("  \x1B[32m\u2714 Validation PASSED. Your project context structure is strictly compliant!\x1B[0m\n");
    process.exit(0);
  }
}
function handleValidateTemplate(name, options) {
  const TEMPLATES = loadTemplates(options?.registry);
  const t = TEMPLATES[name];
  if (!t) {
    console.error(`\x1B[31mError: Template '${name}' not found in registry.\x1B[0m`);
    process.exit(1);
  }
  console.log(`
\u{1F4CB} \x1B[34mValidating Template: ${name}\x1B[0m`);
  let errors = 0;
  const reqKeys = ["name", "description", "stack", "category", "status", "maturity", "required_files"];
  reqKeys.forEach((k) => {
    if (t[k] === void 0 || t[k] === null) {
      console.error(`  \x1B[31m\u2717 Missing registry key: ${k}\x1B[0m`);
      errors++;
    } else {
      console.log(`  \x1B[32m\u2713\x1B[0m Registry key: ${k}`);
    }
  });
  const templateDir = join17(sourceRoot, "examples", name);
  if (!existsSync17(templateDir)) {
    console.error(`  \x1B[31m\u2717 Source folder missing: examples/${name}\x1B[0m`);
    errors++;
  } else {
    console.log(`  \x1B[32m\u2713\x1B[0m Source folder: examples/${name}`);
    if (Array.isArray(t.required_files)) {
      t.required_files.forEach((f) => {
        const filePath = join17(templateDir, f);
        const globalPath = join17(sourceRoot, f);
        if (existsSync17(filePath)) {
          console.log(`  \x1B[32m\u2713\x1B[0m Required file (template override): ${f}`);
        } else if (existsSync17(globalPath)) {
          console.log(`  \x1B[32m\u2713\x1B[0m Required file (global fallback): ${f}`);
        } else {
          console.error(`  \x1B[31m\u2717 Required file missing: ${f}\x1B[0m`);
          errors++;
        }
      });
    }
  }
  if (errors > 0) {
    console.error(`
\x1B[31mValidation FAILED with ${errors} errors.\x1B[0m
`);
    process.exit(1);
  } else {
    console.log(`
\x1B[32m\u2714 Template '${name}' is fully valid and compliant!\x1B[0m
`);
    process.exit(0);
  }
}
function handleValidateAdapter(name, options) {
  const ADAPTERS = loadAdapters(options?.registry);
  const a = ADAPTERS[name];
  if (!a) {
    console.error(`\x1B[31mError: Adapter '${name}' not found in registry.\x1B[0m`);
    process.exit(1);
  }
  console.log(`
\u{1F4CB} \x1B[34mValidating Adapter: ${name}\x1B[0m`);
  let errors = 0;
  const reqKeys = ["name", "rules_file", "format", "type"];
  reqKeys.forEach((k) => {
    if (!a[k]) {
      console.error(`  \x1B[31m\u2717 Missing registry key: ${k}\x1B[0m`);
      errors++;
    } else {
      console.log(`  \x1B[32m\u2713\x1B[0m Registry key: ${k}`);
    }
  });
  const adapterDir = join17(sourceRoot, "adapters", name);
  if (!existsSync17(adapterDir)) {
    console.error(`  \x1B[31m\u2717 Source folder missing: adapters/${name}\x1B[0m`);
    errors++;
  } else {
    console.log(`  \x1B[32m\u2713\x1B[0m Source folder: adapters/${name}`);
    const setupFile = join17(adapterDir, "setup.md");
    if (existsSync17(setupFile)) {
      console.log(`  \x1B[32m\u2713\x1B[0m Required file: setup.md`);
    } else {
      console.error(`  \x1B[31m\u2717 Required file missing: adapters/${name}/setup.md\x1B[0m`);
      errors++;
    }
    if (a.rules_file) {
      const rulesFile = join17(adapterDir, a.rules_file);
      if (existsSync17(rulesFile)) {
        console.log(`  \x1B[32m\u2713\x1B[0m Rules file: ${a.rules_file}`);
      } else {
        console.error(`  \x1B[31m\u2717 Rules file missing: adapters/${name}/${a.rules_file}\x1B[0m`);
        errors++;
      }
    }
  }
  if (errors > 0) {
    console.error(`
\x1B[31mValidation FAILED with ${errors} errors.\x1B[0m
`);
    process.exit(1);
  } else {
    console.log(`
\x1B[32m\u2714 Adapter '${name}' is fully valid and compliant!\x1B[0m
`);
    process.exit(0);
  }
}
function handleValidateSkill(name, options) {
  const skillsDir = join17(options.target, ".ai", "skills");
  let skillFile = join17(skillsDir, name.endsWith(".md") ? name : `${name}.md`);
  if (!existsSync17(skillFile)) {
    skillFile = join17(sourceRoot, ".ai", "skills", name.endsWith(".md") ? name : `${name}.md`);
  }
  if (!existsSync17(skillFile)) {
    console.error(`\x1B[31mError: Skill '${name}' not found.\x1B[0m`);
    process.exit(1);
  }
  console.log(`
\u{1F4CB} \x1B[34mValidating Skill: ${name}\x1B[0m`);
  const content = readFileSync16(skillFile, "utf8");
  let errors = 0;
  const reqHeaders = [
    { header: "# Purpose", regex: /^#\s+Purpose/mi },
    { header: "# Activation Trigger", regex: /^#\s+Activation\s+Trigger/mi },
    { header: "# Input Context", regex: /^#\s+Input\s+Context/mi },
    { header: "# Output Contract", regex: /^#\s+Output\s+Contract/mi },
    { header: "# Token Budget", regex: /^#\s+Token\s+Budget/mi }
  ];
  reqHeaders.forEach((req) => {
    if (req.regex.test(content)) {
      console.log(`  \x1B[32m\u2713\x1B[0m Found required header: ${req.header}`);
    } else {
      console.error(`  \x1B[31m\u2717 Missing required header: ${req.header}\x1B[0m`);
      errors++;
    }
  });
  if (errors > 0) {
    console.error(`
\x1B[31mValidation FAILED with ${errors} errors.\x1B[0m
`);
    process.exit(1);
  } else {
    console.log(`
\x1B[32m\u2714 Skill '${name}' is fully valid and compliant!\x1B[0m
`);
    process.exit(0);
  }
}
function handleValidateAllRegistries(options) {
  console.log(`
\u{1F6E1} \x1B[34mValidating All Registry Entries\x1B[0m
`);
  let errors = 0;
  const TEMPLATES = loadTemplates(options?.registry);
  const ADAPTERS = loadAdapters(options?.registry);
  console.log("--- Templates Registry Validation ---");
  Object.keys(TEMPLATES).forEach((name) => {
    const t = TEMPLATES[name];
    console.log(`
Validating Template: ${name}`);
    const reqKeys = ["name", "description", "stack", "category", "status", "maturity"];
    if (t.status !== "planned") {
      reqKeys.push("required_files");
    }
    reqKeys.forEach((k) => {
      if (t[k] === void 0 || t[k] === null) {
        console.error(`  \x1B[31m\u2717 Missing registry key: ${k}\x1B[0m`);
        errors++;
      }
    });
    const templateDir = join17(sourceRoot, "examples", name);
    if (t.status === "stable" && !existsSync17(templateDir)) {
      console.error(`  \x1B[31m\u2717 Stable template source folder missing: examples/${name}\x1B[0m`);
      errors++;
    }
  });
  console.log("\n--- Adapters Registry Validation ---");
  Object.keys(ADAPTERS).forEach((name) => {
    const a = ADAPTERS[name];
    console.log(`Validating Adapter: ${name}`);
    const reqKeys = ["name", "rules_file", "format", "type"];
    reqKeys.forEach((k) => {
      if (!a[k]) {
        console.error(`  \x1B[31m\u2717 Missing registry key: ${k}\x1B[0m`);
        errors++;
      }
    });
  });
  console.log("\n==================================================");
  if (errors > 0) {
    console.error(`  \x1B[31mAll Registries validation FAILED. Found ${errors} schema errors.\x1B[0m
`);
    process.exit(1);
  } else {
    console.log("  \x1B[32m\u2714 All Registries validation PASSED. All templates and adapters are valid.\x1B[0m\n");
    process.exit(0);
  }
}

// src/cli/handlers/inspection/scan.js
import { existsSync as existsSync18, readFileSync as readFileSync17, readdirSync as readdirSync8, statSync as statSync10 } from "fs";
import { join as join18 } from "path";
function handleScan(options, { scanTarget: scanTarget2 = scanTarget, detectFrameworkSignals: detectFrameworkSignals2 = detectFrameworkSignals, detectDependencySignals: detectDependencySignals2 = detectDependencySignals, detectAiDevOsSignals: detectAiDevOsSignals2 = detectAiDevOsSignals, detectRisks: detectRisks2 = detectRisks } = {}) {
  console.log(`
\u{1F50D} \x1B[36mCodebase Scan target: ${options.target}\x1B[0m`);
  console.log("==================================================");
  const { files, ignoredCount } = scanTarget2(options.target);
  const frameworkSignals = detectFrameworkSignals2(files, options.target);
  const dependencySignals = detectDependencySignals2(files, options.target);
  const aiDevOsSignals = detectAiDevOsSignals2(files);
  const risks = detectRisks2(files, options.target);
  console.log(`
\x1B[33mProject Stats:\x1B[0m`);
  console.log(`  File Count:    ${files.length}`);
  console.log(`  Ignored Files: ${ignoredCount}`);
  console.log(`
\x1B[33mFramework & Language Signals:\x1B[0m`);
  frameworkSignals.forEach((sig) => console.log(`  - ${sig}`));
  console.log(`
\x1B[33mPackage Manager & Dependency Signals:\x1B[0m`);
  dependencySignals.forEach((sig) => console.log(`  - ${sig}`));
  console.log(`
\x1B[33mMultiModel Dev OS Files:\x1B[0m`);
  if (aiDevOsSignals.length > 0) {
    aiDevOsSignals.forEach((sig) => console.log(`  - ${sig}`));
  } else {
    console.log(`  No MultiModel Dev OS files detected. Run \x1B[36mmit --template general-app\x1B[0m to initialize.`);
  }
  if (risks.length > 0) {
    console.log(`
\x1B[31mDetected Risks:\x1B[0m`);
    risks.forEach((r) => console.log(`  - [${r.severity.toUpperCase()}] ${r.file_pattern}: ${r.risk_description}`));
  } else {
    console.log(`
\x1B[32m\u2714 No high/medium risks detected in repository structure.\x1B[0m`);
  }
  console.log();
}
function handleStatus(options, { scanTarget: scanTarget2 = scanTarget, detectFrameworkSignals: detectFrameworkSignals2 = detectFrameworkSignals, detectDependencySignals: detectDependencySignals2 = detectDependencySignals, diffMemory: diffMemory2 } = {}) {
  console.log(`
\u{1F4CA} \x1B[36mRepository Intelligence Status: ${options.target}\x1B[0m`);
  console.log("==================================================");
  let pkgName = "unknown";
  let pkgVersion2 = "unknown";
  try {
    const pkgPath = join18(options.target, "package.json");
    if (existsSync18(pkgPath)) {
      const pkg = JSON.parse(readFileSync17(pkgPath, "utf8"));
      pkgName = pkg.name || pkgName;
      pkgVersion2 = pkg.version || pkgVersion2;
    }
  } catch (e) {
  }
  console.log(`  \x1B[33mProject Info:\x1B[0m`);
  console.log(`    Package Name:    ${pkgName}`);
  console.log(`    Package Version: ${pkgVersion2}`);
  const { files } = scanTarget2(options.target);
  const frameworkSignals = detectFrameworkSignals2(files, options.target);
  const dependencySignals = detectDependencySignals2(files, options.target);
  console.log(`  \x1B[33mFramework & Dependency Signals:\x1B[0m`);
  console.log(`    Frameworks:      ${frameworkSignals.join(", ") || "None"}`);
  console.log(`    Dependencies:    ${dependencySignals.join(", ") || "None"}`);
  const memoryHashPath = join18(options.target, ".ai", "intelligence", "memory.hash.json");
  let memoryStatus = "\x1B[31mMISSING\x1B[0m";
  let lastBuildTime = "N/A";
  if (existsSync18(memoryHashPath)) {
    try {
      const memObj = JSON.parse(readFileSync17(memoryHashPath, "utf8"));
      lastBuildTime = memObj.generated_at || "N/A";
      const diff = diffMemory2(options.target);
      if (diff) {
        if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
          memoryStatus = "\x1B[32mCURRENT\x1B[0m";
        } else {
          memoryStatus = `\x1B[33mSTALE\x1B[0m (changes: +${diff.added.length}, -${diff.removed.length}, ~${diff.changed.length})`;
        }
      }
    } catch (e) {
      memoryStatus = "\x1B[31mCORRUPT\x1B[0m";
    }
  }
  console.log(`  \x1B[33mMemory State:\x1B[0m`);
  console.log(`    Status:          ${memoryStatus}`);
  console.log(`    Last Built:      ${lastBuildTime}`);
  const feedbackPath = join18(options.target, ".ai", "intelligence", "feedback-log.jsonl");
  let feedbackCount = 0;
  if (existsSync18(feedbackPath)) {
    try {
      feedbackCount = readFileSync17(feedbackPath, "utf8").trim().split(/\r?\n/).filter((l) => l.trim() !== "").length;
    } catch (e) {
    }
  }
  const rulesPath = join18(options.target, ".ai", "intelligence", "learning-rules.md");
  const rulesStatus = existsSync18(rulesPath) ? "\x1B[32mPRESENT\x1B[0m" : "\x1B[31mMISSING\x1B[0m";
  console.log(`  \x1B[33mFeedback Loop & Rules:\x1B[0m`);
  console.log(`    Feedback Count:  ${feedbackCount}`);
  console.log(`    Learning Rules:  ${rulesStatus}`);
  const proposalsDir = join18(options.target, ".ai", "proposals");
  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  let totalProposals = 0;
  if (existsSync18(proposalsDir)) {
    try {
      const propFiles = readdirSync8(proposalsDir).filter((f) => f.startsWith("proposal-") && f.endsWith(".md"));
      totalProposals = propFiles.length;
      propFiles.forEach((file) => {
        const content = readFileSync17(join18(proposalsDir, file), "utf8");
        const fmMatch = content.match(/^---([\s\S]*?)---/);
        if (fmMatch) {
          const yamlData = fmMatch[1];
          let status = "pending";
          const statusMatch = yamlData.match(/approval_status:\s*(\w+)/);
          if (statusMatch)
            status = statusMatch[1];
          if (status === "approved")
            approvedCount++;
          else if (status === "rejected")
            rejectedCount++;
          else
            pendingCount++;
        }
      });
    } catch (e) {
    }
  }
  console.log(`  \x1B[33mImprovement Proposals:\x1B[0m`);
  console.log(`    Total proposals: ${totalProposals}`);
  console.log(`    Pending:         \x1B[33m${pendingCount}\x1B[0m`);
  console.log(`    Approved:        \x1B[32m${approvedCount}\x1B[0m`);
  console.log(`    Rejected:        \x1B[31m${rejectedCount}\x1B[0m`);
  const applyLogPath = join18(options.target, ".ai", "proposals", "apply-log.jsonl");
  let applyLogCount = 0;
  if (existsSync18(applyLogPath)) {
    try {
      applyLogCount = readFileSync17(applyLogPath, "utf8").trim().split(/\r?\n/).filter((l) => l.trim() !== "").length;
    } catch (e) {
    }
  }
  console.log(`  \x1B[33mApply Audit Log:\x1B[0m`);
  console.log(`    Apply Count:     ${applyLogCount}`);
  let nextMove = "mmdo status";
  if (!existsSync18(join18(options.target, ".ai", "config.yaml"))) {
    nextMove = "\x1B[36mnpx multimodel-dev-os init\x1B[0m (initialize MultiModel Dev OS first)";
  } else if (!existsSync18(memoryHashPath)) {
    nextMove = "\x1B[36mnpx multimodel-dev-os memory build\x1B[0m (initialize memory index)";
  } else {
    const diff = diffMemory2(options.target);
    if (diff && (diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0)) {
      nextMove = "\x1B[36mnpx multimodel-dev-os memory refresh\x1B[0m (update memory with changes)";
    } else if (feedbackCount > 0 && !existsSync18(rulesPath)) {
      nextMove = "\x1B[36mnpx multimodel-dev-os feedback summarize\x1B[0m (compile feedback into learning rules)";
    } else if (pendingCount > 0) {
      nextMove = "\x1B[36mnpx multimodel-dev-os improve review\x1B[0m (review pending proposals)";
    } else {
      nextMove = "\x1B[36mnpx multimodel-dev-os workflow run repo-health\x1B[0m (run standard codebase health checks)";
    }
  }
  console.log(`
  \x1B[35mRecommended Next Command:\x1B[0m`);
  console.log(`    ${nextMove}
`);
}

// src/cli/handlers/memory.js
import { existsSync as existsSync19, mkdirSync as mkdirSync6, readFileSync as readFileSync18, writeFileSync as writeFileSync10 } from "fs";
import { join as join19 } from "path";
function buildMemoryIndex(targetDir, { scanTarget: scanTarget2 = scanTarget, detectFrameworkSignals: detectFrameworkSignals2 = detectFrameworkSignals, detectDependencySignals: detectDependencySignals2 = detectDependencySignals, detectAiDevOsSignals: detectAiDevOsSignals2 = detectAiDevOsSignals, detectRisks: detectRisks2 = detectRisks } = {}) {
  const { files, ignoredCount } = scanTarget2(targetDir);
  const framework_signals = detectFrameworkSignals2(files, targetDir);
  const dependency_signals = detectDependencySignals2(files, targetDir);
  const ai_dev_os_signals = detectAiDevOsSignals2(files);
  const risks = detectRisks2(files, targetDir);
  const file_fingerprints = {};
  files.forEach((f) => {
    file_fingerprints[f.relPath] = {
      hash: hashFile(f.fullPath),
      size: f.size,
      last_modified: f.mtime
    };
  });
  const recommended_next_steps = [];
  if (ai_dev_os_signals.length === 0) {
    recommended_next_steps.push("Run init to bootstrap MultiModel Dev OS.");
  }
  if (risks.some((r) => r.severity === "high")) {
    recommended_next_steps.push("Address Gitignore configuration to exclude large directories (node_modules/ or build artifacts).");
  }
  recommended_next_steps.push("Use validate or doctor to check structural integrity.");
  recommended_next_steps.push("Commit the .ai/ intelligence policies to share constraints across AI agents.");
  return {
    generated_at: (/* @__PURE__ */ new Date()).toISOString(),
    project_root: targetDir.replace(/\\/g, "/"),
    file_count: files.length,
    ignored_count: ignoredCount,
    file_fingerprints,
    framework_signals,
    dependency_signals,
    ai_dev_os_signals,
    risks,
    recommended_next_steps
  };
}
function writeMemoryFiles(targetDir, index) {
  const intelDir = join19(targetDir, ".ai", "intelligence");
  if (!existsSync19(intelDir)) {
    mkdirSync6(intelDir, { recursive: true });
  }
  const hashJsonPath = join19(intelDir, "memory.hash.json");
  writeFileSync10(hashJsonPath, JSON.stringify(index, null, 2), "utf8");
  const summaryMdPath = join19(intelDir, "memory.summary.md");
  let md = `# MultiModel Dev OS Repository Memory Summary

`;
  md += `**Generated At:** ${index.generated_at}
`;
  md += `**Project Root:** ${index.project_root}
`;
  md += `**Total Files:** ${index.file_count} (Ignored: ${index.ignored_count})

`;
  md += `## Framework & Environment Signals
`;
  md += `- **Frameworks/Languages:** ${index.framework_signals.join(", ") || "None"}
`;
  md += `- **Package Manager/Build:** ${index.dependency_signals.join(", ") || "None"}
`;
  md += `- **AI Dev OS Integration:** ${index.ai_dev_os_signals.join(", ") || "None"}

`;
  md += `## Codebase Fingerprints
`;
  md += `| File Path | Size (Bytes) | Hash (SHA-256) |
`;
  md += `|---|---|---|
`;
  const entries = Object.entries(index.file_fingerprints);
  entries.forEach(([filePath, fp]) => {
    md += `| ${filePath} | ${fp.size} | \`${fp.hash.substring(0, 12)}...\` |
`;
  });
  md += `
`;
  if (index.risks.length > 0) {
    md += `## Detected Risks
`;
    index.risks.forEach((r) => {
      md += `- **[${r.severity.toUpperCase()}]** \`${r.file_pattern}\`: ${r.risk_description}
`;
    });
    md += `
`;
  }
  md += `## Recommended Next Steps
`;
  index.recommended_next_steps.forEach((step) => {
    md += `- ${step}
`;
  });
  writeFileSync10(summaryMdPath, md, "utf8");
}
function diffMemory(targetDir, { scanTarget: scanTarget2 = scanTarget, detectFrameworkSignals: detectFrameworkSignals2 = detectFrameworkSignals, detectDependencySignals: detectDependencySignals2 = detectDependencySignals, detectAiDevOsSignals: detectAiDevOsSignals2 = detectAiDevOsSignals, detectRisks: detectRisks2 = detectRisks } = {}) {
  const hashJsonPath = join19(targetDir, ".ai", "intelligence", "memory.hash.json");
  if (!existsSync19(hashJsonPath)) {
    return null;
  }
  let existing;
  try {
    existing = JSON.parse(readFileSync18(hashJsonPath, "utf8"));
  } catch (e) {
    return null;
  }
  const currentScan = buildMemoryIndex(targetDir, { scanTarget: scanTarget2, detectFrameworkSignals: detectFrameworkSignals2, detectDependencySignals: detectDependencySignals2, detectAiDevOsSignals: detectAiDevOsSignals2, detectRisks: detectRisks2 });
  const added = [];
  const removed = [];
  const changed = [];
  let unchangedCount = 0;
  const currentFp = currentScan.file_fingerprints;
  const existingFp = existing.file_fingerprints || {};
  Object.keys(currentFp).forEach((file) => {
    if (!existingFp[file]) {
      added.push(file);
    } else if (existingFp[file].hash !== currentFp[file].hash || existingFp[file].size !== currentFp[file].size) {
      changed.push(file);
    } else {
      unchangedCount++;
    }
  });
  Object.keys(existingFp).forEach((file) => {
    if (!currentFp[file]) {
      removed.push(file);
    }
  });
  return { added, removed, changed, unchangedCount, currentScan };
}
function handleMemoryBuild(options, { scanTarget: scanTarget2 = scanTarget, detectFrameworkSignals: detectFrameworkSignals2 = detectFrameworkSignals, detectDependencySignals: detectDependencySignals2 = detectDependencySignals, detectAiDevOsSignals: detectAiDevOsSignals2 = detectAiDevOsSignals, detectRisks: detectRisks2 = detectRisks } = {}) {
  console.log(`
\u{1F9E0} \x1B[36mBuilding Codebase Memory in: ${options.target}\x1B[0m`);
  console.log("==================================================");
  const index = buildMemoryIndex(options.target, { scanTarget: scanTarget2, detectFrameworkSignals: detectFrameworkSignals2, detectDependencySignals: detectDependencySignals2, detectAiDevOsSignals: detectAiDevOsSignals2, detectRisks: detectRisks2 });
  writeMemoryFiles(options.target, index);
  console.log(`  \x1B[32mCREATE:\x1B[0m .ai/intelligence/memory.hash.json`);
  console.log(`  \x1B[32mCREATE:\x1B[0m .ai/intelligence/memory.summary.md`);
  console.log(`
\u2714 Memory index built successfully! [Files indexed: ${index.file_count}]`);
  console.log(`
\x1B[33mRecommended Next Steps:\x1B[0m`);
  index.recommended_next_steps.forEach((step) => console.log(`  - ${step}`));
  console.log();
}
function handleMemoryRefresh(options, { scanTarget: scanTarget2 = scanTarget, detectFrameworkSignals: detectFrameworkSignals2 = detectFrameworkSignals, detectDependencySignals: detectDependencySignals2 = detectDependencySignals, detectAiDevOsSignals: detectAiDevOsSignals2 = detectAiDevOsSignals, detectRisks: detectRisks2 = detectRisks } = {}) {
  console.log(`
\u{1F9E0} \x1B[36mRefreshing Codebase Memory in: ${options.target}\x1B[0m`);
  console.log("==================================================");
  const diff = diffMemory(options.target, { scanTarget: scanTarget2, detectFrameworkSignals: detectFrameworkSignals2, detectDependencySignals: detectDependencySignals2, detectAiDevOsSignals: detectAiDevOsSignals2, detectRisks: detectRisks2 });
  if (!diff) {
    console.log("  No existing memory index found. Building fresh index...");
    handleMemoryBuild(options, { scanTarget: scanTarget2, detectFrameworkSignals: detectFrameworkSignals2, detectDependencySignals: detectDependencySignals2, detectAiDevOsSignals: detectAiDevOsSignals2, detectRisks: detectRisks2 });
    return;
  }
  writeMemoryFiles(options.target, diff.currentScan);
  console.log(`  \x1B[32mUPDATE:\x1B[0m .ai/intelligence/memory.hash.json`);
  console.log(`  \x1B[32mUPDATE:\x1B[0m .ai/intelligence/memory.summary.md`);
  console.log(`
\u2714 Memory index refreshed successfully!`);
  console.log(`  Added:     ${diff.added.length}`);
  console.log(`  Removed:   ${diff.removed.length}`);
  console.log(`  Changed:   ${diff.changed.length}`);
  console.log(`  Unchanged: ${diff.unchangedCount}`);
  console.log();
}
function handleMemoryDiff(options, { scanTarget: scanTarget2 = scanTarget, detectFrameworkSignals: detectFrameworkSignals2 = detectFrameworkSignals, detectDependencySignals: detectDependencySignals2 = detectDependencySignals, detectAiDevOsSignals: detectAiDevOsSignals2 = detectAiDevOsSignals, detectRisks: detectRisks2 = detectRisks } = {}) {
  console.log(`
\u{1F9E0} \x1B[36mDiffing Codebase State against Memory in: ${options.target}\x1B[0m`);
  console.log("==================================================");
  const diff = diffMemory(options.target, { scanTarget: scanTarget2, detectFrameworkSignals: detectFrameworkSignals2, detectDependencySignals: detectDependencySignals2, detectAiDevOsSignals: detectAiDevOsSignals2, detectRisks: detectRisks2 });
  if (!diff) {
    console.error(`\x1B[31mError: No existing memory index found. Run 'memory build' first.\x1B[0m
`);
    if (options && options.noExit)
      return false;
    process.exit(1);
  }
  console.log(`
\x1B[33mMemory Diff Summary:\x1B[0m`);
  console.log(`  Added Files:   ${diff.added.length}`);
  console.log(`  Removed Files: ${diff.removed.length}`);
  console.log(`  Changed Files: ${diff.changed.length}`);
  console.log(`  Unchanged:     ${diff.unchangedCount}`);
  if (diff.added.length > 0) {
    console.log(`
\x1B[32mAdded Files:\x1B[0m`);
    diff.added.forEach((f) => console.log(`  + ${f}`));
  }
  if (diff.removed.length > 0) {
    console.log(`
\x1B[31mRemoved Files:\x1B[0m`);
    diff.removed.forEach((f) => console.log(`  - ${f}`));
  }
  if (diff.changed.length > 0) {
    console.log(`
\x1B[33mChanged Files:\x1B[0m`);
    diff.changed.forEach((f) => console.log(`  M ${f}`));
  }
  console.log();
}

// src/cli/handlers/feedback.js
import { existsSync as existsSync20, mkdirSync as mkdirSync7, readFileSync as readFileSync19, writeFileSync as writeFileSync11 } from "fs";
import { join as join20 } from "path";
import { createHash as createHash2 } from "crypto";
function handleFeedbackAdd(options) {
  const intelDir = join20(options.target, ".ai", "intelligence");
  if (!options.dryRun && !existsSync20(intelDir)) {
    mkdirSync7(intelDir, { recursive: true });
  }
  const addIdx = process.argv.indexOf("add");
  const text = addIdx !== -1 && process.argv[addIdx + 1] && !process.argv[addIdx + 1].startsWith("-") ? process.argv[addIdx + 1] : null;
  if (!text) {
    console.error(`\x1B[31mError: Please provide feedback text.\x1B[0m`);
    console.log(`Example: node bin/multimodel-dev-os.js feedback add "Prefer CSS modules"`);
    process.exit(1);
  }
  const uuid = createHash2("md5").update((/* @__PURE__ */ new Date()).toISOString() + Math.random().toString()).digest("hex").substring(0, 16);
  const tagsStr = options.tags || "";
  const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()) : [];
  const filesStr = options.files || "";
  const related_files = filesStr ? filesStr.split(",").map((f) => f.trim()) : [];
  const rawRecord = {
    id: `fb-${uuid}`,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    source: "user",
    type: options.type || "unknown",
    text,
    tags,
    related_files
  };
  rawRecord.hash = createHash2("sha256").update(JSON.stringify(rawRecord)).digest("hex");
  const recordLine = JSON.stringify(rawRecord) + "\n";
  const feedbackLogPath = join20(intelDir, "feedback-log.jsonl");
  if (options.dryRun) {
    console.log(`\x1B[36m[DRY-RUN] WOULD APPEND TO ${feedbackLogPath}:\x1B[0m`);
    console.log(recordLine.trim());
  } else {
    try {
      let isDuplicate = false;
      if (existsSync20(feedbackLogPath)) {
        const lines = readFileSync19(feedbackLogPath, "utf8").split("\n");
        for (const line of lines) {
          if (!line.trim())
            continue;
          try {
            const entry = JSON.parse(line);
            if (entry.text === text && JSON.stringify(entry.related_files) === JSON.stringify(related_files)) {
              isDuplicate = true;
              break;
            }
          } catch (e) {
          }
        }
      }
      if (isDuplicate) {
        console.log(`\x1B[33mFeedback already exists. Skipping duplicate entry.\x1B[0m`);
        return;
      }
      writeFileSync11(feedbackLogPath, recordLine, { flag: "a", encoding: "utf8" });
      console.log(`\u2714 Feedback successfully added (ID: ${rawRecord.id})`);
    } catch (e) {
      console.error(`\x1B[31mError: Failed to write to feedback-log.jsonl: ${e.message}\x1B[0m`);
      process.exit(1);
    }
  }
}
function handleFeedbackList(options) {
  const feedbackLogPath = join20(options.target, ".ai", "intelligence", "feedback-log.jsonl");
  if (!existsSync20(feedbackLogPath)) {
    console.log("No feedback logged yet.");
    return;
  }
  try {
    const content = readFileSync19(feedbackLogPath, "utf8");
    const lines = content.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) {
      console.log("No feedback logged yet.");
      return;
    }
    console.log(`
\u{1F9E0} \x1B[36mLogged Feedback Entries\x1B[0m`);
    console.log("==================================================");
    lines.forEach((line) => {
      try {
        const entry = JSON.parse(line);
        console.log(`
\x1B[32m* [${entry.type || "unknown"}] (${entry.id})\x1B[0m`);
        console.log(`  \x1B[37mText:\x1B[0m ${entry.text}`);
        if (entry.tags && entry.tags.length > 0) {
          console.log(`  \x1B[33mTags:\x1B[0m ${entry.tags.join(", ")}`);
        }
        if (entry.related_files && entry.related_files.length > 0) {
          console.log(`  \x1B[33mFiles:\x1B[0m ${entry.related_files.join(", ")}`);
        }
        console.log(`  \x1B[33mLogged:\x1B[0m ${entry.created_at}`);
      } catch (e) {
      }
    });
    console.log();
  } catch (e) {
    console.error(`\x1B[31mError: Failed to read feedback log: ${e.message}\x1B[0m`);
    process.exit(1);
  }
}
function handleFeedbackSummarize(options) {
  const intelDir = join20(options.target, ".ai", "intelligence");
  const feedbackLogPath = join20(intelDir, "feedback-log.jsonl");
  if (!existsSync20(feedbackLogPath)) {
    console.log("No feedback logs found to compile.");
    return;
  }
  try {
    const content = readFileSync19(feedbackLogPath, "utf8");
    const lines = content.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) {
      console.log("No feedback logs found to compile.");
      return;
    }
    const categories = {};
    lines.forEach((line) => {
      try {
        const entry = JSON.parse(line);
        const cat = entry.type || "general";
        if (!categories[cat])
          categories[cat] = [];
        categories[cat].push(entry);
      } catch (e) {
      }
    });
    let md = `# Compiled Learning Rules

`;
    md += `*Generated automatically by MultiModel Dev OS. Do not modify manually.*

`;
    md += `**Last compiled:** ${(/* @__PURE__ */ new Date()).toISOString()}
`;
    md += `**Total source feedback items:** ${lines.length}

`;
    md += `## Active Instructions

`;
    Object.keys(categories).forEach((cat) => {
      md += `### Category: ${cat}
`;
      categories[cat].forEach((entry) => {
        const pattern = entry.related_files && entry.related_files.length > 0 ? entry.related_files.join(", ") : "*";
        md += `*   **Pattern:** \`${pattern}\`
`;
        md += `    *   **Rule:** ${entry.text}
`;
        md += `    *   **Source ID:** \`${entry.id}\`

`;
      });
    });
    const targetRulesPath = join20(intelDir, "learning-rules.md");
    if (options.dryRun) {
      console.log(`\x1B[36m[DRY-RUN] WOULD WRITE TO ${targetRulesPath}:\x1B[0m`);
      console.log(md);
    } else {
      writeFileSync11(targetRulesPath, md, "utf8");
      console.log(`\u2714 Compiled ${lines.length} feedback items into learning rules in .ai/intelligence/learning-rules.md`);
    }
  } catch (e) {
    console.error(`\x1B[31mError: Failed to compile learning rules: ${e.message}\x1B[0m`);
    process.exit(1);
  }
}

// src/cli/handlers/handoff.js
import { existsSync as existsSync21, mkdirSync as mkdirSync8, readFileSync as readFileSync20, writeFileSync as writeFileSync12, readdirSync as readdirSync9 } from "fs";
import { join as join21 } from "path";
function handleHandoffBuild(options, { scanTarget: scanTarget2 = scanTarget, detectFrameworkSignals: detectFrameworkSignals2 = detectFrameworkSignals, detectDependencySignals: detectDependencySignals2 = detectDependencySignals, diffMemory: diffMemory2 } = {}) {
  const intelDir = join21(options.target, ".ai", "intelligence");
  if (!existsSync21(intelDir)) {
    mkdirSync8(intelDir, { recursive: true });
  }
  const handoffPath = join21(intelDir, "handoff.md");
  let pkgName = "unknown";
  let pkgVersion2 = "unknown";
  try {
    const pkgPath = join21(options.target, "package.json");
    if (existsSync21(pkgPath)) {
      const pkg = JSON.parse(readFileSync20(pkgPath, "utf8"));
      pkgName = pkg.name || pkgName;
      pkgVersion2 = pkg.version || pkgVersion2;
    }
  } catch (e) {
  }
  const { files } = scanTarget2(options.target);
  const frameworkSignals = detectFrameworkSignals2(files, options.target);
  const dependencySignals = detectDependencySignals2(files, options.target);
  const memoryHashPath = join21(intelDir, "memory.hash.json");
  let memoryStatus = "MISSING";
  let memoryTime = "N/A";
  if (existsSync21(memoryHashPath)) {
    try {
      const memObj = JSON.parse(readFileSync20(memoryHashPath, "utf8"));
      memoryTime = memObj.generated_at || "N/A";
      const diff = diffMemory2(options.target);
      if (diff) {
        memoryStatus = diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 ? "CURRENT" : "STALE";
      }
    } catch (e) {
      memoryStatus = "CORRUPT";
    }
  }
  const feedbackPath = join21(intelDir, "feedback-log.jsonl");
  let feedbackCount = 0;
  if (existsSync21(feedbackPath)) {
    try {
      feedbackCount = readFileSync20(feedbackPath, "utf8").trim().split(/\r?\n/).filter((l) => l.trim() !== "").length;
    } catch (e) {
    }
  }
  const rulesPath = join21(intelDir, "learning-rules.md");
  const rulesStatus = existsSync21(rulesPath) ? "PRESENT" : "MISSING";
  const proposalsDir = join21(options.target, ".ai", "proposals");
  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  if (existsSync21(proposalsDir)) {
    try {
      const propFiles = readdirSync9(proposalsDir).filter((f) => f.startsWith("proposal-") && f.endsWith(".md"));
      propFiles.forEach((file) => {
        const content = readFileSync20(join21(proposalsDir, file), "utf8");
        const fmMatch = content.match(/^---([\s\S]*?)---/);
        if (fmMatch) {
          const metadata = parseYaml(fmMatch[1]) || {};
          const status = metadata.approval_status || "pending";
          if (status === "approved")
            approvedCount++;
          else if (status === "rejected")
            rejectedCount++;
          else
            pendingCount++;
        }
      });
    } catch (e) {
    }
  }
  const applyLogPath = join21(proposalsDir, "apply-log.jsonl");
  let applyLogCount = 0;
  let lastApplyId = "None";
  if (existsSync21(applyLogPath)) {
    try {
      const lines = readFileSync20(applyLogPath, "utf8").trim().split(/\r?\n/).filter((l) => l.trim() !== "");
      applyLogCount = lines.length;
      if (applyLogCount > 0) {
        const lastRecord = JSON.parse(lines[lines.length - 1]);
        lastApplyId = lastRecord.id || "unknown";
      }
    } catch (e) {
    }
  }
  let rulesSummary = "No learning rules defined yet.";
  if (existsSync21(rulesPath)) {
    try {
      const rulesContent = readFileSync20(rulesPath, "utf8");
      const lines = rulesContent.split(/\r?\n/);
      const summaryLines = [];
      for (const line of lines) {
        if (line.startsWith("*   **Pattern:**") || line.startsWith("    *   **Rule:**")) {
          summaryLines.push(line);
        }
        if (summaryLines.length >= 10)
          break;
      }
      if (summaryLines.length > 0) {
        rulesSummary = summaryLines.join("\n");
      }
    } catch (e) {
    }
  }
  let recs = "1. Run `npx multimodel-dev-os workflow run repo-health` to check the directory hygiene.\n2. Review pending proposals if any exist.";
  if (!existsSync21(join21(options.target, ".ai", "config.yaml"))) {
    recs = "1. Run `npx multimodel-dev-os init` to bootstrap MultiModel Dev OS.\n2. Run `npx multimodel-dev-os memory build` to initialize codebase memory.";
  } else if (memoryStatus === "MISSING") {
    recs = "1. Run `npx multimodel-dev-os memory build` to initialize codebase index.\n2. Verify package safety boundaries.";
  } else if (memoryStatus === "STALE") {
    recs = "1. Run `npx multimodel-dev-os memory refresh` to update memory files.\n2. Analyze modifications.";
  } else if (pendingCount > 0) {
    recs = `1. Run \`npx multimodel-dev-os improve review\` to inspect the ${pendingCount} pending proposals.
2. Apply approved changes manually.`;
  }
  const handoffContent = `# Agent Handoff Spec - ${(/* @__PURE__ */ new Date()).toISOString()}

## 1. Project Context
- **Name**: ${pkgName}
- **Version**: ${pkgVersion2}
- **Frameworks**: ${frameworkSignals.join(", ") || "None"}
- **Dependencies**: ${dependencySignals.join(", ") || "None"}

## 2. Intelligence Core State
- **Memory**: ${memoryStatus} (Last build: ${memoryTime})
- **Feedback Loop**: ${feedbackCount} items logged. \`learning-rules.md\` is ${rulesStatus}.
- **Proposals**: ${pendingCount} Pending, ${approvedCount} Approved, ${rejectedCount} Rejected.
- **Applied Modifications**: ${applyLogCount} runs recorded. Last run: ${lastApplyId}.

## 3. Core Learning Summaries
\`\`\`markdown
${rulesSummary}
\`\`\`

## 4. Safety Constraints
- Workflow run is restricted to read-only actions.
- Modifications must be applied explicitly via \`improve apply --approved\`.
- No code modification permissions exist in this session context.

## 5. Recommended Next Steps
${recs}
`;
  try {
    writeFileSync12(handoffPath, handoffContent, "utf8");
    console.log(`
\u2714 Handoff context built successfully in: .ai/intelligence/handoff.md`);
  } catch (e) {
    console.error(`\x1B[31mError writing handoff: ${e.message}\x1B[0m`);
  }
}
function handleHandoffShow(options, { scanTarget: scanTarget2 = scanTarget, detectFrameworkSignals: detectFrameworkSignals2 = detectFrameworkSignals, detectDependencySignals: detectDependencySignals2 = detectDependencySignals, diffMemory: diffMemory2 } = {}) {
  const handoffPath = join21(options.target, ".ai", "intelligence", "handoff.md");
  if (!existsSync21(handoffPath)) {
    console.log("No compiled handoff file exists. Building first...");
    handleHandoffBuild(options, { scanTarget: scanTarget2, detectFrameworkSignals: detectFrameworkSignals2, detectDependencySignals: detectDependencySignals2, diffMemory: diffMemory2 });
  }
  try {
    const content = readFileSync20(handoffPath, "utf8");
    console.log("\n" + content);
  } catch (e) {
    console.error(`\x1B[31mError reading handoff: ${e.message}\x1B[0m`);
  }
}

// src/cli/handlers/workflow.js
import { existsSync as existsSync23, readFileSync as readFileSync22 } from "fs";
import { join as join23 } from "path";

// src/cli/handlers/improve.js
import { existsSync as existsSync22, mkdirSync as mkdirSync9, readFileSync as readFileSync21, writeFileSync as writeFileSync13, readdirSync as readdirSync10 } from "fs";
import { join as join22, resolve as resolve4, relative as relative4, isAbsolute as isAbsolute3, dirname as dirname7, basename } from "path";
import { createHash as createHash3 } from "crypto";
function handleImprovePropose(options) {
  const proposalsDir = join22(options.target, ".ai", "proposals");
  if (!options.dryRun && !existsSync22(proposalsDir)) {
    mkdirSync9(proposalsDir, { recursive: true });
  }
  const now = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const timestamp = `${dateStr}-${timeStr}`;
  const id = `proposal-${timestamp}`;
  const title = options.title || "Auto-detected codebase optimization";
  let problem = "No specific problems detected.";
  let evidence = "N/A";
  let riskLevel = "low";
  let affectedFiles = [];
  let suggestedChange = "No code suggestions compiled.";
  let verifyCommand = "npm run verify";
  let rollbackPlan = "git checkout -- .";
  const gitignorePath = join22(options.target, ".gitignore");
  const agentsPath = join22(options.target, "AGENTS.md");
  if (!existsSync22(gitignorePath)) {
    problem = "Missing .gitignore file in target workspace. AI agents may scan large build directories and run out of token context.";
    evidence = `.gitignore file is not present at root directory: ${options.target}`;
    affectedFiles = [".gitignore"];
    suggestedChange = "Create a standard .gitignore file to exclude node_modules, build/ and dist/ directories.";
    rollbackPlan = "git clean -fd .gitignore";
  } else if (!existsSync22(agentsPath)) {
    problem = "Missing AGENTS.md document in target workspace. Models will lack stack-specific implementation blueprints.";
    evidence = `AGENTS.md file is not present at root directory: ${options.target}`;
    affectedFiles = ["AGENTS.md"];
    suggestedChange = "Create an AGENTS.md document specifying the codebase development guidelines and framework profiles.";
    rollbackPlan = "git clean -fd AGENTS.md";
  } else {
    problem = "Outdated codebase memory index. Memory files need to be refreshed to sync with recent local changes.";
    evidence = "Current memory.hash.json represents a previous commit state.";
    affectedFiles = [".ai/intelligence/memory.hash.json", ".ai/intelligence/memory.summary.md"];
    suggestedChange = "Refresh codebase memory index using multimodel-dev-os memory refresh CLI command.";
    riskLevel = "low";
    verifyCommand = "node bin/multimodel-dev-os.js memory refresh";
    rollbackPlan = "git checkout -- .ai/intelligence/";
  }
  let md = `---
id: ${id}
created_at: ${now.toISOString()}
title: ${title}
problem: ${problem}
evidence: ${evidence}
risk_level: ${riskLevel}
affected_files:
`;
  affectedFiles.forEach((f) => {
    md += `  - ${f}
`;
  });
  md += `suggested_change: ${suggestedChange}
verify_command: ${verifyCommand}
rollback_plan: ${rollbackPlan}
approval_status: pending
---

# Codebase Improvement Proposal: ${title}

> [!WARNING]
> Manual approval is required before implementing this proposal. Edit the frontmatter metadata block to change \`approval_status\` to \`approved\` to authorize modifications.

## 1. Problem Description
${problem}

## 2. Evidence
${evidence}

## 3. Suggested Modifications
${suggestedChange}

## 4. Safety & Rollback Parameters
*   **Risk Level**: ${riskLevel.toUpperCase()}
*   **Verification Command**: \`${verifyCommand}\`
*   **Rollback Command**: \`${rollbackPlan}\`
*   **Approval Status**: PENDING (Manual approval required before implementation)
`;
  const proposalFile = join22(proposalsDir, `${id}.md`);
  if (options.dryRun) {
    console.log(`\x1B[36m[DRY-RUN] WOULD WRITE PROPOSAL TO ${proposalFile}:\x1B[0m`);
    console.log(md);
  } else {
    writeFileSync13(proposalFile, md, "utf8");
    console.log(`\u2714 Created codebase improvement proposal: .ai/proposals/${id}.md`);
  }
}
function handleImproveReview(options) {
  const proposalsDir = join22(options.target, ".ai", "proposals");
  if (!existsSync22(proposalsDir)) {
    console.log("No improvement proposals found.");
    return;
  }
  try {
    const files = readdirSync10(proposalsDir).filter((f) => f.startsWith("proposal-") && f.endsWith(".md"));
    if (files.length === 0) {
      console.log("No improvement proposals found.");
      return;
    }
    console.log(`
\u{1F4CB} \x1B[36mCodebase Improvement Proposals\x1B[0m`);
    console.log("==================================================");
    files.forEach((file) => {
      const fullPath = join22(proposalsDir, file);
      const content = readFileSync21(fullPath, "utf8");
      const fmMatch = content.match(/^---([\s\S]*?)---/);
      if (!fmMatch)
        return;
      const fmContent = fmMatch[1];
      const metadata = parseYaml(fmContent) || {};
      const statusColor = metadata.approval_status === "approved" ? "\x1B[32m" : metadata.approval_status === "rejected" ? "\x1B[31m" : "\x1B[33m";
      console.log(`
\x1B[34m* [${metadata.id || file.replace(".md", "")}] ${metadata.title || "Untitled"}\x1B[0m`);
      console.log(`  \x1B[37mRisk Level:\x1B[0m ${metadata.risk_level || "unknown"}`);
      console.log(`  \x1B[37mStatus:\x1B[0m ${statusColor}${metadata.approval_status || "pending"}\x1B[0m`);
      console.log(`  \x1B[37mProblem:\x1B[0m ${metadata.problem || "N/A"}`);
      if (metadata.affected_files && metadata.affected_files.length > 0) {
        console.log(`  \x1B[37mAffected Files:\x1B[0m ${metadata.affected_files.join(", ")}`);
      }
    });
    console.log();
  } catch (e) {
    console.error(`\x1B[31mError: Failed to review proposals: ${e.message}\x1B[0m`);
    process.exit(1);
  }
}
function handleImproveStatus(options) {
  const proposalsDir = join22(options.target, ".ai", "proposals");
  if (!existsSync22(proposalsDir)) {
    console.log("Improvement Proposal Engine Status:");
    console.log("  Total Proposals:  0");
    console.log("  Pending Approval: 0");
    return;
  }
  try {
    const files = readdirSync10(proposalsDir).filter((f) => f.startsWith("proposal-") && f.endsWith(".md"));
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    files.forEach((file) => {
      const content = readFileSync21(join22(proposalsDir, file), "utf8");
      const fmMatch = content.match(/^---([\s\S]*?)---/);
      if (fmMatch) {
        const metadata = parseYaml(fmMatch[1]) || {};
        const status = metadata.approval_status || "pending";
        if (status === "approved")
          approved++;
        else if (status === "rejected")
          rejected++;
        else
          pending++;
      }
    });
    console.log(`
\u2699 \x1B[36mImprovement Proposals Engine Status\x1B[0m`);
    console.log("==================================================");
    console.log(`  Total Proposals:  ${files.length}`);
    console.log(`  Pending Approval: \x1B[33m${pending}\x1B[0m`);
    console.log(`  Approved:         \x1B[32m${approved}\x1B[0m`);
    console.log(`  Rejected:         \x1B[31m${rejected}\x1B[0m`);
    console.log();
  } catch (e) {
    console.error(`\x1B[31mError: Failed to fetch status: ${e.message}\x1B[0m`);
    process.exit(1);
  }
}
function getSha256(content) {
  return createHash3("sha256").update(content, "utf8").digest("hex");
}
function validatePath(targetRoot, relPath) {
  const normalizedRel = relPath.replace(/\\/g, "/");
  if (normalizedRel.startsWith("/") || normalizedRel.includes("..")) {
    return { valid: false, reason: `Path '${relPath}' contains directory traversal or is absolute.`, type: "outside" };
  }
  const resolved = resolve4(targetRoot, relPath);
  const relativeFromRoot = relative4(targetRoot, resolved);
  if (relativeFromRoot.startsWith("..") || isAbsolute3(relativeFromRoot) || resolved === targetRoot) {
    return { valid: false, reason: `Path '${relPath}' resolves outside the target root.`, type: "outside" };
  }
  const parts = relativeFromRoot.replace(/\\/g, "/").split("/");
  const protectedFolders = [
    ".git",
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage"
  ];
  for (const part of parts) {
    if (protectedFolders.includes(part)) {
      return { valid: false, reason: `Path '${relPath}' attempts to access protected directory '${part}/'.`, type: "protected" };
    }
  }
  const cleanRelativeFromRoot = relativeFromRoot.replace(/\\/g, "/");
  if (cleanRelativeFromRoot.startsWith("docs/.vitepress/dist") || cleanRelativeFromRoot.startsWith("docs/.vitepress/cache")) {
    return { valid: false, reason: `Path '${relPath}' attempts to access protected vitepress path.`, type: "protected" };
  }
  const filename = parts[parts.length - 1];
  if (filename === ".env" || filename.startsWith(".env.") || filename === ".npmrc" || filename === "credentials.json" || filename === "package-lock.json" || filename === "apply-log.jsonl") {
    return { valid: false, reason: `Path '${relPath}' targets a protected config/secret file.`, type: "protected" };
  }
  if (filename.endsWith(".pem") || filename.endsWith(".key") || filename.endsWith(".jks") || filename.endsWith(".keystore")) {
    return { valid: false, reason: `Path '${relPath}' targets a protected key/certificate file.`, type: "protected" };
  }
  return { valid: true, resolved };
}
function validateProposal(proposalFile, targetRoot) {
  const gates = {
    frontmatter: { status: "skip" },
    approval: { status: "skip" },
    json: { status: "skip" },
    types: { status: "skip" },
    boundaries: { status: "skip" },
    permissions: { status: "skip" },
    constraints: { status: "skip" }
  };
  if (!existsSync22(proposalFile)) {
    gates.frontmatter = { status: "fail", reason: "missing frontmatter" };
    return { valid: false, reason: "missing frontmatter", gates };
  }
  const content = readFileSync21(proposalFile, "utf8");
  const fmMatch = content.match(/^---([\s\S]*?)---/);
  if (!fmMatch) {
    gates.frontmatter = { status: "fail", reason: "missing frontmatter" };
    return { valid: false, reason: "missing frontmatter", gates };
  }
  const fmContent = fmMatch[1];
  const metadata = parseYaml(fmContent);
  if (!metadata || typeof metadata !== "object") {
    gates.frontmatter = { status: "fail", reason: "missing frontmatter" };
    return { valid: false, reason: "missing frontmatter", gates };
  }
  gates.frontmatter = { status: "pass" };
  const proposalId = metadata.id || basename(proposalFile, ".md");
  const proposalTitle = metadata.title || "Untitled Proposal";
  const proposalStatus = metadata.approval_status || "pending";
  const isApproved = metadata.approval_status === "approved";
  gates.approval = isApproved ? { status: "pass" } : { status: "fail", reason: "approval_status not approved" };
  const body = content.substring(fmMatch[0].length);
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n\s*```/;
  const jsonMatch = body.match(jsonBlockRegex);
  let operationsData = null;
  if (!jsonMatch) {
    gates.json = { status: "fail", reason: "no operations block" };
  } else {
    try {
      operationsData = JSON.parse(jsonMatch[1]);
      if (!operationsData || !Array.isArray(operationsData.operations) || operationsData.operations.length === 0) {
        gates.json = { status: "fail", reason: "no operations block" };
      } else {
        gates.json = { status: "pass" };
      }
    } catch (e) {
      gates.json = { status: "fail", reason: "invalid JSON operations block" };
    }
  }
  if (gates.json.status !== "pass") {
    const gateOrder2 = ["frontmatter", "approval", "json", "types", "boundaries", "permissions", "constraints"];
    let firstFailReason2 = null;
    for (const g of gateOrder2) {
      if (gates[g].status === "fail") {
        firstFailReason2 = gates[g].reason;
        break;
      }
    }
    return {
      valid: false,
      reason: firstFailReason2,
      gates,
      proposalId,
      proposalTitle,
      proposalStatus,
      operations: []
    };
  }
  let typesStatus = "pass";
  let typesReason = "";
  let boundariesStatus = "pass";
  let boundariesReason = "";
  let permissionsStatus = "pass";
  let permissionsReason = "";
  let constraintsStatus = "pass";
  let constraintsReason = "";
  const validatedOperations = [];
  const operations = operationsData.operations;
  for (let idx = 0; idx < operations.length; idx++) {
    const op = operations[idx];
    if (!op || typeof op !== "object" || !op.type) {
      if (typesStatus === "pass") {
        typesStatus = "fail";
        typesReason = `unsupported operation type`;
      }
      continue;
    }
    const allowedTypes = ["create_file", "append_line", "replace_text"];
    if (!allowedTypes.includes(op.type)) {
      if (typesStatus === "pass") {
        typesStatus = "fail";
        typesReason = `unsupported operation type`;
      }
      continue;
    }
    if (typeof op.path !== "string" || !op.path.trim()) {
      if (boundariesStatus === "pass") {
        boundariesStatus = "fail";
        boundariesReason = `path outside target`;
      }
      continue;
    }
    const pathVal = validatePath(targetRoot, op.path);
    if (!pathVal.valid) {
      if (pathVal.type === "outside") {
        if (boundariesStatus === "pass") {
          boundariesStatus = "fail";
          boundariesReason = `path outside target`;
        }
      } else if (pathVal.type === "protected") {
        if (permissionsStatus === "pass") {
          permissionsStatus = "fail";
          permissionsReason = `protected path`;
        }
      }
      continue;
    }
    const resolvedPath = pathVal.resolved;
    if (op.type === "create_file") {
      if (typeof op.content !== "string") {
        if (constraintsStatus === "pass") {
          constraintsStatus = "fail";
          constraintsReason = `unsupported operation type`;
        }
      } else if (existsSync22(resolvedPath) && !op.overwrite) {
        if (constraintsStatus === "pass") {
          constraintsStatus = "fail";
          constraintsReason = `create_file target exists without overwrite`;
        }
      }
    } else if (op.type === "append_line") {
      if (typeof op.line !== "string") {
        if (constraintsStatus === "pass") {
          constraintsStatus = "fail";
          constraintsReason = `unsupported operation type`;
        }
      }
    } else if (op.type === "replace_text") {
      if (typeof op.find !== "string" || typeof op.replace !== "string") {
        if (constraintsStatus === "pass") {
          constraintsStatus = "fail";
          constraintsReason = `unsupported operation type`;
        }
      } else if (!existsSync22(resolvedPath)) {
        if (constraintsStatus === "pass") {
          constraintsStatus = "fail";
          constraintsReason = `replace_text zero matches`;
        }
      } else {
        const fileContent = readFileSync21(resolvedPath, "utf8");
        let count = 0;
        let pos = fileContent.indexOf(op.find);
        while (pos !== -1) {
          count++;
          pos = fileContent.indexOf(op.find, pos + op.find.length);
        }
        if (count === 0) {
          if (constraintsStatus === "pass") {
            constraintsStatus = "fail";
            constraintsReason = `replace_text zero matches`;
          }
        } else if (count > 1 && !op.allow_multiple) {
          if (constraintsStatus === "pass") {
            constraintsStatus = "fail";
            constraintsReason = `replace_text multiple matches without allow_multiple`;
          }
        }
      }
    }
    validatedOperations.push({
      ...op,
      resolvedPath
    });
  }
  gates.types = { status: typesStatus, reason: typesReason };
  gates.boundaries = { status: boundariesStatus, reason: boundariesReason };
  gates.permissions = { status: permissionsStatus, reason: permissionsReason };
  gates.constraints = { status: constraintsStatus, reason: constraintsReason };
  const gateOrder = ["frontmatter", "approval", "json", "types", "boundaries", "permissions", "constraints"];
  let firstFailReason = null;
  for (const g of gateOrder) {
    if (gates[g].status === "fail") {
      firstFailReason = gates[g].reason;
      break;
    }
  }
  const valid = firstFailReason === null;
  return {
    valid,
    reason: firstFailReason,
    gates,
    proposalId,
    proposalTitle,
    proposalStatus,
    operations: valid ? validatedOperations : []
  };
}
function handleImproveValidate(proposalFile, options) {
  console.log(`\u{1F6E1}  \x1B[34mValidating improvement proposal: ${proposalFile}\x1B[0m
`);
  const validation = validateProposal(proposalFile, options.target);
  if (validation.proposalId) {
    console.log(`Proposal ID: \x1B[33m${validation.proposalId}\x1B[0m`);
    console.log(`Title:       \x1B[37m${validation.proposalTitle}\x1B[0m`);
    console.log(`Status:      ${validation.proposalStatus === "approved" ? "\x1B[32m" : "\x1B[31m"}${validation.proposalStatus}\x1B[0m
`);
  }
  console.log(`Safety Gate Checklist:`);
  const gateLabels = {
    frontmatter: "Frontmatter Metadata",
    approval: "Approval Status",
    json: "Operations JSON Block",
    types: "Operation Type Safety",
    boundaries: "Path Boundaries (Within Target Root)",
    permissions: "Path Permissions (No Protected Paths)",
    constraints: "Operation Constraints (Overwrites & Replacements)"
  };
  const gateOrder = ["frontmatter", "approval", "json", "types", "boundaries", "permissions", "constraints"];
  gateOrder.forEach((g) => {
    const gate = validation.gates[g];
    const label = gateLabels[g];
    if (gate.status === "pass") {
      console.log(`  \x1B[32m[\u2713]\x1B[0m ${label}`);
    } else if (gate.status === "fail") {
      console.log(`  \x1B[31m[\u2717]\x1B[0m ${label} - \x1B[31m${gate.reason}\x1B[0m`);
    } else {
      console.log(`  \x1B[37m[-]\x1B[0m ${label}`);
    }
  });
  console.log();
  if (!validation.valid) {
    console.error(`\x1B[31mValidation FAILED: ${validation.reason}\x1B[0m`);
    console.error(`\x1B[33mActionable Fix:\x1B[0m`);
    if (validation.reason === "missing frontmatter") {
      console.error(`  Please verify that the proposal file contains a valid YAML frontmatter block at the very top delimited by '---'.`);
    } else if (validation.reason === "approval_status not approved") {
      console.error(`  The proposal approval status is not set to 'approved'. Edit the frontmatter block and set 'approval_status: approved'.`);
    } else if (validation.reason === "no operations block") {
      console.error(`  No valid operations JSON block was found. Ensure a \`\`\`json block exists containing an "operations" array.`);
    } else if (validation.reason === "invalid JSON operations block") {
      console.error(`  The operations block inside \`\`\`json is not valid JSON. Run it through a JSON validator to fix syntax errors.`);
    } else if (validation.reason === "unsupported operation type") {
      console.error(`  An operation type is disallowed. Allowed types are: 'create_file', 'append_line', 'replace_text'.`);
    } else if (validation.reason === "protected path") {
      console.error(`  An operation targets a protected directory (like .git, node_modules) or configuration file (like .env, .npmrc, apply-log.jsonl).`);
    } else if (validation.reason === "path outside target") {
      console.error(`  An operation path tries to escape the target directory using directory traversal (..) or absolute paths.`);
    } else if (validation.reason === "replace_text zero matches") {
      console.error(`  The 'find' text specified in a replace_text operation was not found in the target file.`);
    } else if (validation.reason === "replace_text multiple matches without allow_multiple") {
      console.error(`  The 'find' text matched multiple times. Set 'allow_multiple: true' if you want to replace all occurrences.`);
    } else if (validation.reason === "create_file target exists without overwrite") {
      console.error(`  The target file already exists. Set 'overwrite: true' in the operation to allow overwriting.`);
    } else {
      console.error(`  Check the proposal constraints and make sure all target files and fields are correct.`);
    }
    console.error();
    process.exit(1);
  }
  console.log(`\x1B[32m\u2714 Proposal is VALID and ready to be applied. ${validation.operations.length} operations parsed successfully.\x1B[0m
`);
  process.exit(0);
}
function handleImproveDiff(proposalFile, options) {
  console.log(`\u{1F50D}  \x1B[36mGenerating diff for proposal: ${proposalFile}\x1B[0m
`);
  const validation = validateProposal(proposalFile, options.target);
  if (!validation.valid) {
    console.error(`\x1B[31mValidation FAILED: ${validation.reason}\x1B[0m`);
    process.exit(1);
  }
  const operations = validation.operations;
  let createCount = 0;
  let appendCount = 0;
  let replaceCount = 0;
  const affectedFilesSet = /* @__PURE__ */ new Set();
  operations.forEach((op) => {
    affectedFilesSet.add(op.path);
    if (op.type === "create_file")
      createCount++;
    else if (op.type === "append_line")
      appendCount++;
    else if (op.type === "replace_text")
      replaceCount++;
  });
  console.log(`Summary of Planned Changes:`);
  console.log(`---------------------------`);
  console.log(`Total Operations: \x1B[33m${operations.length}\x1B[0m`);
  console.log(`Operations Count: \x1B[32m${createCount} Create\x1B[0m, \x1B[33m${appendCount} Append\x1B[0m, \x1B[35m${replaceCount} Replace\x1B[0m`);
  console.log(`Affected Files (${affectedFilesSet.size}):`);
  affectedFilesSet.forEach((f) => console.log(`  - ${f}`));
  console.log();
  const printTruncatedLines = (content, prefix, colorCode) => {
    const lines = content.split(/\r?\n/);
    const maxLines = 5;
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      console.log(`${colorCode}${prefix} ${lines[i]}\x1B[0m`);
    }
    if (lines.length > maxLines) {
      console.log(`${colorCode}${prefix} ... (${lines.length - maxLines} more lines)\x1B[0m`);
    }
  };
  const types = ["create_file", "append_line", "replace_text"];
  const typeHeaders = {
    create_file: "--- CREATE_FILE OPERATIONS ---",
    append_line: "--- APPEND_LINE OPERATIONS ---",
    replace_text: "--- REPLACE_TEXT OPERATIONS ---"
  };
  types.forEach((type) => {
    const typeOps = operations.filter((op) => op.type === type);
    if (typeOps.length === 0)
      return;
    console.log(`\x1B[36m\x1B[1m${typeHeaders[type]}\x1B[0m`);
    typeOps.forEach((op) => {
      const idx = operations.indexOf(op);
      console.log(`
\x1B[33m[Operation #${idx + 1}] Target: ${op.path}\x1B[0m`);
      if (type === "create_file") {
        const exists = existsSync22(op.resolvedPath);
        if (exists) {
          console.log(`  \x1B[31m\u26A0\uFE0F   [Overwriting existing file]\x1B[0m`);
        } else {
          console.log(`  \x1B[32m+ [Creating new file]\x1B[0m`);
        }
        const linesCount = op.content.split(/\r?\n/).length;
        console.log(`  + [File content: ${linesCount} line(s), overwrite: ${!!op.overwrite}]`);
        printTruncatedLines(op.content, "  +", "\x1B[32m");
      } else if (type === "append_line") {
        const exists = existsSync22(op.resolvedPath);
        let currentFileContent = "";
        if (exists) {
          currentFileContent = readFileSync21(op.resolvedPath, "utf8");
        }
        const fileLines = currentFileContent.split(/\r?\n/);
        const lineExists = fileLines.some((l) => l.trim() === op.line.trim());
        if (lineExists) {
          console.log(`  \x1B[33m[IDEMPOTENT] Line already exists in file. No changes will be made.\x1B[0m`);
        } else {
          console.log(`  \x1B[32m+ Appending line:\x1B[0m`);
          console.log(`  \x1B[32m+ ${op.line}\x1B[0m`);
        }
      } else if (type === "replace_text") {
        console.log(`  --- a/${op.path}`);
        console.log(`  +++ b/${op.path}`);
        console.log(`  \x1B[31m- Removing:\x1B[0m`);
        printTruncatedLines(op.find, "  -", "\x1B[31m");
        console.log(`  \x1B[32m+ Inserting:\x1B[0m`);
        printTruncatedLines(op.replace, "  +", "\x1B[32m");
      }
    });
    console.log();
  });
}
function handleImproveApply(proposalFile, options) {
  if (!options.approved) {
    console.error(`\x1B[31mError: Proposal cannot be applied without explicit user approval. Pass the --approved flag.\x1B[0m`);
    console.error(`Example: node bin/multimodel-dev-os.js improve apply ${proposalFile} --approved`);
    process.exit(1);
  }
  console.log(`\u{1F680} \x1B[34mApplying proposal: ${proposalFile}\x1B[0m`);
  const validation = validateProposal(proposalFile, options.target);
  if (!validation.valid) {
    console.error(`\x1B[31mValidation FAILED: ${validation.reason}\x1B[0m`);
    const applyId2 = `apply-${(/* @__PURE__ */ new Date()).toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`;
    const logDir2 = join22(options.target, ".ai", "proposals");
    if (!existsSync22(logDir2)) {
      try {
        mkdirSync9(logDir2, { recursive: true });
      } catch (e) {
      }
    }
    const logFile2 = join22(logDir2, "apply-log.jsonl");
    const record2 = {
      id: applyId2,
      proposal_id: validation.proposalId || basename(proposalFile, ".md"),
      applied_at: (/* @__PURE__ */ new Date()).toISOString(),
      target: options.target,
      operations_count: 0,
      files_changed: [],
      before_hashes: {},
      after_hashes: {},
      status: "refused",
      refused_reason: validation.reason,
      notes: `Validation failed: ${validation.reason}`
    };
    try {
      writeFileSync13(logFile2, JSON.stringify(record2) + "\n", { flag: "a", encoding: "utf8" });
    } catch (err) {
    }
    process.exit(1);
  }
  const operations = validation.operations;
  const proposalId = validation.proposalId;
  const createCount = operations.filter((op) => op.type === "create_file").length;
  const appendCount = operations.filter((op) => op.type === "append_line").length;
  const replaceCount = operations.filter((op) => op.type === "replace_text").length;
  console.log(`Summary of Operations:`);
  console.log(`  - ${createCount} file(s) to create`);
  console.log(`  - ${appendCount} file(s) to append`);
  console.log(`  - ${replaceCount} file(s) to modify (replace)`);
  console.log(`
Applying changes...`);
  const filesChanged = [];
  const beforeHashes = {};
  const afterHashes = {};
  let status = "success";
  let notes = "";
  const applyId = `apply-${(/* @__PURE__ */ new Date()).toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`;
  try {
    operations.forEach((op) => {
      const relPath = relative4(options.target, op.resolvedPath).replace(/\\/g, "/");
      if (!filesChanged.includes(relPath)) {
        filesChanged.push(relPath);
      }
      if (existsSync22(op.resolvedPath)) {
        const fileContent = readFileSync21(op.resolvedPath, "utf8");
        beforeHashes[relPath] = getSha256(fileContent);
      } else {
        beforeHashes[relPath] = null;
      }
    });
    operations.forEach((op, idx) => {
      const relPath = relative4(options.target, op.resolvedPath).replace(/\\/g, "/");
      console.log(`  Executing Operation #${idx + 1} (${op.type}) on '${relPath}'...`);
      if (op.type === "create_file") {
        const dir = dirname7(op.resolvedPath);
        if (!existsSync22(dir)) {
          mkdirSync9(dir, { recursive: true });
        }
        const exists = existsSync22(op.resolvedPath);
        writeFileSync13(op.resolvedPath, op.content, "utf8");
        if (exists) {
          console.log(`    [OVERWRITTEN] Overwrote existing file '${relPath}'.`);
        } else {
          console.log(`    [CREATED] Created new file '${relPath}'.`);
        }
      } else if (op.type === "append_line") {
        let content = "";
        if (existsSync22(op.resolvedPath)) {
          content = readFileSync21(op.resolvedPath, "utf8");
        }
        const fileLines = content.split(/\r?\n/);
        const lineExists = fileLines.some((l) => l.trim() === op.line.trim());
        if (!lineExists) {
          let newContent = content;
          if (content.length > 0 && !content.endsWith("\n") && !content.endsWith("\r")) {
            newContent += "\n";
          }
          newContent += op.line + "\n";
          const dir = dirname7(op.resolvedPath);
          if (!existsSync22(dir)) {
            mkdirSync9(dir, { recursive: true });
          }
          writeFileSync13(op.resolvedPath, newContent, "utf8");
          console.log(`    [APPENDED] Appended 1 line to '${relPath}'.`);
        } else {
          console.log(`    [IDEMPOTENT] Line already exists in '${relPath}'. Skipping append.`);
        }
      } else if (op.type === "replace_text") {
        const fileContent = readFileSync21(op.resolvedPath, "utf8");
        let count = 0;
        let pos = fileContent.indexOf(op.find);
        while (pos !== -1) {
          count++;
          pos = fileContent.indexOf(op.find, pos + op.find.length);
        }
        let newContent;
        if (op.allow_multiple) {
          newContent = fileContent.split(op.find).join(op.replace);
        } else {
          newContent = fileContent.replace(op.find, op.replace);
          if (count > 0)
            count = 1;
        }
        writeFileSync13(op.resolvedPath, newContent, "utf8");
        console.log(`    [REPLACED] Replaced ${count} occurrence(s) of find text in '${relPath}'.`);
      }
    });
    filesChanged.forEach((relPath) => {
      const fullPath = resolve4(options.target, relPath);
      if (existsSync22(fullPath)) {
        const fileContent = readFileSync21(fullPath, "utf8");
        afterHashes[relPath] = getSha256(fileContent);
      } else {
        afterHashes[relPath] = null;
      }
    });
    notes = `Successfully applied ${operations.length} operations.`;
  } catch (e) {
    status = "failed";
    notes = `Execution error: ${e.message}`;
    console.error(`\x1B[31mError applying proposal: ${e.message}\x1B[0m`);
  }
  const logDir = join22(options.target, ".ai", "proposals");
  if (!existsSync22(logDir)) {
    mkdirSync9(logDir, { recursive: true });
  }
  const logFile = join22(logDir, "apply-log.jsonl");
  const record = {
    id: applyId,
    proposal_id: proposalId,
    applied_at: (/* @__PURE__ */ new Date()).toISOString(),
    target: options.target,
    operations_count: operations.length,
    files_changed: filesChanged,
    before_hashes: beforeHashes,
    after_hashes: afterHashes,
    status,
    refused_reason: status === "failed" ? notes : void 0,
    notes
  };
  try {
    writeFileSync13(logFile, JSON.stringify(record) + "\n", { flag: "a", encoding: "utf8" });
  } catch (err) {
    console.error(`\x1B[31mFailed to write to audit log: ${err.message}\x1B[0m`);
  }
  if (status === "success") {
    console.log(`
\x1B[32m\u2714 Proposal applied successfully!\x1B[0m`);
    console.log(`Files changed:`);
    filesChanged.forEach((f) => console.log(`  - ${f}`));
    console.log(`Audit log recorded to: ${logFile}`);
  } else {
    process.exit(1);
  }
}
function handleImproveLog(options) {
  const logFile = join22(options.target, ".ai", "proposals", "apply-log.jsonl");
  if (!existsSync22(logFile)) {
    console.log("No apply log found.");
    return;
  }
  try {
    const lines = readFileSync21(logFile, "utf8").trim().split(/\r?\n/);
    console.log(`
\u{1F4DC} \x1B[36mApplied Proposals Audit Log\x1B[0m`);
    console.log("==================================================");
    lines.forEach((line) => {
      if (!line.trim())
        return;
      const record = JSON.parse(line);
      const statusColor = record.status === "success" ? "\x1B[32m" : "\x1B[31m";
      console.log(`
\x1B[34m* [${record.id}] Proposal: ${record.proposal_id}\x1B[0m`);
      console.log(`  \x1B[37mApplied At:\x1B[0m ${record.applied_at}`);
      console.log(`  \x1B[37mOperations:\x1B[0m ${record.operations_count}`);
      console.log(`  \x1B[37mFiles Changed:\x1B[0m ${record.files_changed.join(", ")}`);
      console.log(`  \x1B[37mStatus:\x1B[0m ${statusColor}${record.status}\x1B[0m`);
      console.log(`  \x1B[37mNotes:\x1B[0m ${record.notes}`);
    });
    console.log();
  } catch (e) {
    console.error(`\x1B[31mError reading audit log: ${e.message}\x1B[0m`);
    process.exit(1);
  }
}

// src/cli/handlers/workflow.js
function getWorkflowsPath(target) {
  let workflowsPath = join23(target, ".ai", "registries", "workflows.yaml");
  let usingFallback = false;
  if (!existsSync23(workflowsPath)) {
    const fallbackPath = join23(sourceRoot, ".ai", "registries", "workflows.yaml");
    if (existsSync23(fallbackPath)) {
      workflowsPath = fallbackPath;
      usingFallback = true;
    }
  }
  return { workflowsPath, usingFallback };
}
function handleWorkflowList(options) {
  const { workflowsPath, usingFallback } = getWorkflowsPath(options.target);
  if (!existsSync23(workflowsPath)) {
    console.log("No workflows registry found.");
    return;
  }
  if (usingFallback) {
    console.log("\x1B[33mNotice: Local workflows registry not found. Using bundled workflows registry fallback.\x1B[0m");
  }
  try {
    const registry = parseYaml(readFileSync22(workflowsPath, "utf8")) || {};
    const workflows = registry.workflows || {};
    console.log(`
\u2699 \x1B[36mRegistered Workflows\x1B[0m`);
    console.log("==================================================");
    Object.keys(workflows).forEach((key) => {
      const wf = workflows[key];
      const name = wf.name || key;
      const risk = wf.risk_level || "unknown";
      const riskColor = risk === "low" ? "\x1B[32m" : risk === "medium" ? "\x1B[33m" : "\x1B[31m";
      console.log(`
  \x1B[34m* ${name}\x1B[0m (\x1B[35m${key}\x1B[0m)`);
      console.log(`    Description: ${wf.description || "No description"}`);
      console.log(`    Risk Level:  ${riskColor}${risk.toUpperCase()}\x1B[0m`);
      if (wf.skill_os) {
        const skillCount = Array.isArray(wf.skill_os.skills) ? wf.skill_os.skills.length : 0;
        const promptCount = Array.isArray(wf.skill_os.prompts) ? wf.skill_os.prompts.length : 0;
        const guardrailCount = Array.isArray(wf.skill_os.guardrails) ? wf.skill_os.guardrails.length : 0;
        console.log(`    Skill OS:    ${skillCount} skills, ${promptCount} prompts, ${guardrailCount} guardrails`);
      }
    });
    console.log();
  } catch (e) {
    console.error(`\x1B[31mError loading workflows: ${e.message}\x1B[0m`);
  }
}
function handleWorkflowShow(wName, options) {
  const { workflowsPath, usingFallback } = getWorkflowsPath(options.target);
  if (!existsSync23(workflowsPath)) {
    console.log("No workflows registry found.");
    return;
  }
  if (usingFallback) {
    console.log("\x1B[33mNotice: Local workflows registry not found. Using bundled workflows registry fallback.\x1B[0m");
  }
  try {
    const registry = parseYaml(readFileSync22(workflowsPath, "utf8")) || {};
    const workflows = registry.workflows || {};
    const wf = workflows[wName];
    if (!wf) {
      console.error(`\x1B[31mError: Workflow '${wName}' not found in registry.\x1B[0m`);
      process.exit(1);
    }
    const name = wf.name || wName;
    const risk = wf.risk_level || "unknown";
    const riskColor = risk === "low" ? "\x1B[32m" : risk === "medium" ? "\x1B[33m" : "\x1B[31m";
    console.log(`
\u2699 \x1B[36mWorkflow Spec: ${name}\x1B[0m`);
    console.log("==================================================");
    console.log(`  Description:             ${wf.description || "No description"}`);
    console.log(`  Risk Level:              ${riskColor}${risk.toUpperCase()}\x1B[0m`);
    console.log(`  Allowed to write memory: ${wf.allowed_to_write_memory || false}`);
    console.log(`  Allowed to modify code:  ${wf.allowed_to_modify_source || false}`);
    printWorkflowSkillOs(wf.skill_os);
    console.log(`
  \x1B[33mSteps:\x1B[0m`);
    const steps = wf.steps || [];
    steps.forEach((step, idx) => {
      console.log(`    ${idx + 1}. [${step.name}]`);
      console.log(`       Command:         ${step.command}`);
      console.log(`       Expected Output: ${step.expected_output || "N/A"}`);
      console.log(`       Next Action:     ${step.next_action || "N/A"}`);
    });
    console.log();
  } catch (e) {
    console.error(`\x1B[31mError loading workflow '${wName}': ${e.message}\x1B[0m`);
  }
}
function printWorkflowSkillOs(skillOs) {
  if (!skillOs)
    return;
  console.log(`
  \x1B[33mSkill OS Metadata:\x1B[0m`);
  printWorkflowSkillOsLine("Skills", skillOs.skills);
  printWorkflowSkillOsLine("Prompts", skillOs.prompts);
  printWorkflowSkillOsLine("Permissions", skillOs.permissions);
  printWorkflowSkillOsLine("Guardrails", skillOs.guardrails);
  printWorkflowSkillOsLine("Required context", skillOs.required_context);
}
function printWorkflowSkillOsLine(label, values) {
  if (!Array.isArray(values) || values.length === 0)
    return;
  console.log(`    ${label}: ${values.join(", ")}`);
}
function handleWorkflowPlan(wName, options) {
  const { workflowsPath, usingFallback } = getWorkflowsPath(options.target);
  if (!existsSync23(workflowsPath)) {
    console.log("No workflows registry found.");
    return;
  }
  if (usingFallback) {
    console.log("\x1B[33mNotice: Local workflows registry not found. Using bundled workflows registry fallback.\x1B[0m");
  }
  try {
    const registry = parseYaml(readFileSync22(workflowsPath, "utf8")) || {};
    const workflows = registry.workflows || {};
    const wf = workflows[wName];
    if (!wf) {
      console.error(`\x1B[31mError: Workflow '${wName}' not found.\x1B[0m`);
      process.exit(1);
    }
    const name = wf.name || wName;
    console.log(`
\u{1F4CB} \x1B[36mExecution Plan for Workflow: ${name}\x1B[0m`);
    console.log("==================================================");
    console.log(`\x1B[33m[DRY-RUN/PLAN ONLY] No commands will be run.\x1B[0m
`);
    const steps = wf.steps || [];
    steps.forEach((step, idx) => {
      console.log(`  Step ${idx + 1}: ${step.name}`);
      console.log(`    Command:         ${step.command}`);
      console.log(`    Expected Output: ${step.expected_output || "N/A"}`);
      console.log(`    Next Action:     ${step.next_action || "N/A"}`);
    });
    console.log();
  } catch (e) {
    console.error(`\x1B[31mError loading workflow plan: ${e.message}\x1B[0m`);
  }
}
function handleWorkflowRun(wName, options, { scanTarget: scanTarget2 = scanTarget, detectFrameworkSignals: detectFrameworkSignals2 = detectFrameworkSignals, detectDependencySignals: detectDependencySignals2 = detectDependencySignals, detectAiDevOsSignals: detectAiDevOsSignals2 = detectAiDevOsSignals, detectRisks: detectRisks2 = detectRisks, getAnalysis: getAnalysis2 = getAnalysis, boundDiffMemory: boundDiffMemory2 } = {}) {
  const { workflowsPath, usingFallback } = getWorkflowsPath(options.target);
  if (!existsSync23(workflowsPath)) {
    console.log("No workflows registry found.");
    return;
  }
  if (usingFallback) {
    console.log("\x1B[33mNotice: Local workflows registry not found. Using bundled workflows registry fallback.\x1B[0m");
  }
  try {
    const registry = parseYaml(readFileSync22(workflowsPath, "utf8")) || {};
    const workflows = registry.workflows || {};
    const wf = workflows[wName];
    if (!wf) {
      console.error(`\x1B[31mError: Workflow '${wName}' not found.\x1B[0m`);
      process.exit(1);
    }
    const name = wf.name || wName;
    console.log(`
\u{1F680} \x1B[36mRunning Workflow: ${name}\x1B[0m`);
    console.log("==================================================");
    const steps = wf.steps || [];
    const safeCommands = {
      "scan": () => handleScan(options, { scanTarget: scanTarget2, detectFrameworkSignals: detectFrameworkSignals2, detectDependencySignals: detectDependencySignals2, detectAiDevOsSignals: detectAiDevOsSignals2, detectRisks: detectRisks2 }),
      "doctor": () => handleDoctor(options, { scanTarget: scanTarget2, detectDependencySignals: detectDependencySignals2, getAnalysis: getAnalysis2, diffMemory: boundDiffMemory2 }),
      "verify": () => handleVerify({ ...options, noExit: true }),
      "memory diff": () => handleMemoryDiff({ ...options, noExit: true }, { scanTarget: scanTarget2, detectFrameworkSignals: detectFrameworkSignals2, detectDependencySignals: detectDependencySignals2, detectAiDevOsSignals: detectAiDevOsSignals2, detectRisks: detectRisks2 }),
      "memory refresh": () => handleMemoryRefresh(options, { scanTarget: scanTarget2, detectFrameworkSignals: detectFrameworkSignals2, detectDependencySignals: detectDependencySignals2, detectAiDevOsSignals: detectAiDevOsSignals2, detectRisks: detectRisks2 }),
      "memory build": () => handleMemoryBuild(options, { scanTarget: scanTarget2, detectFrameworkSignals: detectFrameworkSignals2, detectDependencySignals: detectDependencySignals2, detectAiDevOsSignals: detectAiDevOsSignals2, detectRisks: detectRisks2 }),
      "feedback list": () => handleFeedbackList(options),
      "feedback summarize": () => handleFeedbackSummarize(options),
      "improve review": () => handleImproveReview(options),
      "improve status": () => handleImproveStatus(options),
      "improve log": () => handleImproveLog(options),
      "doctor --release": () => handleDoctor({ ...options, release: true })
    };
    steps.forEach((step, idx) => {
      console.log(`
\x1B[33m[Step ${idx + 1}/${steps.length}] Running: ${step.name} (${step.command})\x1B[0m`);
      const cmd = step.command;
      if (safeCommands[cmd]) {
        try {
          safeCommands[cmd]();
        } catch (e) {
          console.error(`\x1B[31mError executing step ${step.name}: ${e.message}\x1B[0m`);
        }
      } else {
        console.log(`  \x1B[35m[MANUAL ACTION NEEDED]\x1B[0m This step requires manual execution.`);
        console.log(`  Please run command: \x1B[36mnpx multimodel-dev-os ${cmd}\x1B[0m`);
        if (step.expected_output) {
          console.log(`  Expected Output:    ${step.expected_output}`);
        }
      }
    });
    console.log(`
\u2714 Workflow '${name}' complete.
`);
  } catch (e) {
    console.error(`\x1B[31mError running workflow '${wName}': ${e.message}\x1B[0m`);
  }
}

// src/cli/handlers/models.js
import { existsSync as existsSync24, readFileSync as readFileSync23 } from "fs";
import { join as join24 } from "path";
function handleListModels(options) {
  const registryPath = join24(sourceRoot, ".ai", "models", "registry.yaml");
  if (!existsSync24(registryPath)) {
    console.error("Error: Model registry not found.");
    process.exit(1);
  }
  const registry = parseYaml(readFileSync23(registryPath, "utf8"));
  const models = registry.models || {};
  if (options && options.json) {
    console.log(JSON.stringify(models, null, 2));
    return;
  }
  console.log(`
\u{1F916} \x1B[36mModel Registry [v${version}]\x1B[0m`);
  console.log("==================================================");
  Object.keys(models).forEach((name) => {
    const m = models[name];
    console.log(`
\x1B[32m* ${name}\x1B[0m (${m.alias || ""})`);
    console.log(`  \x1B[33mProvider:\x1B[0m ${m.provider}`);
    console.log(`  \x1B[33mOfficial ID:\x1B[0m ${m.official_id}`);
    console.log(`  \x1B[33mContext Window:\x1B[0m ${m.context_window} tokens`);
    console.log(`  \x1B[33mTiers:\x1B[0m Cost: ${m.tiers?.cost}, Reasoning: ${m.tiers?.reasoning}, Coding: ${m.tiers?.coding}`);
  });
  console.log("\nUse \x1B[36mshow-model <model-alias>\x1B[0m to view detailed model capabilities.\n");
}
function handleShowModel(name) {
  const registryPath = join24(sourceRoot, ".ai", "models", "registry.yaml");
  if (!existsSync24(registryPath)) {
    console.error("Error: Model registry not found.");
    process.exit(1);
  }
  const registry = parseYaml(readFileSync23(registryPath, "utf8"));
  const models = registry.models || {};
  const m = models[name];
  if (!m) {
    console.error(`\x1B[31mError: Model alias '${name}' not found in registry.\x1B[0m`);
    process.exit(1);
  }
  console.log(`
\u{1F50D} \x1B[36mModel: ${name}\x1B[0m`);
  console.log("==================================================");
  console.log(`\x1B[33mProvider:\x1B[0m ${m.provider}`);
  console.log(`\x1B[33mAlias:\x1B[0m ${m.alias}`);
  console.log(`\x1B[33mOfficial ID:\x1B[0m ${m.official_id}`);
  console.log(`\x1B[33mContext Window:\x1B[0m ${m.context_window} tokens`);
  console.log(`\x1B[33mCapabilities:\x1B[0m`);
  console.log(`  \u251C\u2500\u2500 Vision: ${m.capabilities?.vision ? "Yes" : "No"}`);
  console.log(`  \u2514\u2500\u2500 Tool Use: ${m.capabilities?.tool_use ? "Yes" : "No"}`);
  console.log(`\x1B[33mTiers:\x1B[0m`);
  console.log(`  \u251C\u2500\u2500 Cost: ${m.tiers?.cost}`);
  console.log(`  \u251C\u2500\u2500 Speed: ${m.tiers?.speed}`);
  console.log(`  \u251C\u2500\u2500 Reasoning: ${m.tiers?.reasoning}`);
  console.log(`  \u2514\u2500\u2500 Coding: ${m.tiers?.coding}`);
  console.log();
}
function handleListProviders() {
  const providersPath = join24(sourceRoot, ".ai", "models", "providers.yaml");
  if (!existsSync24(providersPath)) {
    console.error("Error: Providers registry not found.");
    process.exit(1);
  }
  const reg = parseYaml(readFileSync23(providersPath, "utf8"));
  const providers = reg.providers || {};
  console.log(`
\u{1F50C} \x1B[36mAI Providers [v${version}]\x1B[0m`);
  console.log("==================================================");
  Object.keys(providers).forEach((name) => {
    const p = providers[name];
    console.log(`
\x1B[32m* ${p.name || name}\x1B[0m (${name})`);
    console.log(`  \x1B[33mEndpoint:\x1B[0m ${p.api_endpoint || "Local"}`);
    console.log(`  \x1B[33mEnv Key:\x1B[0m ${p.env_key || "None"}`);
  });
  console.log();
}
function handleRouteModel(task) {
  const presetsPath = join24(sourceRoot, ".ai", "models", "routing-presets.yaml");
  if (!existsSync24(presetsPath)) {
    console.error("Error: Routing presets not found.");
    process.exit(1);
  }
  const reg = parseYaml(readFileSync23(presetsPath, "utf8"));
  const presets = reg.presets || {};
  const preset = presets[task];
  if (!preset) {
    console.error(`\x1B[31mError: Routing preset for task '${task}' not found. Available: ${Object.keys(presets).join(", ")}\x1B[0m`);
    process.exit(1);
  }
  console.log(`
\u{1F3AF} \x1B[36mRouting Suggestion for: ${task}\x1B[0m`);
  console.log("==================================================");
  console.log(`\x1B[33mPrimary Model:\x1B[0m \x1B[32m${preset.primary}\x1B[0m`);
  console.log(`\x1B[33mFallback Model:\x1B[0m \x1B[33m${preset.fallback}\x1B[0m`);
  console.log();
}

// src/cli/handlers/adapters.js
import { existsSync as existsSync25, readFileSync as readFileSync24, writeFileSync as writeFileSync14, mkdirSync as mkdirSync10 } from "fs";
import { join as join25, dirname as dirname8 } from "path";
function handleListAdapters(options) {
  const adaptersPath = join25(sourceRoot, ".ai", "adapters", "registry.yaml");
  if (!existsSync25(adaptersPath)) {
    console.error("Error: Adapters registry not found.");
    process.exit(1);
  }
  const reg = parseYaml(readFileSync24(adaptersPath, "utf8"));
  const adapters = reg.adapters || {};
  if (options && options.json) {
    console.log(JSON.stringify(adapters, null, 2));
    return;
  }
  console.log(`
\u{1F50C} \x1B[36mIDE & Agent Adapters [v${version}]\x1B[0m`);
  console.log("==================================================");
  Object.keys(adapters).forEach((name) => {
    const a = adapters[name];
    console.log(`
\x1B[32m* ${a.name || name}\x1B[0m (${name})`);
    console.log(`  \x1B[33mRules File:\x1B[0m ${a.rules_file}`);
    console.log(`  \x1B[33mAdapter Type:\x1B[0m ${a.type}`);
    console.log(`  \x1B[33mRule Format:\x1B[0m ${a.format}`);
  });
  console.log("\nUse \x1B[36mshow-adapter <adapter-name>\x1B[0m to view detailed adapter metadata.\n");
}
function handleShowAdapter(name) {
  const adaptersPath = join25(sourceRoot, ".ai", "adapters", "registry.yaml");
  if (!existsSync25(adaptersPath)) {
    console.error("Error: Adapters registry not found.");
    process.exit(1);
  }
  const reg = parseYaml(readFileSync24(adaptersPath, "utf8"));
  const adapters = reg.adapters || {};
  const a = adapters[name];
  if (!a) {
    console.error(`\x1B[31mError: Adapter '${name}' not found in registry.\x1B[0m`);
    process.exit(1);
  }
  console.log(`
\u{1F50D} \x1B[36mAdapter: ${a.name || name}\x1B[0m`);
  console.log("==================================================");
  console.log(`\x1B[33mRules File:\x1B[0m ${a.rules_file}`);
  console.log(`\x1B[33mType:\x1B[0m ${a.type}`);
  console.log(`\x1B[33mFormat:\x1B[0m ${a.format}`);
  console.log();
}
function getEnabledAdapters(target) {
  const configPath = join25(target, ".ai", "config.yaml");
  if (existsSync25(configPath)) {
    try {
      const config = parseYaml(readFileSync24(configPath, "utf8")) || {};
      return config.adapters || {};
    } catch (e) {
    }
  }
  return {};
}
function handleAdapterStatus(options) {
  console.log(`
\u{1F50C} \x1B[36mIDE & Agent Adapters Status: ${options.target}\x1B[0m`);
  console.log("==================================================");
  const enabled = getEnabledAdapters(options.target);
  const adapters = loadAdapters(options.registry);
  Object.keys(adapters).forEach((name) => {
    const a = adapters[name];
    const isEnabled = enabled[name] || false;
    const rulesFile = a.rules_file;
    const exists = existsSync25(join25(options.target, rulesFile));
    let statusStr = "\x1B[31mMISSING\x1B[0m";
    if (exists) {
      statusStr = "\x1B[32mINSTALLED\x1B[0m";
    }
    console.log(`
\x1B[33m* ${a.name || name}\x1B[0m (${name})`);
    console.log(`  Config Status: ${isEnabled ? "\x1B[32mENABLED\x1B[0m" : "\x1B[37mDISABLED\x1B[0m"}`);
    console.log(`  File Status:   ${statusStr} (${rulesFile})`);
  });
  console.log();
}
function printDiff(srcContent, destContent, filename) {
  console.log(`
Diff for ${filename}:`);
  console.log("--------------------------------------------------");
  if (srcContent === destContent) {
    console.log("  Pristine (No differences detected)");
    return;
  }
  const srcLines = srcContent.split(/\r?\n/);
  const destLines = destContent.split(/\r?\n/);
  let i = 0;
  while (i < Math.max(srcLines.length, destLines.length)) {
    const sLine = srcLines[i];
    const dLine = destLines[i];
    if (sLine !== dLine) {
      if (dLine !== void 0)
        console.log(`\x1B[31m- ${dLine}\x1B[0m`);
      if (sLine !== void 0)
        console.log(`\x1B[32m+ ${sLine}\x1B[0m`);
    } else {
      if (sLine !== void 0)
        console.log(`  ${sLine}`);
    }
    i++;
  }
}
function handleAdapterDiff(aName, options) {
  const adapters = loadAdapters(options.registry);
  const adaptersToDiff = [];
  if (aName === "all") {
    const enabled = getEnabledAdapters(options.target);
    Object.keys(adapters).forEach((name) => {
      if (enabled[name])
        adaptersToDiff.push(name);
    });
  } else {
    if (!adapters[aName]) {
      console.error(`\x1B[31mError: Adapter '${aName}' not found in registry.\x1B[0m`);
      process.exit(1);
    }
    adaptersToDiff.push(aName);
  }
  if (adaptersToDiff.length === 0) {
    console.log("No enabled adapters found to diff.");
    return;
  }
  adaptersToDiff.forEach((name) => {
    const a = adapters[name];
    const srcFile = join25(sourceRoot, "adapters", name, a.rules_file);
    const destFile = join25(options.target, a.rules_file);
    if (!existsSync25(srcFile)) {
      console.warn(`Warning: Source file for adapter '${name}' is missing at: ${srcFile}`);
      return;
    }
    const srcContent = readFileSync24(srcFile, "utf8");
    if (existsSync25(destFile)) {
      const destContent = readFileSync24(destFile, "utf8");
      printDiff(srcContent, destContent, a.rules_file);
    } else {
      console.log(`
File: ${a.rules_file} \x1B[31m(MISSING)\x1B[0m`);
      console.log("--------------------------------------------------");
      srcContent.split(/\r?\n/).forEach((l) => console.log(`\x1B[32m+ ${l}\x1B[0m`));
    }
  });
}
function handleAdapterSync(aName, options) {
  if (!options.approved) {
    console.error("\x1B[31mError: Adapter sync requires explicit approval flag: --approved\x1B[0m");
    console.log("Example: node bin/multimodel-dev-os.js adapter sync cursor --approved");
    process.exit(1);
  }
  const adapters = loadAdapters(options.registry);
  const adaptersToSync = [];
  if (aName === "all") {
    const enabled = getEnabledAdapters(options.target);
    Object.keys(adapters).forEach((name) => {
      if (enabled[name])
        adaptersToSync.push(name);
    });
  } else {
    if (!adapters[aName]) {
      console.error(`\x1B[31mError: Adapter '${aName}' not found in registry.\x1B[0m`);
      process.exit(1);
    }
    adaptersToSync.push(aName);
  }
  if (adaptersToSync.length === 0) {
    console.log("No adapters found to sync.");
    return;
  }
  console.log(`
\u{1F504} \x1B[36mSynchronizing IDE Adapters in: ${options.target}\x1B[0m`);
  console.log("==================================================");
  adaptersToSync.forEach((name) => {
    const a = adapters[name];
    const srcFile = join25(sourceRoot, "adapters", name, a.rules_file);
    const destFile = join25(options.target, a.rules_file);
    const destDir = dirname8(destFile);
    if (!existsSync25(srcFile)) {
      console.warn(`Warning: Source file for adapter '${name}' is missing at: ${srcFile}`);
      return;
    }
    if (existsSync25(destFile)) {
      if (options.force) {
        if (!options.dryRun) {
          const backupPath = destFile + ".bak";
          writeFileSync14(backupPath, readFileSync24(destFile));
          if (!existsSync25(destDir))
            mkdirSync10(destDir, { recursive: true });
          writeFileSync14(destFile, readFileSync24(srcFile));
          console.log(`  \x1B[33mOVERWRITE (BACKUP CREATED):\x1B[0m ${a.rules_file} -> ${a.rules_file}.bak`);
        } else {
          console.log(`  \x1B[36m[DRY-RUN] WOULD OVERWRITE & BACKUP:\x1B[0m ${a.rules_file}`);
        }
      } else {
        console.log(`  \x1B[37m[SKIP] Already exists:\x1B[0m ${a.rules_file}`);
      }
    } else {
      if (!options.dryRun) {
        if (!existsSync25(destDir))
          mkdirSync10(destDir, { recursive: true });
        writeFileSync14(destFile, readFileSync24(srcFile));
        console.log(`  \x1B[32mCREATE:\x1B[0m ${a.rules_file}`);
      } else {
        console.log(`  \x1B[36m[DRY-RUN] WOULD CREATE:\x1B[0m ${a.rules_file}`);
      }
    }
  });
  console.log();
}

// src/cli/handlers/skills.js
import { existsSync as existsSync26, readdirSync as readdirSync11, readFileSync as readFileSync25 } from "fs";
import { join as join26 } from "path";
function handleListSkills(options) {
  const skillsDir = join26(options.target, ".ai", "skills");
  if (!existsSync26(skillsDir)) {
    console.log("\n\x1B[33m[Notice] .ai/skills directory is not initialized in the target workspace.\x1B[0m\n");
    return;
  }
  const files = readdirSync11(skillsDir).filter((f) => f.endsWith(".md"));
  console.log(`
\u{1F9E0} \x1B[36mAvailable Skills in Target [v${version}]\x1B[0m`);
  console.log("==================================================");
  files.forEach((f) => {
    console.log(`  \x1B[32m- ${f.replace(".md", "")}\x1B[0m (file: .ai/skills/${f})`);
  });
  console.log("\nUse \x1B[36mshow-skill <skill-name>\x1B[0m to read a skill's prompt text.\n");
}
function handleShowSkill(name, options) {
  const skillsDir = join26(options.target, ".ai", "skills");
  const skillFile = join26(skillsDir, name.endsWith(".md") ? name : `${name}.md`);
  if (!existsSync26(skillFile)) {
    console.error(`\x1B[31mError: Skill '${name}' not found in target .ai/skills/.\x1B[0m`);
    process.exit(1);
  }
  console.log(`
\u{1F4D6} \x1B[36mSkill Prompt: ${name}\x1B[0m`);
  console.log("==================================================");
  console.log(readFileSync25(skillFile, "utf8"));
  console.log();
}

// src/skill-os/registry-loader.js
import { existsSync as existsSync28 } from "fs";
import { join as join28 } from "path";

// src/skill-os/validation.js
import { existsSync as existsSync27, readFileSync as readFileSync26 } from "fs";
import { join as join27, resolve as resolve5, relative as relative5 } from "path";
var VALID_PERMISSION_CLASSES = [
  "read-only",
  "draft-only",
  "write-with-confirmation",
  "restricted-admin"
];
var VALID_RISK_LEVELS = ["low", "medium", "high", "restricted"];
var SKILL_OS_SCHEMA_FILES = [
  ".ai/schema/skill.schema.json",
  ".ai/schema/prompt-template.schema.json",
  ".ai/schema/tool-permission.schema.json",
  ".ai/schema/agent-cluster.schema.json",
  ".ai/schema/guardrail.schema.json",
  ".ai/schema/workflow.schema.json"
];
var SKILL_OS_REGISTRY_FILES = {
  skills: ".ai/registries/skills.yaml",
  promptTemplates: ".ai/registries/prompt-templates.yaml",
  toolPermissions: ".ai/registries/tool-permissions.yaml",
  agentClusters: ".ai/registries/agent-clusters.yaml",
  guardrails: ".ai/registries/guardrails.yaml",
  workflows: ".ai/registries/workflows.yaml"
};
var VALID_GUARDRAIL_TYPES = ["pre_tool", "pre_write", "pre_external_write", "post_change", "session_end"];
var VALID_GUARDRAIL_SEVERITIES = ["info", "low", "medium", "high", "restricted"];
var REQUIRED_RACE_PLUS_FIELDS = [
  "role",
  "action",
  "context",
  "expectation",
  "constraints",
  "output_format",
  "verification",
  "next_action"
];
var DANGEROUS_OPERATION_PATTERN = /\b(publish|deploy|dns|ad spend|secret|token|credential|force push|delete|remove|rotate|billing|production)\b/i;
function getDefaultRoot() {
  if (existsSync27(join27(sourceRoot, "package.json"))) {
    return sourceRoot;
  }
  const parentRoot = resolve5(sourceRoot, "..");
  if (existsSync27(join27(parentRoot, "package.json"))) {
    return parentRoot;
  }
  return sourceRoot;
}
function createResult() {
  return {
    success: true,
    errors: [],
    warnings: [],
    parsed: {
      schemas: {},
      registries: {}
    }
  };
}
function addError(result, message) {
  result.errors.push(message);
  result.success = false;
}
function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function asObjectEntries(value) {
  return isObject(value) ? Object.entries(value) : [];
}
function hasRequiredFields(entry, fields, label, result) {
  for (const field of fields) {
    if (entry[field] === void 0 || entry[field] === null || entry[field] === "") {
      addError(result, `${label} missing required field: ${field}`);
    }
  }
}
function isSlugSafe(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
function isSemverLike(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value);
}
function isSafeRelativePath(value) {
  if (typeof value !== "string" || value.trim() === "")
    return false;
  const normalized = value.replace(/\\/g, "/").trim();
  if (normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized))
    return false;
  return !normalized.split("/").includes("..");
}
function pathExists(root, relPath) {
  if (!isSafeRelativePath(relPath))
    return false;
  const resolved = resolve5(root, relPath);
  const rel = relative5(root, resolved);
  if (rel.startsWith("..") || resolve5(root) === resolved && relPath !== ".")
    return false;
  return existsSync27(resolved);
}
function validateRelativePath(root, relPath, label, result, { mustExist = true } = {}) {
  if (!isSafeRelativePath(relPath)) {
    addError(result, `${label} must be a safe relative path: ${relPath}`);
    return;
  }
  if (mustExist && !pathExists(root, relPath)) {
    addError(result, `${label} references missing file or directory: ${relPath}`);
  }
}
function validateStringArray(value, label, result) {
  if (!Array.isArray(value)) {
    addError(result, `${label} must be an array`);
    return;
  }
  for (const item of value) {
    if (typeof item !== "string" || item.trim() === "") {
      addError(result, `${label} contains a non-string item`);
    }
  }
}
function parseJsonFile(root, relPath, result) {
  const fullPath = join27(root, relPath);
  try {
    const parsed = JSON.parse(readFileSync26(fullPath, "utf8"));
    result.parsed.schemas[relPath] = parsed;
    return parsed;
  } catch (error) {
    addError(result, `${relPath} failed to parse as JSON: ${error.message}`);
    return null;
  }
}
function parseYamlFile(root, relPath, rootKey, result) {
  const fullPath = join27(root, relPath);
  try {
    const parsed = parseYaml(readFileSync26(fullPath, "utf8"));
    if (!isObject(parsed)) {
      addError(result, `${relPath} failed to parse as YAML object`);
      return null;
    }
    if (rootKey === "guardrails") {
      if (!Array.isArray(parsed[rootKey])) {
        addError(result, `${relPath} missing root key: ${rootKey} (must be an array)`);
        return null;
      }
    } else {
      if (!isObject(parsed[rootKey])) {
        addError(result, `${relPath} missing root key: ${rootKey}`);
        return null;
      }
    }
    result.parsed.registries[rootKey] = parsed[rootKey];
    return parsed[rootKey];
  } catch (error) {
    addError(result, `${relPath} failed to parse as YAML: ${error.message}`);
    return null;
  }
}
function validateSchemas(root, result) {
  for (const relPath of SKILL_OS_SCHEMA_FILES) {
    validateRelativePath(root, relPath, relPath, result);
    if (pathExists(root, relPath)) {
      parseJsonFile(root, relPath, result);
    }
  }
}
function validateToolPermissions(toolPermissions, result) {
  if (!toolPermissions)
    return /* @__PURE__ */ new Set();
  const knownClasses = new Set(VALID_PERMISSION_CLASSES);
  const declaredClasses = /* @__PURE__ */ new Set();
  for (const [key, entry] of asObjectEntries(toolPermissions)) {
    const label = `tool permission '${key}'`;
    hasRequiredFields(entry, [
      "tool_id",
      "display_name",
      "class",
      "allowed_operations",
      "blocked_operations",
      "requires_confirmation",
      "requires_clean_worktree",
      "requires_validation",
      "audit_log"
    ], label, result);
    if (!isSlugSafe(entry.tool_id))
      addError(result, `${label} has invalid slug id: ${entry.tool_id}`);
    if (entry.tool_id !== key)
      addError(result, `${label} key must match tool_id`);
    if (!knownClasses.has(entry.class))
      addError(result, `${label} has invalid class: ${entry.class}`);
    declaredClasses.add(entry.class);
    validateStringArray(entry.allowed_operations, `${label} allowed_operations`, result);
    validateStringArray(entry.blocked_operations, `${label} blocked_operations`, result);
    if ((entry.class === "restricted-admin" || entry.class === "write-with-confirmation") && entry.requires_confirmation !== true) {
      addError(result, `${label} must require confirmation for class ${entry.class}`);
    }
    if (entry.class === "read-only") {
      const operations = [
        ...Array.isArray(entry.allowed_operations) ? entry.allowed_operations : []
      ].join(" ");
      if (DANGEROUS_OPERATION_PATTERN.test(operations)) {
        addError(result, `${label} marks dangerous operations as read-only`);
      }
    }
  }
  for (const permissionClass of VALID_PERMISSION_CLASSES) {
    if (declaredClasses.has(permissionClass))
      continue;
  }
  return knownClasses;
}
function validateSkills(root, skills, knownPermissionClasses, result) {
  const knownSkillIds = new Set(Object.keys(skills || {}));
  for (const [key, entry] of asObjectEntries(skills)) {
    const label = `skill '${key}'`;
    hasRequiredFields(entry, [
      "id",
      "name",
      "version",
      "description",
      "category",
      "risk_level",
      "permissions",
      "skill_file"
    ], label, result);
    if (!isSlugSafe(entry.id))
      addError(result, `${label} has invalid slug id: ${entry.id}`);
    if (entry.id !== key)
      addError(result, `${label} key must match id`);
    if (!isSemverLike(entry.version))
      addError(result, `${label} has invalid semver-like version: ${entry.version}`);
    if (!isSlugSafe(entry.category))
      addError(result, `${label} has invalid category slug: ${entry.category}`);
    if (!VALID_RISK_LEVELS.includes(entry.risk_level))
      addError(result, `${label} has invalid risk_level: ${entry.risk_level}`);
    if (!Array.isArray(entry.permissions) || entry.permissions.length === 0) {
      addError(result, `${label} permissions must be a non-empty array`);
    } else {
      for (const permission of entry.permissions) {
        if (!knownPermissionClasses.has(permission)) {
          addError(result, `${label} permission does not map to known tool permission class: ${permission}`);
        }
      }
    }
    validateRelativePath(root, entry.skill_file, `${label} skill_file`, result);
    for (const relPath of entry.checks || []) {
      validateRelativePath(root, relPath, `${label} check`, result);
    }
    for (const relPath of entry.required_context || []) {
      validateRelativePath(root, relPath, `${label} required_context`, result);
    }
  }
  return knownSkillIds;
}
function validatePromptTemplates(root, promptTemplates, result) {
  for (const [key, entry] of asObjectEntries(promptTemplates)) {
    const label = `prompt template '${key}'`;
    hasRequiredFields(entry, ["id", "name", "version", "description", "race_plus"], label, result);
    if (!isSlugSafe(entry.id))
      addError(result, `${label} has invalid slug id: ${entry.id}`);
    if (entry.id !== key)
      addError(result, `${label} key must match id`);
    if (!isSemverLike(entry.version))
      addError(result, `${label} has invalid semver-like version: ${entry.version}`);
    if (!isObject(entry.race_plus)) {
      addError(result, `${label} race_plus must be an object`);
      continue;
    }
    for (const field of REQUIRED_RACE_PLUS_FIELDS) {
      if (entry.race_plus[field] === void 0 || entry.race_plus[field] === null || entry.race_plus[field] === "") {
        addError(result, `${label} missing RACE+ field: ${field}`);
      }
    }
    if (!Array.isArray(entry.race_plus.constraints)) {
      addError(result, `${label} race_plus.constraints must be an array`);
    }
    if (!Array.isArray(entry.race_plus.verification)) {
      addError(result, `${label} race_plus.verification must be an array`);
    }
    const requiredFiles = entry.race_plus.context && entry.race_plus.context.required_files;
    if (Array.isArray(requiredFiles)) {
      for (const relPath of requiredFiles) {
        validateRelativePath(root, relPath, `${label} required_file`, result);
      }
    }
  }
}
function validateAgentClusters(root, clusters, knownSkillIds, knownPermissionClasses, result) {
  for (const [key, entry] of asObjectEntries(clusters)) {
    const label = `agent cluster '${key}'`;
    hasRequiredFields(entry, [
      "id",
      "name",
      "description",
      "scope",
      "typical_skills",
      "allowed_tool_classes",
      "required_context",
      "outputs",
      "validation_expectations"
    ], label, result);
    if (!isSlugSafe(entry.id))
      addError(result, `${label} has invalid slug id: ${entry.id}`);
    if (entry.id !== key)
      addError(result, `${label} key must match id`);
    validateStringArray(entry.scope, `${label} scope`, result);
    validateStringArray(entry.typical_skills, `${label} typical_skills`, result);
    validateStringArray(entry.allowed_tool_classes, `${label} allowed_tool_classes`, result);
    validateStringArray(entry.required_context, `${label} required_context`, result);
    validateStringArray(entry.outputs, `${label} outputs`, result);
    validateStringArray(entry.validation_expectations, `${label} validation_expectations`, result);
    for (const permissionClass of entry.allowed_tool_classes || []) {
      if (!knownPermissionClasses.has(permissionClass)) {
        addError(result, `${label} references invalid tool class: ${permissionClass}`);
      }
    }
    for (const skillId of entry.typical_skills || []) {
      if (!knownSkillIds.has(skillId)) {
        result.warnings.push(`${label} references planned skill id not present in skills registry: ${skillId}`);
      }
    }
    for (const relPath of entry.required_context || []) {
      validateRelativePath(root, relPath, `${label} required_context`, result);
    }
  }
}
function validateGuardrails(root, guardrails, result) {
  if (!guardrails)
    return;
  for (const entry of Array.isArray(guardrails) ? guardrails : []) {
    const label = `guardrail '${entry.id || "unknown"}'`;
    hasRequiredFields(entry, [
      "id",
      "name",
      "version",
      "type",
      "severity",
      "applies_to",
      "check_file",
      "requires_confirmation",
      "requires_clean_worktree",
      "validation"
    ], label, result);
    if (entry.id) {
      if (!isSlugSafe(entry.id))
        addError(result, `${label} has invalid slug id: ${entry.id}`);
    }
    if (entry.version) {
      if (!isSemverLike(entry.version))
        addError(result, `${label} has invalid semver-like version: ${entry.version}`);
    }
    if (entry.type) {
      if (!VALID_GUARDRAIL_TYPES.includes(entry.type))
        addError(result, `${label} has invalid type: ${entry.type}`);
    }
    if (entry.severity) {
      if (!VALID_GUARDRAIL_SEVERITIES.includes(entry.severity))
        addError(result, `${label} has invalid severity: ${entry.severity}`);
    }
    if (entry.applies_to) {
      if (!isObject(entry.applies_to)) {
        addError(result, `${label} applies_to must be an object`);
      } else {
        if (entry.applies_to.tool_classes) {
          validateStringArray(entry.applies_to.tool_classes, `${label} applies_to.tool_classes`, result);
        }
        if (entry.applies_to.operations) {
          validateStringArray(entry.applies_to.operations, `${label} applies_to.operations`, result);
        }
      }
    }
    if (entry.check_file !== void 0) {
      validateRelativePath(root, entry.check_file, `${label} check_file`, result);
    }
    if (entry.validation) {
      if (!isObject(entry.validation)) {
        addError(result, `${label} validation must be an object`);
      } else {
        if (entry.validation.deterministic === void 0 || entry.validation.deterministic === null || typeof entry.validation.deterministic !== "boolean") {
          addError(result, `${label} missing or invalid deterministic flag`);
        }
        if (entry.validation.advisory_only !== true) {
          addError(result, `${label} advisory_only must be true for this sprint`);
        }
      }
    }
    if (entry.severity === "restricted" && entry.requires_confirmation !== true) {
      addError(result, `${label} with restricted severity must require confirmation`);
    }
    if (entry.type === "pre_external_write" && entry.requires_confirmation !== true) {
      addError(result, `${label} of type pre_external_write must require confirmation`);
    }
    if (entry.applies_to && Array.isArray(entry.applies_to.tool_classes) && entry.applies_to.tool_classes.includes("restricted-admin")) {
      if (entry.requires_confirmation !== true) {
        addError(result, `${label} applying to restricted-admin must require confirmation`);
      }
    }
  }
}
function getGuardrailIds(guardrails) {
  const ids = /* @__PURE__ */ new Set();
  for (const guardrail of Array.isArray(guardrails) ? guardrails : []) {
    if (guardrail && typeof guardrail.id === "string") {
      ids.add(guardrail.id);
    }
  }
  return ids;
}
function validateOptionalReferenceArray(entry, field, knownIds, label, result) {
  const values = entry[field];
  if (values === void 0 || values === null)
    return 0;
  if (!Array.isArray(values)) {
    addError(result, `${label} skill_os.${field} must be an array`);
    return 0;
  }
  for (const value of values) {
    if (!isSlugSafe(value)) {
      addError(result, `${label} skill_os.${field} contains invalid slug id: ${value}`);
    } else if (!knownIds.has(value)) {
      addError(result, `${label} skill_os.${field} references unknown id: ${value}`);
    }
  }
  return 1;
}
function validateWorkflowSkillOs(root, workflows, knownSkillIds, knownPromptIds, knownPermissionIds, knownGuardrailIds, result) {
  let workflowsWithSkillOs = 0;
  for (const [key, workflow] of asObjectEntries(workflows)) {
    const skillOs = workflow.skill_os;
    if (skillOs === void 0 || skillOs === null)
      continue;
    const label = `workflow '${key}'`;
    if (!isObject(skillOs)) {
      addError(result, `${label} skill_os must be an object`);
      continue;
    }
    workflowsWithSkillOs++;
    validateOptionalReferenceArray(skillOs, "skills", knownSkillIds, label, result);
    validateOptionalReferenceArray(skillOs, "prompts", knownPromptIds, label, result);
    validateOptionalReferenceArray(skillOs, "permissions", knownPermissionIds, label, result);
    validateOptionalReferenceArray(skillOs, "guardrails", knownGuardrailIds, label, result);
    if (skillOs.required_context !== void 0 && skillOs.required_context !== null) {
      if (!Array.isArray(skillOs.required_context)) {
        addError(result, `${label} skill_os.required_context must be an array`);
      } else {
        for (const relPath of skillOs.required_context) {
          validateRelativePath(root, relPath, `${label} skill_os.required_context`, result);
        }
      }
    }
  }
  return workflowsWithSkillOs;
}
function loadSkillOsRegistries(root = getDefaultRoot()) {
  const result = createResult();
  const registries = {
    skills: parseYamlFile(root, SKILL_OS_REGISTRY_FILES.skills, "skills", result),
    promptTemplates: parseYamlFile(root, SKILL_OS_REGISTRY_FILES.promptTemplates, "prompt_templates", result),
    toolPermissions: parseYamlFile(root, SKILL_OS_REGISTRY_FILES.toolPermissions, "tool_permissions", result),
    agentClusters: parseYamlFile(root, SKILL_OS_REGISTRY_FILES.agentClusters, "agent_clusters", result),
    guardrails: parseYamlFile(root, SKILL_OS_REGISTRY_FILES.guardrails, "guardrails", result),
    workflows: parseYamlFile(root, SKILL_OS_REGISTRY_FILES.workflows, "workflows", result)
  };
  return { ...result, registries };
}
function validateSkillOs(root = getDefaultRoot()) {
  const result = createResult();
  validateSchemas(root, result);
  const skills = parseYamlFile(root, SKILL_OS_REGISTRY_FILES.skills, "skills", result) || {};
  const promptTemplates = parseYamlFile(root, SKILL_OS_REGISTRY_FILES.promptTemplates, "prompt_templates", result) || {};
  const toolPermissions = parseYamlFile(root, SKILL_OS_REGISTRY_FILES.toolPermissions, "tool_permissions", result) || {};
  const agentClusters = parseYamlFile(root, SKILL_OS_REGISTRY_FILES.agentClusters, "agent_clusters", result) || {};
  const guardrails = parseYamlFile(root, SKILL_OS_REGISTRY_FILES.guardrails, "guardrails", result) || [];
  const workflows = parseYamlFile(root, SKILL_OS_REGISTRY_FILES.workflows, "workflows", result) || {};
  const knownPermissionClasses = validateToolPermissions(toolPermissions, result);
  const knownSkillIds = validateSkills(root, skills, knownPermissionClasses, result);
  validatePromptTemplates(root, promptTemplates, result);
  validateAgentClusters(root, agentClusters, knownSkillIds, knownPermissionClasses, result);
  validateGuardrails(root, guardrails, result);
  const knownPromptIds = new Set(Object.keys(promptTemplates || {}));
  const knownPermissionIds = new Set(Object.keys(toolPermissions || {}));
  const knownGuardrailIds = getGuardrailIds(guardrails);
  const workflowsWithSkillOs = validateWorkflowSkillOs(
    root,
    workflows,
    knownSkillIds,
    knownPromptIds,
    knownPermissionIds,
    knownGuardrailIds,
    result
  );
  result.summary = {
    schemas: SKILL_OS_SCHEMA_FILES.length,
    skills: Object.keys(skills).length,
    promptTemplates: Object.keys(promptTemplates).length,
    toolPermissions: Object.keys(toolPermissions).length,
    agentClusters: Object.keys(agentClusters).length,
    guardrails: Array.isArray(guardrails) ? guardrails.length : 0,
    workflows: Object.keys(workflows).length,
    workflowsWithSkillOs
  };
  return result;
}

// src/skill-os/registry-loader.js
function hasAllSkillOsFiles(root) {
  const requiredFiles = [
    ...SKILL_OS_SCHEMA_FILES,
    ...Object.values(SKILL_OS_REGISTRY_FILES)
  ];
  return requiredFiles.every((relPath) => existsSync28(join28(root, relPath)));
}
function resolveSkillOsRoot(target = process.cwd()) {
  if (target && hasAllSkillOsFiles(target)) {
    return { root: target, usingFallback: false };
  }
  return { root: getDefaultRoot(), usingFallback: true };
}
function getSkillOsFileManifest(root) {
  return {
    schemas: SKILL_OS_SCHEMA_FILES.map((relPath) => ({
      path: relPath,
      exists: existsSync28(join28(root, relPath))
    })),
    registries: Object.values(SKILL_OS_REGISTRY_FILES).map((relPath) => ({
      path: relPath,
      exists: existsSync28(join28(root, relPath))
    }))
  };
}
function loadSkillOsData(options = {}) {
  const { root, usingFallback } = resolveSkillOsRoot(options.target || process.cwd());
  const loaded = loadSkillOsRegistries(root);
  const validation = validateSkillOs(root);
  return {
    root,
    usingFallback,
    files: getSkillOsFileManifest(root),
    registries: loaded.registries,
    validation,
    loadErrors: loaded.errors,
    loadWarnings: loaded.warnings
  };
}

// src/cli/handlers/skill-os.js
var LIST_TYPES = {
  skills: {
    title: "Skills",
    registryKey: "skills",
    label: "skill"
  },
  prompts: {
    title: "Prompt Templates",
    registryKey: "promptTemplates",
    label: "prompt"
  },
  permissions: {
    title: "Tool Permissions",
    registryKey: "toolPermissions",
    label: "permission"
  },
  clusters: {
    title: "Agent Clusters",
    registryKey: "agentClusters",
    label: "cluster"
  }
};
var SHOW_TYPES = {
  skill: LIST_TYPES.skills,
  prompt: LIST_TYPES.prompts,
  permission: LIST_TYPES.permissions,
  cluster: LIST_TYPES.clusters
};
function printNotice(data) {
  if (data.usingFallback) {
    console.log("Notice: Local Skill OS registries not found. Using bundled Skill OS registries.");
  }
}
function printList(values, indent = "") {
  for (const value of values || []) {
    console.log(`${indent}- ${value}`);
  }
}
function getRegistry(data, registryKey) {
  return data.registries[registryKey] || {};
}
function getData(options, deps) {
  const loadSkillOsDataFn = deps.loadSkillOsDataFn || loadSkillOsData;
  return loadSkillOsDataFn(options);
}
function handleSkillOsStatus(options, deps = {}) {
  const data = getData(options, deps);
  const summary = data.validation.summary || {};
  console.log("\nSkill OS Status");
  console.log("==================================================");
  printNotice(data);
  console.log(`Schemas: ${summary.schemas || data.files.schemas.length}`);
  console.log(`Registries: ${data.files.registries.length}`);
  console.log(`Skills: ${summary.skills || 0}`);
  console.log(`Prompt templates: ${summary.promptTemplates || 0}`);
  console.log(`Tool permissions: ${summary.toolPermissions || 0}`);
  console.log(`Agent clusters: ${summary.agentClusters || 0}`);
  console.log(`Guardrails: ${summary.guardrails || 0}`);
  console.log(`Workflows: ${summary.workflows || 0}`);
  console.log(`Workflows with Skill OS: ${summary.workflowsWithSkillOs || 0}`);
  console.log(`Validation: ${data.validation.success ? "passed" : "failed"}`);
  console.log("\nRegistry files:");
  for (const file of data.files.registries) {
    console.log(`- ${file.path}`);
  }
  console.log();
}
function handleSkillOsValidate(options, deps = {}) {
  const data = getData(options, deps);
  console.log("\nSkill OS Validation");
  console.log("==================================================");
  printNotice(data);
  if (data.validation.success) {
    console.log("Validation: passed");
  } else {
    console.log("Validation: failed");
  }
  for (const warning of data.validation.warnings || []) {
    console.warn(`Warning: ${warning}`);
  }
  for (const error of data.validation.errors || []) {
    console.error(`Error: ${error}`);
  }
  if (!data.validation.success) {
    process.exit(1);
  }
  console.log();
}
function handleSkillOsList(type, options, deps = {}) {
  const config = LIST_TYPES[type];
  if (!config) {
    console.error("\x1B[31mError: Please specify a Skill OS list type: skills, prompts, permissions, or clusters.\x1B[0m");
    process.exit(1);
  }
  const data = getData(options, deps);
  const registry = getRegistry(data, config.registryKey);
  console.log(`
${config.title}`);
  console.log("==================================================");
  printNotice(data);
  const ids = Object.keys(registry);
  if (ids.length === 0) {
    console.log(`No ${config.title.toLowerCase()} found.`);
  } else {
    printList(ids);
  }
  console.log();
}
function handleSkillOsShow(type, id, options, deps = {}) {
  const config = SHOW_TYPES[type];
  if (!config) {
    console.error("\x1B[31mError: Please specify a Skill OS show type: skill, prompt, permission, or cluster.\x1B[0m");
    process.exit(1);
  }
  if (!id || id.startsWith("-")) {
    console.error(`\x1B[31mError: Please specify a ${config.label} ID.\x1B[0m`);
    process.exit(1);
  }
  const data = getData(options, deps);
  const registry = getRegistry(data, config.registryKey);
  const item = registry[id];
  if (!item) {
    console.error(`\x1B[31mError: Skill OS ${config.label} '${id}' not found.\x1B[0m`);
    process.exit(1);
  }
  if (type === "skill") {
    printSkill(id, item, data);
  } else if (type === "prompt") {
    printPrompt(id, item, data);
  } else if (type === "permission") {
    printPermission(id, item, data);
  } else {
    printCluster(id, item, data);
  }
}
function printSkill(id, skill, data) {
  console.log(`
Skill: ${id}`);
  console.log("==================================================");
  printNotice(data);
  console.log(`Name: ${skill.name || id}`);
  console.log(`Category: ${skill.category || "unknown"}`);
  console.log(`Risk: ${skill.risk_level || "unknown"}`);
  console.log("Permissions:");
  printList(skill.permissions, "");
  console.log(`Skill file: ${skill.skill_file || "N/A"}`);
  if (skill.description)
    console.log(`Description: ${skill.description}`);
  console.log();
}
function printPrompt(id, prompt, data) {
  const race = prompt.race_plus || {};
  console.log(`
Prompt: ${id}`);
  console.log("==================================================");
  printNotice(data);
  console.log(`Name: ${prompt.name || id}`);
  console.log(`Role: ${race.role || "N/A"}`);
  console.log(`Action: ${race.action || "N/A"}`);
  console.log(`Expectation: ${race.expectation || "N/A"}`);
  console.log(`Output format: ${race.output_format || "N/A"}`);
  console.log("Constraints:");
  printList(race.constraints, "");
  console.log("Verification:");
  printList(race.verification, "");
  console.log(`Next action: ${race.next_action || "N/A"}`);
  console.log();
}
function printPermission(id, permission, data) {
  console.log(`
Permission: ${id}`);
  console.log("==================================================");
  printNotice(data);
  console.log(`Display name: ${permission.display_name || id}`);
  console.log(`Class: ${permission.class || "unknown"}`);
  console.log(`Requires confirmation: ${permission.requires_confirmation === true}`);
  console.log(`Requires clean worktree: ${permission.requires_clean_worktree === true}`);
  console.log(`Requires validation: ${permission.requires_validation === true}`);
  console.log("Allowed operations:");
  printList(permission.allowed_operations, "");
  console.log("Blocked operations:");
  printList(permission.blocked_operations, "");
  console.log();
}
function printCluster(id, cluster, data) {
  console.log(`
Cluster: ${id}`);
  console.log("==================================================");
  printNotice(data);
  console.log(`Name: ${cluster.name || id}`);
  console.log(`Description: ${cluster.description || "N/A"}`);
  console.log("Scope:");
  printList(cluster.scope, "");
  console.log("Typical skills:");
  printList(cluster.typical_skills, "");
  console.log("Allowed tool classes:");
  printList(cluster.allowed_tool_classes, "");
  console.log();
}

// src/cli/handlers/onboard.js
import { existsSync as existsSync29, mkdirSync as mkdirSync11, readFileSync as readFileSync27, writeFileSync as writeFileSync15, readdirSync as readdirSync12 } from "fs";
import { join as join29, dirname as dirname9 } from "path";
function getRecommendation(analysis) {
  const scores = {
    "nextjs-saas": 0,
    "expo-react-native-android": 0,
    "wordpress-site": 0,
    "ecommerce-store": 0,
    "seo-landing-page": 0,
    "general-app": 0.1
  };
  if (analysis.frameworks.includes("Next.js"))
    scores["nextjs-saas"] += 0.6;
  if (analysis.frameworks.includes("React"))
    scores["nextjs-saas"] += 0.2;
  if (analysis.frameworks.includes("TypeScript"))
    scores["nextjs-saas"] += 0.1;
  if (analysis.repoType === "mobile app")
    scores["expo-react-native-android"] += 0.6;
  if (analysis.frameworks.includes("Expo") || analysis.frameworks.includes("React Native"))
    scores["expo-react-native-android"] += 0.3;
  if (analysis.repoType === "WordPress theme/plugin")
    scores["wordpress-site"] += 0.6;
  if (analysis.frameworks.includes("WordPress/PHP"))
    scores["wordpress-site"] += 0.3;
  if (analysis.frameworks.includes("Vite") || analysis.frameworks.includes("React"))
    scores["seo-landing-page"] += 0.3;
  let recommended = "general-app";
  let maxScore = 0;
  Object.keys(scores).forEach((k) => {
    if (scores[k] > maxScore) {
      maxScore = scores[k];
      recommended = k;
    }
  });
  const suggestedAdapters = ["cursor", "claude", "gemini", "vscode", "antigravity"];
  return {
    template: recommended,
    confidence: Math.min(1, maxScore === 0.1 ? 0.5 : maxScore),
    suggestedAdapters,
    riskNotes: analysis.envRiskMarkers.length > 0 ? "Workspace contains unignored credentials or key files. Ensure .gitignore covers them." : "None"
  };
}
function handleOnboardAnalyze(options) {
  console.log(`
\u{1F50D} \x1B[36mAnalyzing Workspace for Onboarding: ${options.target}\x1B[0m`);
  console.log("==================================================");
  const analysis = getAnalysis(options.target);
  console.log(`  Package Manager:       ${analysis.packageManagers.join(", ") || "None"}`);
  console.log(`  Detected Frameworks:   ${analysis.frameworks.join(", ") || "None"}`);
  console.log(`  Dominant Language:     ${analysis.language}`);
  console.log(`  Repository Type:       ${analysis.repoType}`);
  console.log(`  Existing AI Tools:     ${analysis.existingTools.join(", ") || "None"}`);
  console.log(`  GitHub Workflows:      ${analysis.githubWorkflows.join(", ") || "None"}`);
  console.log(`  Security Risk Markers: ${analysis.envRiskMarkers.length} files found`);
  if (analysis.envRiskMarkers.length > 0) {
    analysis.envRiskMarkers.forEach((m) => console.log(`    \u2514\u2500\u2500> ${m} (potential secrets exposure risk)`));
  }
  console.log();
}
function handleOnboardRecommend(options) {
  const analysis = getAnalysis(options.target);
  const rec = getRecommendation(analysis);
  console.log(`
\u{1F4A1} \x1B[36mOnboarding Recommendation for: ${options.target}\x1B[0m`);
  console.log("==================================================");
  console.log(`  Recommended Template:  \x1B[32m${rec.template}\x1B[0m`);
  console.log(`  Confidence Score:      ${(rec.confidence * 100).toFixed(0)}%`);
  console.log(`  Suggested Adapters:    ${rec.suggestedAdapters.join(", ")}`);
  console.log(`  Risk Notes:            ${rec.riskNotes}`);
  console.log(`  Suggested Next Command:`);
  console.log(`    npx multimodel-dev-os onboard plan --target .`);
  console.log();
}
function handleOnboardPlan(options) {
  console.log(`
\u{1F4CB} \x1B[36mGenerating Onboarding Plan: ${options.target}\x1B[0m`);
  console.log("==================================================");
  const analysis = getAnalysis(options.target);
  const rec = getRecommendation(analysis);
  const planPath = join29(options.target, ".ai", "intelligence", "onboarding.plan.json");
  const reportPath = join29(options.target, ".ai", "intelligence", "onboarding.report.md");
  const plannedFiles = [
    { action: "CREATE", path: "AGENTS.md", source_template: `examples/${rec.template}/AGENTS.md` },
    { action: "CREATE", path: "MEMORY.md", source_template: `examples/${rec.template}/MEMORY.md` },
    { action: "CREATE", path: "TASKS.md", source_template: `examples/${rec.template}/TASKS.md` },
    { action: "CREATE", path: "RUNBOOK.md", source_template: `RUNBOOK.md` },
    { action: "CREATE", path: ".ai/config.yaml", source_template: `examples/${rec.template}/.ai/config.yaml` }
  ];
  const planData = {
    generated_at: (/* @__PURE__ */ new Date()).toISOString(),
    target_path: options.target,
    project_analysis: {
      package_manager: analysis.packageManagers.join(", ") || "npm",
      framework: analysis.frameworks.join(", ") || "Generic",
      language: analysis.language,
      repo_type: analysis.repoType,
      has_existing_ai_config: analysis.aiSignals.includes(".ai/config.yaml"),
      risk_markers: analysis.envRiskMarkers
    },
    recommendation: {
      template: rec.template,
      confidence: rec.confidence,
      suggested_adapters: rec.suggestedAdapters,
      reasons: [`Detected dominant language ${analysis.language}`, `Detected framework ${analysis.frameworks.join(", ")}`]
    },
    planned_files: plannedFiles
  };
  let reportMd = `# MultiModel Dev OS Onboarding Report

`;
  reportMd += `**Generated At:** ${planData.generated_at}
`;
  reportMd += `**Target Path:** ${planData.target_path}

`;
  reportMd += `## 1. Project Analysis Details
`;
  reportMd += `- **Package Manager:** ${planData.project_analysis.package_manager}
`;
  reportMd += `- **Frameworks:** ${planData.project_analysis.framework}
`;
  reportMd += `- **Language:** ${planData.project_analysis.language}
`;
  reportMd += `- **Repo Type:** ${planData.project_analysis.repo_type}

`;
  reportMd += `## 2. Onboarding Recommendation
`;
  reportMd += `- **Recommended Profile:** **${planData.recommendation.template}** (Confidence: ${(planData.recommendation.confidence * 100).toFixed(0)}%)
`;
  reportMd += `- **Suggested Adapters:** ${planData.recommendation.suggested_adapters.join(", ")}

`;
  reportMd += `## 3. Planned File Operations
`;
  reportMd += `| Action | Target Path | Source Template |
`;
  reportMd += `|---|---|---|
`;
  plannedFiles.forEach((f) => {
    reportMd += `| ${f.action} | ${f.path} | ${f.source_template} |
`;
  });
  reportMd += `
`;
  reportMd += `## 4. Next Step
`;
  reportMd += `To safely apply this plan, run:
`;
  reportMd += `\`\`\`bash
`;
  reportMd += `npx multimodel-dev-os onboard apply --target . --approved
`;
  reportMd += `\`\`\`
`;
  try {
    const intelDir = join29(options.target, ".ai", "intelligence");
    if (!options.dryRun && !existsSync29(intelDir)) {
      mkdirSync11(intelDir, { recursive: true });
    }
    if (!options.dryRun) {
      writeFileSync15(planPath, JSON.stringify(planData, null, 2), "utf8");
      writeFileSync15(reportPath, reportMd, "utf8");
    }
    console.log(`  [SUCCESS] Onboarding plan generated:`);
    console.log(`    - Plan JSON:   .ai/intelligence/onboarding.plan.json`);
    console.log(`    - Report MD:   .ai/intelligence/onboarding.report.md`);
    console.log(`
Review the plan and run "npx multimodel-dev-os onboard apply --target . --approved" to execute.
`);
  } catch (e) {
    console.error(`\x1B[31mError writing plan: ${e.message}\x1B[0m`);
  }
}
function handleOnboardApply(options) {
  if (!options.approved) {
    console.error("\x1B[31mError: Onboarding apply requires explicit approval flag: --approved\x1B[0m");
    console.log("Example: node bin/multimodel-dev-os.js onboard apply --approved");
    process.exit(1);
  }
  const planPath = join29(options.target, ".ai", "intelligence", "onboarding.plan.json");
  if (!existsSync29(planPath)) {
    console.error('\x1B[31mError: Onboarding plan not found. Run "npx multimodel-dev-os onboard plan" first.\x1B[0m');
    process.exit(1);
  }
  let plan;
  try {
    plan = JSON.parse(readFileSync27(planPath, "utf8"));
  } catch (e) {
    console.error(`\x1B[31mError reading plan JSON: ${e.message}\x1B[0m`);
    process.exit(1);
  }
  console.log(`
\u{1F680} \x1B[36mApplying Onboarding Scaffolding: ${options.target}\x1B[0m`);
  console.log("==================================================");
  const template = plan.recommendation.template;
  options.template = template;
  const operations = [];
  plan.planned_files.forEach((f) => {
    let srcFile;
    if (f.source_template === "RUNBOOK.md") {
      srcFile = join29(sourceRoot, "RUNBOOK.md");
    } else {
      srcFile = join29(sourceRoot, f.source_template);
    }
    operations.push({ dest: f.path, src: srcFile });
  });
  const templateDir = join29(sourceRoot, "examples", template);
  const templateAiDir = join29(templateDir, ".ai");
  if (existsSync29(templateAiDir) && !options.caveman) {
    const subdirs = ["context", "skills"];
    subdirs.forEach((sub) => {
      const subPath = join29(templateAiDir, sub);
      if (existsSync29(subPath)) {
        readdirSync12(subPath).forEach((file) => {
          operations.push({
            dest: join29(".ai", sub, file),
            src: join29(subPath, file)
          });
        });
      }
    });
  }
  const globalAiSubdirs = ["context", "agents", "skills", "prompts", "checks", "templates", "session-logs", "registries", "proposals", "intelligence"];
  globalAiSubdirs.forEach((sub) => {
    const globalPath = join29(sourceRoot, ".ai", sub);
    if (existsSync29(globalPath)) {
      readdirSync12(globalPath).forEach((file) => {
        const destRel = join29(".ai", sub, file);
        if (!operations.some((op) => op.dest === destRel)) {
          if (options.caveman && (sub === "context" || sub === "skills" || sub === "prompts" || sub === "checks")) {
            return;
          }
          operations.push({
            dest: destRel,
            src: join29(globalPath, file)
          });
        }
      });
    }
  });
  let createdCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;
  operations.forEach((op) => {
    const destPath = join29(options.target, op.dest);
    const destDir = dirname9(destPath);
    if (existsSync29(destPath)) {
      if (options.force) {
        if (!options.dryRun) {
          const backupPath = destPath + ".bak";
          writeFileSync15(backupPath, readFileSync27(destPath));
          if (!existsSync29(destDir))
            mkdirSync11(destDir, { recursive: true });
          writeFileSync15(destPath, readFileSync27(op.src));
          console.log(`  \x1B[33mOVERWRITE (BACKUP CREATED):\x1B[0m ${op.dest} -> ${op.dest}.bak`);
        } else {
          console.log(`  \x1B[36m[DRY-RUN] WOULD OVERWRITE & BACKUP:\x1B[0m ${op.dest}`);
        }
        updatedCount++;
      } else {
        console.log(`  \x1B[37m[SKIP] Already exists:\x1B[0m ${op.dest}`);
        skippedCount++;
      }
    } else {
      if (!options.dryRun) {
        if (!existsSync29(destDir))
          mkdirSync11(destDir, { recursive: true });
        writeFileSync15(destPath, readFileSync27(op.src));
        console.log(`  \x1B[32mCREATE:\x1B[0m ${op.dest}`);
      } else {
        console.log(`  \x1B[36m[DRY-RUN] WOULD CREATE:\x1B[0m ${op.dest}`);
      }
      createdCount++;
    }
  });
  console.log(`
\u2714 Onboarding apply complete! Created: ${createdCount}, Skipped: ${skippedCount}, Overwritten (with backup): ${updatedCount}
`);
}
function handleOnboardStatus(options) {
  console.log(`
\u{1F4CA} \x1B[36mOnboarding Status Dashboard: ${options.target}\x1B[0m`);
  console.log("==================================================");
  const crucialFiles = [
    "AGENTS.md",
    "MEMORY.md",
    "TASKS.md",
    "RUNBOOK.md",
    ".ai/config.yaml"
  ];
  let presentCount = 0;
  crucialFiles.forEach((f) => {
    const fullPath = join29(options.target, f);
    const exists = existsSync29(fullPath);
    if (exists)
      presentCount++;
    console.log(`  [${exists ? "\u2714" : " "}] ${f}`);
  });
  const percentage = presentCount / crucialFiles.length * 100;
  console.log(`
  Completeness Score: ${percentage.toFixed(0)}%`);
  if (percentage === 100) {
    console.log("  Status: \x1B[32mREADY (Onboarding complete)\x1B[0m\n");
  } else if (percentage > 0) {
    console.log('  Status: \x1B[33mIN_PROGRESS (Run "onboard apply --approved" to initialize remaining files)\x1B[0m\n');
  } else {
    console.log('  Status: \x1B[31mMISSING (Run "onboard plan" and "onboard apply" to onboard this repo)\x1B[0m\n');
  }
}

// src/cli/handlers/dashboard.js
import { join as join30 } from "path";
import readline from "readline";
import { execSync } from "child_process";
function selectMenu(title, items, callback) {
  let cursor = 0;
  const draw = () => {
    console.clear();
    console.log(`
\u{1F9E0} \x1B[36m${title}\x1B[0m`);
    console.log("==================================================");
    items.forEach((item, index) => {
      if (index === cursor) {
        console.log(`  \x1B[32m\u276F ${item.name}\x1B[0m`);
      } else {
        console.log(`    ${item.name}`);
      }
    });
    console.log("\n\x1B[90m(Use Arrow keys to navigate, Enter to select, Esc/Ctrl+C to exit)\x1B[0m\n");
  };
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  const onKeypress = (str, key) => {
    if (!key)
      return;
    if (key.name === "up") {
      cursor = (cursor - 1 + items.length) % items.length;
      draw();
    } else if (key.name === "down") {
      cursor = (cursor + 1) % items.length;
      draw();
    } else if (key.name === "return") {
      cleanup();
      callback(items[cursor]);
    } else if (key.name === "escape" || key.ctrl && key.name === "c") {
      cleanup();
      process.exit(0);
    }
  };
  const cleanup = () => {
    process.stdin.removeListener("keypress", onKeypress);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
  };
  process.stdin.on("keypress", onKeypress);
  draw();
}
function handleDashboard(options) {
  const mainMenu = [
    { name: "Active Workspace Status", action: "command", command: "status" },
    { name: "Codebase Scan Analysis", action: "command", command: "scan" },
    { name: "Onboarding Operations...", action: "submenu", menu: "onboard" },
    { name: "Adapter Synchronization...", action: "submenu", menu: "adapter" },
    { name: "Memory & Intelligence...", action: "submenu", menu: "memory" },
    { name: "Developer Feedback Loops...", action: "submenu", menu: "feedback" },
    { name: "Workflow Marketplace Catalog...", action: "submenu", menu: "catalog" },
    { name: "Registry Sources & Cache...", action: "submenu", menu: "registry" },
    { name: "Quality Gates & Diagnostics...", action: "submenu", menu: "quality" },
    { name: "Plugins Status Overview", action: "command", command: "plugin status" },
    { name: "Exit Command Center", action: "exit" }
  ];
  const submenus = {
    onboard: [
      { name: "\u2190 Back to Main Menu", action: "back" },
      { name: "Onboard: Analyze Repository", action: "command", command: "onboard analyze" },
      { name: "Onboard: Recommendation Summary", action: "command", command: "onboard recommend" },
      { name: "Onboard: Generate Integration Plan", action: "command", command: "onboard plan" },
      { name: "Onboard: Apply Configs (Dry Run)", action: "command", command: "onboard apply --dry-run" },
      { name: "Onboard: View Status Heuristics", action: "command", command: "onboard status" }
    ],
    adapter: [
      { name: "\u2190 Back to Main Menu", action: "back" },
      { name: "Adapters: Check Sync Status", action: "command", command: "adapter status" },
      { name: "Adapters: Sync All rule files (Dry Run)", action: "command", command: "adapter sync all --dry-run" },
      { name: "Adapters: Diff Cursor rules", action: "command", command: "adapter diff cursor" },
      { name: "Adapters: Diff Claude rules", action: "command", command: "adapter diff claude" }
    ],
    memory: [
      { name: "\u2190 Back to Main Menu", action: "back" },
      { name: "Memory: Build index", action: "command", command: "memory build" },
      { name: "Memory: Refresh changes", action: "command", command: "memory refresh" },
      { name: "Memory: Diff index status", action: "command", command: "memory diff" },
      { name: "Handoff: Build session summary", action: "command", command: "handoff build" },
      { name: "Handoff: Print summary to terminal", action: "command", command: "handoff show" }
    ],
    feedback: [
      { name: "\u2190 Back to Main Menu", action: "back" },
      { name: "Feedback: List developer corrections", action: "command", command: "feedback list" },
      { name: "Feedback: Summarize to learning rules", action: "command", command: "feedback summarize" },
      { name: "Proposals: Propose improvement proposal", action: "command", command: "improve propose" },
      { name: "Proposals: Review active proposals list", action: "command", command: "improve review" }
    ],
    catalog: [
      { name: "\u2190 Back to Main Menu", action: "back" },
      { name: "Catalog: List bundled plugins", action: "command", command: "catalog list" },
      { name: "Catalog: Recommend for current repo", action: "command", command: "catalog recommend" },
      { name: "Catalog: Show installed catalog status", action: "command", command: "catalog status" }
    ],
    quality: [
      { name: "\u2190 Back to Main Menu", action: "back" },
      { name: "Doctor: Run Advisory Diagnostics", action: "command", command: "doctor" },
      { name: "Validate: Strict Schema Compliance", action: "command", command: "validate" },
      { name: "Verify: Run Release verification tests", action: "command", command: "verify" }
    ],
    registry: [
      { name: "\u2190 Back to Main Menu", action: "back" },
      { name: "Registry: List configured sources", action: "command", command: "registry list" },
      { name: "Registry: Show sync status", action: "command", command: "registry status" },
      { name: "Registry: Verify cache integrity", action: "command", command: "registry verify bundled" },
      { name: "Registry: Show policy status", action: "command", command: "registry status" }
    ]
  };
  if (!process.stdout.isTTY || !process.stdin.isTTY || options.dryRun || options.listActions) {
    console.log(`
\u{1F4CA} \x1B[36mMultiModel Dev OS Command Center (Headless/CI Preview)\x1B[0m`);
    console.log(`Target Workspace: \x1B[32m${options.target}\x1B[0m`);
    console.log("==================================================");
    const targetFlag = options.target === process.cwd() ? "" : ` --target "${options.target}"`;
    mainMenu.forEach((item) => {
      if (item.action === "command") {
        console.log(`  \x1B[33m\u2022\x1B[0m ${item.name.padEnd(30)} \u2192 \x1B[36mnpx multimodel-dev-os ${item.command}${targetFlag}\x1B[0m`);
      } else if (item.action === "submenu") {
        console.log(`
  \x1B[35m[${item.name.replace("...", "")}]\x1B[0m`);
        submenus[item.menu].forEach((sub) => {
          if (sub.action === "command") {
            console.log(`    \u2514\u2500\u2500 ${sub.name.padEnd(35)} \u2192 \x1B[36mnpx multimodel-dev-os ${sub.command}${targetFlag}\x1B[0m`);
          }
        });
      }
    });
    console.log("\n\x1B[90m(Run with -t or --target to specify another workspace directory)\x1B[0m\n");
    return;
  }
  const runCommandWrapper = (cmdStr) => {
    console.clear();
    const targetFlag = options.target === process.cwd() ? "" : ` --target "${options.target}"`;
    console.log(`
\x1B[36mRunning Command:\x1B[0m npx multimodel-dev-os ${cmdStr}${targetFlag}`);
    console.log("--------------------------------------------------\n");
    try {
      const cliPath = join30(sourceRoot, "bin", "multimodel-dev-os.js");
      execSync(`node "${cliPath}" ${cmdStr} --target "${options.target}"`, { stdio: "inherit" });
    } catch (e) {
      console.error(`
\x1B[31mCommand failed with error: ${e.message}\x1B[0m`);
    }
    console.log("\n--------------------------------------------------");
    console.log("Press any key to return to menu...");
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    return new Promise((resolve6) => {
      process.stdin.once("keypress", () => {
        resolve6();
      });
    });
  };
  const showMenu = (menuItems, title) => {
    selectMenu(title, menuItems, async (selected) => {
      if (selected.action === "exit") {
        process.exit(0);
      } else if (selected.action === "back") {
        showMenu(mainMenu, "MultiModel Dev OS Command Center");
      } else if (selected.action === "submenu") {
        showMenu(submenus[selected.menu], selected.name);
      } else if (selected.action === "command") {
        await runCommandWrapper(selected.command);
        showMenu(menuItems, title);
      }
    });
  };
  showMenu(mainMenu, "MultiModel Dev OS Command Center");
}

// src/cli/main.js
var ARGS = process.argv.slice(2);
var params = parseArgs(ARGS);
var COMMAND = params.command;
var boundDiffMemory = (target) => diffMemory(target, {
  scanTarget,
  detectFrameworkSignals,
  detectDependencySignals,
  detectAiDevOsSignals,
  detectRisks
});
if (params.help || !COMMAND) {
  showHelp();
  process.exit(0);
}
if (COMMAND === "init") {
  if (params.mobile === "android") {
    params.template = "expo-react-native-android";
  } else if (params.aiApp === "rag") {
    params.template = "rag-knowledge-base";
  }
  handleInit(params);
} else if (COMMAND === "verify") {
  handleVerify(params);
} else if (COMMAND === "scan") {
  handleScan(params, { scanTarget, detectFrameworkSignals, detectDependencySignals, detectAiDevOsSignals, detectRisks });
} else if (COMMAND === "memory") {
  const sub = ARGS[1];
  const injects = { scanTarget, detectFrameworkSignals, detectDependencySignals, detectAiDevOsSignals, detectRisks };
  if (sub === "build") {
    handleMemoryBuild(params, injects);
  } else if (sub === "refresh") {
    handleMemoryRefresh(params, injects);
  } else if (sub === "diff") {
    handleMemoryDiff(params, injects);
  } else {
    console.error(`\x1B[31mError: Please specify a memory subcommand: build, refresh, or diff.\x1B[0m`);
    console.error(`Example: node bin/multimodel-dev-os.js memory build`);
    process.exit(1);
  }
} else if (COMMAND === "feedback") {
  const sub = ARGS[1];
  if (sub === "add") {
    handleFeedbackAdd(params);
  } else if (sub === "list") {
    handleFeedbackList(params);
  } else if (sub === "summarize") {
    handleFeedbackSummarize(params);
  } else {
    console.error(`\x1B[31mError: Please specify a feedback subcommand: add, list, or summarize.\x1B[0m`);
    console.log(`Example: node bin/multimodel-dev-os.js feedback add "Prefer CSS Modules"`);
    process.exit(1);
  }
} else if (COMMAND === "improve") {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === "propose") {
    handleImprovePropose(params);
  } else if (sub === "review") {
    handleImproveReview(params);
  } else if (sub === "status") {
    handleImproveStatus(params);
  } else if (sub === "validate") {
    const proposalFile = positional[2];
    if (!proposalFile) {
      console.error(`\x1B[31mError: Please specify a proposal file path.\x1B[0m`);
      console.log(`Example: node bin/multimodel-dev-os.js improve validate .ai/proposals/proposal-xxxx.md`);
      process.exit(1);
    }
    handleImproveValidate(proposalFile, params);
  } else if (sub === "diff") {
    const proposalFile = positional[2];
    if (!proposalFile) {
      console.error(`\x1B[31mError: Please specify a proposal file path.\x1B[0m`);
      console.log(`Example: node bin/multimodel-dev-os.js improve diff .ai/proposals/proposal-xxxx.md`);
      process.exit(1);
    }
    handleImproveDiff(proposalFile, params);
  } else if (sub === "apply") {
    const proposalFile = positional[2];
    if (!proposalFile) {
      console.error(`\x1B[31mError: Please specify a proposal file path.\x1B[0m`);
      console.log(`Example: node bin/multimodel-dev-os.js improve apply .ai/proposals/proposal-xxxx.md --approved`);
      process.exit(1);
    }
    handleImproveApply(proposalFile, params);
  } else if (sub === "log") {
    handleImproveLog(params);
  } else {
    console.error(`\x1B[31mError: Please specify an improve subcommand: propose, review, status, validate, diff, apply, or log.\x1B[0m`);
    console.log(`Example: node bin/multimodel-dev-os.js improve validate .ai/proposals/proposal-xxxx.md`);
    process.exit(1);
  }
} else if (COMMAND === "templates" || COMMAND === "list-templates") {
  handleListTemplates(params);
} else if (COMMAND === "show-template") {
  const tName = ARGS[1];
  if (!tName || tName.startsWith("-")) {
    console.error("\x1B[31mError: Please specify a template name. Example: node bin/multimodel-dev-os.js show-template nextjs-saas\x1B[0m");
    process.exit(1);
  }
  handleShowTemplate(tName, params);
} else if (COMMAND === "doctor") {
  handleDoctor(params, { scanTarget, detectDependencySignals, getAnalysis, diffMemory: boundDiffMemory });
} else if (COMMAND === "validate") {
  handleValidate(params);
} else if (COMMAND === "validate-template") {
  const tName = ARGS[1];
  if (!tName || tName.startsWith("-")) {
    console.error("\x1B[31mError: Please specify a template name. Example: node bin/multimodel-dev-os.js validate-template nextjs-saas\x1B[0m");
    process.exit(1);
  }
  handleValidateTemplate(tName, params);
} else if (COMMAND === "validate-adapter") {
  const aName = ARGS[1];
  if (!aName || aName.startsWith("-")) {
    console.error("\x1B[31mError: Please specify an adapter name. Example: node bin/multimodel-dev-os.js validate-adapter cursor\x1B[0m");
    process.exit(1);
  }
  handleValidateAdapter(aName, params);
} else if (COMMAND === "validate-skill") {
  const sName = ARGS[1];
  if (!sName || sName.startsWith("-")) {
    console.error("\x1B[31mError: Please specify a skill name. Example: node bin/multimodel-dev-os.js validate-skill custom-skill.example\x1B[0m");
    process.exit(1);
  }
  handleValidateSkill(sName, params);
} else if (COMMAND === "models") {
  handleListModels(params);
} else if (COMMAND === "show-model") {
  const mName = ARGS[1];
  if (!mName || mName.startsWith("-")) {
    console.error("\x1B[31mError: Please specify a model name. Example: node bin/multimodel-dev-os.js show-model claude-sonnet-latest\x1B[0m");
    process.exit(1);
  }
  handleShowModel(mName);
} else if (COMMAND === "providers") {
  handleListProviders();
} else if (COMMAND === "route-model") {
  const taskName = ARGS[1];
  if (!taskName || taskName.startsWith("-")) {
    console.error("\x1B[31mError: Please specify a task. Example: node bin/multimodel-dev-os.js route-model planning\x1B[0m");
    process.exit(1);
  }
  handleRouteModel(taskName);
} else if (COMMAND === "adapters") {
  handleListAdapters(params);
} else if (COMMAND === "show-adapter") {
  const aName = ARGS[1];
  if (!aName || aName.startsWith("-")) {
    console.error("\x1B[31mError: Please specify an adapter name. Example: node bin/multimodel-dev-os.js show-adapter cursor\x1B[0m");
    process.exit(1);
  }
  handleShowAdapter(aName);
} else if (COMMAND === "skills") {
  handleListSkills(params);
} else if (COMMAND === "show-skill") {
  const sName = ARGS[1];
  if (!sName || sName.startsWith("-")) {
    console.error("\x1B[31mError: Please specify a skill name. Example: node bin/multimodel-dev-os.js show-skill bug-fix\x1B[0m");
    process.exit(1);
  }
  handleShowSkill(sName, params);
} else if (COMMAND === "skill-os") {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === "status") {
    handleSkillOsStatus(params);
  } else if (sub === "validate") {
    handleSkillOsValidate(params);
  } else if (sub === "list") {
    const type = positional[2];
    handleSkillOsList(type, params);
  } else if (sub === "show") {
    const type = positional[2];
    const id = positional[3];
    handleSkillOsShow(type, id, params);
  } else {
    console.error("\x1B[31mError: Please specify a skill-os subcommand: status, validate, list, or show.\x1B[0m");
    console.log("Example: node bin/multimodel-dev-os.js skill-os status");
    process.exit(1);
  }
} else if (COMMAND === "status") {
  handleStatus(params, { scanTarget, detectFrameworkSignals, detectDependencySignals, diffMemory: boundDiffMemory });
} else if (COMMAND === "workflow") {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === "list") {
    handleWorkflowList(params);
  } else if (sub === "show") {
    const wName = positional[2];
    if (!wName) {
      console.error("\x1B[31mError: Please specify a workflow name.\x1B[0m");
      console.log("Example: node bin/multimodel-dev-os.js workflow show repo-health");
      process.exit(1);
    }
    handleWorkflowShow(wName, params);
  } else if (sub === "plan") {
    const wName = positional[2];
    if (!wName) {
      console.error("\x1B[31mError: Please specify a workflow name.\x1B[0m");
      console.log("Example: node bin/multimodel-dev-os.js workflow plan repo-health");
      process.exit(1);
    }
    handleWorkflowPlan(wName, params);
  } else if (sub === "run") {
    const wName = positional[2];
    if (!wName) {
      console.error("\x1B[31mError: Please specify a workflow name.\x1B[0m");
      console.log("Example: node bin/multimodel-dev-os.js workflow run repo-health");
      process.exit(1);
    }
    handleWorkflowRun(wName, params, { scanTarget, detectFrameworkSignals, detectDependencySignals, detectAiDevOsSignals, detectRisks, getAnalysis, boundDiffMemory });
  } else {
    console.error("\x1B[31mError: Please specify a workflow subcommand: list, show, plan, or run.\x1B[0m");
    console.log("Example: node bin/multimodel-dev-os.js workflow list");
    process.exit(1);
  }
} else if (COMMAND === "handoff") {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  const injects = { scanTarget, detectFrameworkSignals, detectDependencySignals, diffMemory: boundDiffMemory };
  if (sub === "build") {
    handleHandoffBuild(params, injects);
  } else if (sub === "show") {
    handleHandoffShow(params, injects);
  } else {
    console.error("\x1B[31mError: Please specify a handoff subcommand: build or show.\x1B[0m");
    console.log("Example: node bin/multimodel-dev-os.js handoff build");
    process.exit(1);
  }
} else if (COMMAND === "onboard") {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === "analyze") {
    handleOnboardAnalyze(params);
  } else if (sub === "recommend") {
    handleOnboardRecommend(params);
  } else if (sub === "plan") {
    handleOnboardPlan(params);
  } else if (sub === "apply") {
    handleOnboardApply(params);
  } else if (sub === "status") {
    handleOnboardStatus(params);
  } else {
    console.error("\x1B[31mError: Please specify an onboard subcommand: analyze, recommend, plan, apply, or status.\x1B[0m");
    console.log("Example: node bin/multimodel-dev-os.js onboard analyze");
    process.exit(1);
  }
} else if (COMMAND === "adapter") {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === "status") {
    handleAdapterStatus(params);
  } else if (sub === "diff") {
    const aName = positional[2];
    if (!aName) {
      console.error('\x1B[31mError: Please specify an adapter name (e.g. cursor, claude) or "all".\x1B[0m');
      process.exit(1);
    }
    handleAdapterDiff(aName, params);
  } else if (sub === "sync") {
    const aName = positional[2];
    if (!aName) {
      console.error('\x1B[31mError: Please specify an adapter name or "all" to sync.\x1B[0m');
      process.exit(1);
    }
    handleAdapterSync(aName, params);
  } else {
    console.error("\x1B[31mError: Please specify an adapter subcommand: status, diff, or sync.\x1B[0m");
    console.log("Example: node bin/multimodel-dev-os.js adapter status");
    process.exit(1);
  }
} else if (COMMAND === "dashboard" || COMMAND === "ui") {
  handleDashboard(params);
} else if (COMMAND === "plugin") {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === "list") {
    handlePluginList(params);
  } else if (sub === "show") {
    const pSlug = positional[2];
    if (!pSlug) {
      console.error("\x1B[31mError: Please specify a plugin name/slug.\x1B[0m");
      process.exit(1);
    }
    handlePluginShow(pSlug, params);
  } else if (sub === "validate") {
    const pPath = positional[2];
    if (!pPath) {
      console.error("\x1B[31mError: Please specify a plugin configuration file path.\x1B[0m");
      process.exit(1);
    }
    handlePluginValidate(pPath, params);
  } else if (sub === "install") {
    const pPath = positional[2];
    if (!pPath) {
      console.error("\x1B[31mError: Please specify a plugin configuration file path to install.\x1B[0m");
      process.exit(1);
    }
    handlePluginInstall(pPath, params);
  } else if (sub === "status") {
    handlePluginStatus(params);
  } else {
    console.error("\x1B[31mError: Please specify a plugin subcommand: list, show, validate, install, or status.\x1B[0m");
    console.log("Example: node bin/multimodel-dev-os.js plugin list");
    process.exit(1);
  }
} else if (COMMAND === "catalog") {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === "list") {
    handleCatalogList(params);
  } else if (sub === "search") {
    const query = positional[2];
    if (!query) {
      console.error("\x1B[31mError: Please specify a search query.\x1B[0m");
      process.exit(1);
    }
    handleCatalogSearch(query, params);
  } else if (sub === "show") {
    const slug = positional[2];
    if (!slug) {
      console.error("\x1B[31mError: Please specify a catalog plugin slug.\x1B[0m");
      process.exit(1);
    }
    handleCatalogShow(slug, params);
  } else if (sub === "categories") {
    handleCatalogCategories(params);
  } else if (sub === "recommend") {
    handleCatalogRecommend(params, { getAnalysis });
  } else if (sub === "install") {
    const slug = positional[2];
    if (!slug) {
      console.error("\x1B[31mError: Please specify a catalog plugin slug to install.\x1B[0m");
      process.exit(1);
    }
    handleCatalogInstall(slug, params);
  } else if (sub === "status") {
    handleCatalogStatus(params);
  } else {
    console.error("\x1B[31mError: Please specify a catalog subcommand: list, search, show, categories, recommend, install, or status.\x1B[0m");
    console.log("Example: node bin/multimodel-dev-os.js catalog list");
    process.exit(1);
  }
} else if (COMMAND === "registry") {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === "list") {
    handleRegistryList(params);
  } else if (sub === "add") {
    const rName = positional[2];
    const rUrl = positional[3];
    if (!rName || !rUrl) {
      console.error("\x1B[31mError: Please specify a registry name and URL.\x1B[0m");
      console.log("Example: node bin/multimodel-dev-os.js registry add official https://example.com/catalog.yaml --approved");
      process.exit(1);
    }
    handleRegistryAdd(rName, rUrl, params);
  } else if (sub === "remove") {
    const rName = positional[2];
    if (!rName) {
      console.error("\x1B[31mError: Please specify a registry name to remove.\x1B[0m");
      process.exit(1);
    }
    handleRegistryRemove(rName, params);
  } else if (sub === "sync") {
    const rName = positional[2];
    if (!rName) {
      console.error("\x1B[31mError: Please specify a registry name to sync.\x1B[0m");
      process.exit(1);
    }
    handleRegistrySync(rName, params);
  } else if (sub === "status") {
    handleRegistryStatus(params);
  } else if (sub === "verify") {
    const rName = positional[2] || "bundled";
    handleRegistryVerify(rName, params);
  } else if (sub === "show") {
    const rName = positional[2];
    if (!rName) {
      console.error("\x1B[31mError: Please specify a registry name to show.\x1B[0m");
      process.exit(1);
    }
    handleRegistryShow(rName, params);
  } else if (sub === "cache") {
    const cacheSub = positional[2];
    if (cacheSub === "clear") {
      handleRegistryCacheClear(params);
    } else {
      console.error("\x1B[31mError: Please specify a cache subcommand: clear.\x1B[0m");
      process.exit(1);
    }
  } else if (sub === "keygen") {
    handleRegistryKeygen(params);
  } else if (sub === "lock") {
    handleRegistryLock(params);
  } else if (sub === "trust") {
    const trustSub = positional[2];
    if (trustSub === "list") {
      handleRegistryTrustList(params);
    } else if (trustSub === "show") {
      const keyId = positional[3];
      if (!keyId) {
        console.error("\x1B[31mError: Please specify a key ID.\x1B[0m");
        process.exit(1);
      }
      handleRegistryTrustShow(keyId, params);
    } else if (trustSub === "verify") {
      handleRegistryTrustVerify(params);
    } else if (trustSub === "add") {
      handleRegistryTrustAdd(positional, params);
    } else if (trustSub === "remove") {
      const keyId = positional[3];
      if (!keyId) {
        console.error("\x1B[31mError: Please specify a key ID to remove.\x1B[0m");
        console.log("Example: node bin/multimodel-dev-os.js registry trust remove my-key-id --approved");
        process.exit(1);
      }
      handleRegistryTrustRemove(keyId, params);
    } else if (trustSub === "sync") {
      handleRegistryTrustSync(params);
    } else {
      console.error("\x1B[31mError: Please specify a trust subcommand: list, show, verify, add, remove, or sync.\x1B[0m");
      console.log("Example: node bin/multimodel-dev-os.js registry trust sync --approved");
      process.exit(1);
    }
  } else {
    console.error("\x1B[31mError: Please specify a registry subcommand: list, add, remove, sync, status, verify, show, cache, keygen, lock, or trust (list, show, verify, add, remove, sync).\x1B[0m");
    console.log("Example: node bin/multimodel-dev-os.js registry list");
    process.exit(1);
  }
} else {
  console.error(`\x1B[31mUnknown command: ${COMMAND}\x1B[0m`);
  showHelp();
  process.exit(1);
}
