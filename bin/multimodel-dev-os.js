#!/usr/bin/env node
// Generated from src/. Do not edit directly.


// src/cli/main.js
import { existsSync as existsSync8, mkdirSync as mkdirSync3, readFileSync as readFileSync9, writeFileSync as writeFileSync4, readdirSync, statSync } from "fs";
import { join as join8, dirname as dirname4, resolve as resolve3, relative, isAbsolute as isAbsolute2, basename } from "path";
import { createHash as createHash2 } from "crypto";
import readline from "readline";
import { execSync, execFileSync } from "child_process";

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
var pkgVersion = "3.0.2";
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
  console.log("  registry <subcmd> Manage trusted remote catalog registries (subcmd: list, add, remove, sync, status, verify, show, cache, keygen, lock, trust)");
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

// src/core/hashes.js
import { createHash } from "crypto";
import { readFileSync as readFileSync2 } from "fs";
function computeSHA256(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}
function hashFile(filePath) {
  try {
    const data = readFileSync2(filePath);
    return createHash("sha256").update(data).digest("hex");
  } catch (e) {
    return "";
  }
}

// src/core/policy.js
import { existsSync as existsSync2, readFileSync as readFileSync3 } from "fs";
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
    allowed_signature_algorithms: ["ed25519", "hmac-sha256"],
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
        const parsed = parseYaml(readFileSync3(p, "utf8"));
        return { ...defaults, ...parsed };
      } catch (e) {
      }
    }
  }
  return defaults;
}

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
import { existsSync as existsSync3, readFileSync as readFileSync4, writeFileSync } from "fs";
import { join as join3 } from "path";
function loadRegistrySources() {
  const paths = [
    join3(sourceRoot, ".ai", "registries", "sources.yaml")
  ];
  for (const p of paths) {
    if (existsSync3(p)) {
      try {
        const parsed = parseYaml(readFileSync4(p, "utf8"));
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
import { existsSync as existsSync4, readFileSync as readFileSync5, writeFileSync as writeFileSync2, mkdirSync } from "fs";
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
    const raw = readFileSync5(lockfilePath, "utf8");
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
import { existsSync as existsSync5, readFileSync as readFileSync6, writeFileSync as writeFileSync3, mkdirSync as mkdirSync2, chmodSync } from "fs";
import { join as join5, dirname as dirname3 } from "path";
var SIGNING_KEY_FILENAME = "registry-signing-key";
function getSigningKeyPath(targetDir) {
  return join5(targetDir, ".ai", SIGNING_KEY_FILENAME);
}
function loadSigningKey(targetDir) {
  const keyPath = getSigningKeyPath(targetDir);
  if (!existsSync5(keyPath)) {
    return null;
  }
  const raw = readFileSync6(keyPath, "utf8").trim();
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
  const allowedAlgs = policy.allowed_signature_algorithms || ["ed25519", "hmac-sha256"];
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
import { existsSync as existsSync6, readFileSync as readFileSync7 } from "fs";
import { join as join6, isAbsolute } from "path";
function loadTrustedKeys(targetDir, policy) {
  const pol = policy || loadRegistryPolicy(targetDir);
  const keyFile = pol.trusted_keys_file || ".ai/registries/trusted-keys.yaml";
  const filePath = isAbsolute(keyFile) ? keyFile : join6(targetDir, keyFile);
  if (!existsSync6(filePath)) {
    return [];
  }
  try {
    const raw = readFileSync7(filePath, "utf8");
    const parsed = parseYaml(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.trusted_publishers)) {
      return [];
    }
    return parsed.trusted_publishers;
  } catch (_e) {
    return [];
  }
}

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

// src/catalog/loader.js
import { existsSync as existsSync7, readFileSync as readFileSync8 } from "fs";
import { join as join7 } from "path";
function loadCatalog(options = {}) {
  let catalog;
  if (options.allSources) {
    catalog = loadAllCatalogs(options);
  } else if (options.source) {
    catalog = loadCatalogFromSource(options.source, options);
  } else {
    const path = join7(sourceRoot, ".ai", "plugins", "catalog.yaml");
    try {
      if (existsSync7(path)) {
        const reg = parseYaml(readFileSync8(path, "utf8"));
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
    const localPath = join7(options.target || process.cwd(), ".ai", "plugins", "catalog.yaml");
    try {
      if (existsSync7(localPath)) {
        const reg = parseYaml(readFileSync8(localPath, "utf8"));
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
    const cachePath = join7(sourceRoot, ".ai", "registry-cache", regName, "catalog.yaml");
    try {
      if (existsSync7(cachePath)) {
        const reg = parseYaml(readFileSync8(cachePath, "utf8"));
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
  const localPath = join7(options.target || process.cwd(), ".ai", "plugins", "catalog.yaml");
  if (existsSync7(localPath)) {
    try {
      const localCat = parseYaml(readFileSync8(localPath, "utf8"));
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
      const cachePath = join7(sourceRoot, ".ai", "registry-cache", s.name, "catalog.yaml");
      if (existsSync7(cachePath)) {
        try {
          const remoteCat = parseYaml(readFileSync8(cachePath, "utf8"));
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

// src/cli/main.js
var ARGS = process.argv.slice(2);
var params = parseArgs(ARGS);
var COMMAND = params.command;
var TEMPLATES = loadTemplates(params.registry);
var ADAPTERS = loadAdapters(params.registry);
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
  handleScan(params);
} else if (COMMAND === "memory") {
  const sub = ARGS[1];
  if (sub === "build") {
    handleMemoryBuild(params);
  } else if (sub === "refresh") {
    handleMemoryRefresh(params);
  } else if (sub === "diff") {
    handleMemoryDiff(params);
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
  handleShowTemplate(tName);
} else if (COMMAND === "doctor") {
  handleDoctor(params);
} else if (COMMAND === "validate") {
  handleValidate(params);
} else if (COMMAND === "validate-template") {
  const tName = ARGS[1];
  if (!tName || tName.startsWith("-")) {
    console.error("\x1B[31mError: Please specify a template name. Example: node bin/multimodel-dev-os.js validate-template nextjs-saas\x1B[0m");
    process.exit(1);
  }
  handleValidateTemplate(tName);
} else if (COMMAND === "validate-adapter") {
  const aName = ARGS[1];
  if (!aName || aName.startsWith("-")) {
    console.error("\x1B[31mError: Please specify an adapter name. Example: node bin/multimodel-dev-os.js validate-adapter cursor\x1B[0m");
    process.exit(1);
  }
  handleValidateAdapter(aName);
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
} else if (COMMAND === "status") {
  handleStatus(params);
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
    handleWorkflowRun(wName, params);
  } else {
    console.error("\x1B[31mError: Please specify a workflow subcommand: list, show, plan, or run.\x1B[0m");
    console.log("Example: node bin/multimodel-dev-os.js workflow list");
    process.exit(1);
  }
} else if (COMMAND === "handoff") {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === "build") {
    handleHandoffBuild(params);
  } else if (sub === "show") {
    handleHandoffShow(params);
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
    handleCatalogRecommend(params);
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
    } else {
      console.error("\x1B[31mError: Please specify a trust subcommand: list, show, or verify.\x1B[0m");
      console.log("Example: node bin/multimodel-dev-os.js registry trust list");
      process.exit(1);
    }
  } else {
    console.error("\x1B[31mError: Please specify a registry subcommand: list, add, remove, sync, status, verify, show, cache, keygen, lock, or trust.\x1B[0m");
    console.log("Example: node bin/multimodel-dev-os.js registry list");
    process.exit(1);
  }
} else {
  console.error(`\x1B[31mUnknown command: ${COMMAND}\x1B[0m`);
  showHelp();
  process.exit(1);
}
function handleListTemplates(options) {
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
function handleShowTemplate(name) {
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
    console.log(`  \u2514\u2500> ${t.skillDesc}`);
  }
  console.log("\n\x1B[33mScaffolding Directory Layout:\x1B[0m");
  console.log("  \u251C\u2500\u2500 AGENTS.md                   (Stack building conventions)");
  console.log("  \u251C\u2500\u2500 MEMORY.md                   (Architectural constraints record)");
  console.log("  \u251C\u2500\u2500 TASKS.md                    (Pre-populated first project tasks)");
  console.log("  \u251C\u2500\u2500 RUNBOOK.md                  (Default operations guide)");
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
function handleInit(options) {
  console.log(`
\x1B[34mInitializing multimodel-dev-os in: ${options.target}\x1B[0m`);
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
  let templateDir = join8(sourceRoot, "examples", options.template);
  if (!existsSync8(templateDir)) {
    console.warn(`  \x1B[33m[WARNING] Template '${options.template}' source files could not be found.\x1B[0m`);
    console.warn(`  To view available templates, run: \x1B[36mnpx multimodel-dev-os templates\x1B[0m`);
    console.warn(`  Falling back to the stable \x1B[32m'general-app'\x1B[0m profile...
`);
    templateDir = join8(sourceRoot, "examples", "general-app");
  }
  let agentsSrc = join8(templateDir, "AGENTS.md");
  let memorySrc = join8(templateDir, "MEMORY.md");
  let tasksSrc = join8(templateDir, "TASKS.md");
  let runbookSrc = join8(sourceRoot, "RUNBOOK.md");
  let configSrc = join8(templateDir, ".ai", "config.yaml");
  if (options.caveman) {
    agentsSrc = join8(sourceRoot, ".ai", "templates", "AGENTS.caveman.md");
    memorySrc = join8(sourceRoot, ".ai", "templates", "MEMORY.caveman.md");
    tasksSrc = join8(sourceRoot, ".ai", "templates", "TASKS.caveman.md");
    runbookSrc = join8(sourceRoot, ".ai", "templates", "RUNBOOK.caveman.md");
  }
  operations.push({ dest: "AGENTS.md", src: agentsSrc });
  operations.push({ dest: "MEMORY.md", src: memorySrc });
  operations.push({ dest: "TASKS.md", src: tasksSrc });
  operations.push({ dest: "RUNBOOK.md", src: runbookSrc });
  operations.push({ dest: ".ai/config.yaml", src: configSrc });
  const templateAiDir = join8(templateDir, ".ai");
  if (existsSync8(templateAiDir) && !options.caveman) {
    const subdirs = ["context", "skills"];
    subdirs.forEach((sub) => {
      const subPath = join8(templateAiDir, sub);
      if (existsSync8(subPath)) {
        readdirSync(subPath).forEach((file) => {
          operations.push({
            dest: join8(".ai", sub, file),
            src: join8(subPath, file)
          });
        });
      }
    });
  }
  const globalAiSubdirs = ["context", "agents", "skills", "prompts", "checks", "templates", "session-logs", "registries", "proposals", "intelligence"];
  globalAiSubdirs.forEach((sub) => {
    const globalPath = join8(sourceRoot, ".ai", sub);
    if (existsSync8(globalPath)) {
      readdirSync(globalPath).forEach((file) => {
        const destRel = join8(".ai", sub, file);
        if (!operations.some((op) => op.dest === destRel)) {
          if (options.caveman && (sub === "context" || sub === "skills" || sub === "prompts" || sub === "checks")) {
            return;
          }
          operations.push({
            dest: destRel,
            src: join8(globalPath, file)
          });
        }
      });
    }
  });
  options.adapters.forEach((adapter) => {
    const adapterDir = join8(sourceRoot, "adapters", adapter);
    if (existsSync8(adapterDir)) {
      const copyRecursive = (currSrc, currRel) => {
        if (statSync(currSrc).isDirectory()) {
          readdirSync(currSrc).forEach((file) => {
            copyRecursive(join8(currSrc, file), join8(currRel, file));
          });
        } else {
          operations.push({
            dest: join8("adapters", adapter, currRel),
            src: currSrc
          });
        }
      };
      readdirSync(adapterDir).forEach((file) => {
        copyRecursive(join8(adapterDir, file), file);
      });
    } else {
      console.warn(`\x1B[33mWarning: Adapter '${adapter}' not found. Skipping.\x1B[0m`);
    }
  });
  operations.forEach((op) => {
    const targetFile = join8(options.target, op.dest);
    if (existsSync8(targetFile)) {
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
    const targetFile = join8(options.target, op.dest);
    const targetDir = dirname4(targetFile);
    if (options.dryRun) {
      console.log(`  \x1B[36m[DRY-RUN] WOULD CREATE:\x1B[0m ${op.dest}`);
    } else {
      if (!existsSync8(targetDir)) {
        mkdirSync3(targetDir, { recursive: true });
      }
      const data = readFileSync9(op.src);
      writeFileSync4(targetFile, data);
      console.log(`  \x1B[32mCREATE:\x1B[0m ${op.dest}`);
    }
  });
  const dirsToEnsure = [".ai/context", ".ai/skills", ".ai/session-logs"];
  dirsToEnsure.forEach((d) => {
    const fullPath = join8(options.target, d);
    if (!options.dryRun && !existsSync8(fullPath)) {
      mkdirSync3(fullPath, { recursive: true });
      console.log(`  \x1B[32mCREATE DIR:\x1B[0m ${d}`);
    }
  });
  if (!options.dryRun) {
    options.adapters.forEach((adapter) => {
      const a = ADAPTERS[adapter];
      if (a && a.rules_file) {
        const srcFile = join8(sourceRoot, "adapters", adapter, a.rules_file);
        const destFile = join8(options.target, a.rules_file);
        const destDir = dirname4(destFile);
        if (existsSync8(srcFile)) {
          if (!existsSync8(destDir))
            mkdirSync3(destDir, { recursive: true });
          writeFileSync4(destFile, readFileSync9(srcFile));
          console.log(`  \x1B[32mCREATE ROOT ADAPTER FILE:\x1B[0m ${a.rules_file}`);
        }
      }
    });
    const targetConfigPath = join8(options.target, ".ai/config.yaml");
    if (existsSync8(targetConfigPath) && options.adapters.length > 0) {
      let configContent = readFileSync9(targetConfigPath, "utf8");
      options.adapters.forEach((adapter) => {
        const regex = new RegExp(`${adapter}:\\s*false`, "g");
        configContent = configContent.replace(regex, `${adapter}: true`);
      });
      writeFileSync4(targetConfigPath, configContent, "utf8");
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
function handleVerify(options) {
  console.log(`
\x1B[34mRunning strict verification in: ${options.target}\x1B[0m
`);
  let passed = 0;
  let failed = 0;
  const assertFile = (relPath) => {
    const fullPath = join8(options.target, relPath);
    if (existsSync8(fullPath) && statSync(fullPath).isFile()) {
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
function handleDoctor(options) {
  if (options.tokens) {
    handleDoctorTokens(options);
    return;
  }
  if (options.release) {
    handleDoctorRelease(options);
    return;
  }
  if (options.intelligence) {
    handleDoctorIntelligence(options);
    return;
  }
  if (options.onboarding) {
    handleDoctorOnboarding(options);
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
  const gitignorePath = join8(options.target, ".gitignore");
  if (existsSync8(gitignorePath)) {
    const content = readFileSync9(gitignorePath, "utf8");
    if (!content.includes("node_modules")) {
      warn(".gitignore is missing node_modules! This will cause AI tools to choke by scanning dependencies.");
    }
    if (!content.includes(".env")) {
      warn(".gitignore is missing .env config boundaries! Secret tokens might get exposed to models.");
    }
  } else {
    warn("Missing .gitignore file in target workspace! AI tools might read large build artifacts.");
  }
  const agentsPath = join8(options.target, "AGENTS.md");
  if (existsSync8(agentsPath)) {
    const content = readFileSync9(agentsPath, "utf8");
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
  const memoryPath = join8(options.target, "MEMORY.md");
  if (existsSync8(memoryPath)) {
    const content = readFileSync9(memoryPath, "utf8");
    const placeholdersCount = (content.match(/null/g) || []).length;
    if (placeholdersCount > 3) {
      warn(`MEMORY.md contains ${placeholdersCount} empty 'null' placeholders. Update project constraints.`);
    }
  }
  const tasksPath = join8(options.target, "TASKS.md");
  if (existsSync8(tasksPath)) {
    const content = readFileSync9(tasksPath, "utf8");
    if (!content.includes("- [ ]") && !content.includes("- [/]")) {
      warn("TASKS.md has no active task section (no tasks marked as - [ ] or - [/]).");
    }
  } else {
    warn("TASKS.md is missing from project root.");
  }
  const configPath = join8(options.target, ".ai", "config.yaml");
  if (existsSync8(configPath)) {
    const content = readFileSync9(configPath, "utf8");
    const checkAdapter = (adapterName, filename) => {
      const regex = new RegExp(`${adapterName}:\\s*true`);
      if (regex.test(content)) {
        const filePath = join8(options.target, filename);
        if (!existsSync8(filePath)) {
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
    const fullPath = join8(options.target, folder);
    if (existsSync8(fullPath)) {
      const gitignore = existsSync8(gitignorePath) ? readFileSync9(gitignorePath, "utf8") : "";
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
function handleValidate(options) {
  if (options && options.allRegistries) {
    handleValidateAllRegistries();
    return;
  }
  console.log(`
\u{1F6E1} \x1B[34mRunning strict schema validation in: ${options.target}\x1B[0m
`);
  let errors = 0;
  const assertPath = (relPath, type) => {
    const fullPath = join8(options.target, relPath);
    if (existsSync8(fullPath)) {
      const stat = statSync(fullPath);
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
  const agentsPath = join8(options.target, ".ai/agents");
  const agentsExist = existsSync8(agentsPath) && statSync(agentsPath).isDirectory();
  if (agentsExist) {
    console.log(`  \x1B[32m\u2713\x1B[0m .ai/agents (dir)`);
  } else {
    const agentsMdPath = join8(options.target, "AGENTS.md");
    let explained = false;
    if (existsSync8(agentsMdPath)) {
      const agentsMdContent = readFileSync9(agentsMdPath, "utf8");
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
  const configPath = join8(options.target, ".ai", "config.yaml");
  if (existsSync8(configPath)) {
    const content = readFileSync9(configPath, "utf8");
    const assertAdapter = (adapterName, filename) => {
      const regex = new RegExp(`${adapterName}:\\s*true`);
      if (regex.test(content)) {
        const fullPath = join8(options.target, filename);
        if (existsSync8(fullPath)) {
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
function handleListModels(options) {
  const registryPath = join8(sourceRoot, ".ai", "models", "registry.yaml");
  if (!existsSync8(registryPath)) {
    console.error("Error: Model registry not found.");
    process.exit(1);
  }
  const registry = parseYaml(readFileSync9(registryPath, "utf8"));
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
  const registryPath = join8(sourceRoot, ".ai", "models", "registry.yaml");
  if (!existsSync8(registryPath)) {
    console.error("Error: Model registry not found.");
    process.exit(1);
  }
  const registry = parseYaml(readFileSync9(registryPath, "utf8"));
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
  console.log(`  \u251C\u2500 Vision: ${m.capabilities?.vision ? "Yes" : "No"}`);
  console.log(`  \u2514\u2500 Tool Use: ${m.capabilities?.tool_use ? "Yes" : "No"}`);
  console.log(`\x1B[33mTiers:\x1B[0m`);
  console.log(`  \u251C\u2500 Cost: ${m.tiers?.cost}`);
  console.log(`  \u251C\u2500 Speed: ${m.tiers?.speed}`);
  console.log(`  \u251C\u2500 Reasoning: ${m.tiers?.reasoning}`);
  console.log(`  \u2514\u2500 Coding: ${m.tiers?.coding}`);
  console.log();
}
function handleListProviders() {
  const providersPath = join8(sourceRoot, ".ai", "models", "providers.yaml");
  if (!existsSync8(providersPath)) {
    console.error("Error: Providers registry not found.");
    process.exit(1);
  }
  const reg = parseYaml(readFileSync9(providersPath, "utf8"));
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
  const presetsPath = join8(sourceRoot, ".ai", "models", "routing-presets.yaml");
  if (!existsSync8(presetsPath)) {
    console.error("Error: Routing presets not found.");
    process.exit(1);
  }
  const reg = parseYaml(readFileSync9(presetsPath, "utf8"));
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
function handleListAdapters(options) {
  const adaptersPath = join8(sourceRoot, ".ai", "adapters", "registry.yaml");
  if (!existsSync8(adaptersPath)) {
    console.error("Error: Adapters registry not found.");
    process.exit(1);
  }
  const reg = parseYaml(readFileSync9(adaptersPath, "utf8"));
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
  const adaptersPath = join8(sourceRoot, ".ai", "adapters", "registry.yaml");
  if (!existsSync8(adaptersPath)) {
    console.error("Error: Adapters registry not found.");
    process.exit(1);
  }
  const reg = parseYaml(readFileSync9(adaptersPath, "utf8"));
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
function handleListSkills(options) {
  const skillsDir = join8(options.target, ".ai", "skills");
  if (!existsSync8(skillsDir)) {
    console.log("\n\x1B[33m[Notice] .ai/skills directory is not initialized in the target workspace.\x1B[0m\n");
    return;
  }
  const files = readdirSync(skillsDir).filter((f) => f.endsWith(".md"));
  console.log(`
\u{1F9E0} \x1B[36mAvailable Skills in Target [v${version}]\x1B[0m`);
  console.log("==================================================");
  files.forEach((f) => {
    console.log(`  \x1B[32m- ${f.replace(".md", "")}\x1B[0m (file: .ai/skills/${f})`);
  });
  console.log("\nUse \x1B[36mshow-skill <skill-name>\x1B[0m to read a skill's prompt text.\n");
}
function handleShowSkill(name, options) {
  const skillsDir = join8(options.target, ".ai", "skills");
  const skillFile = join8(skillsDir, name.endsWith(".md") ? name : `${name}.md`);
  if (!existsSync8(skillFile)) {
    console.error(`\x1B[31mError: Skill '${name}' not found in target .ai/skills/.\x1B[0m`);
    process.exit(1);
  }
  console.log(`
\u{1F4D6} \x1B[36mSkill Prompt: ${name}\x1B[0m`);
  console.log("==================================================");
  console.log(readFileSync9(skillFile, "utf8"));
  console.log();
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
    if (!existsSync8(dir))
      return;
    const items = readdirSync(dir);
    for (const item of items) {
      if (ignoredDirs.includes(item))
        continue;
      const fullPath = join8(dir, item);
      try {
        const stat = statSync(fullPath);
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
function handleValidateTemplate(name) {
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
  const templateDir = join8(sourceRoot, "examples", name);
  if (!existsSync8(templateDir)) {
    console.error(`  \x1B[31m\u2717 Source folder missing: examples/${name}\x1B[0m`);
    errors++;
  } else {
    console.log(`  \x1B[32m\u2713\x1B[0m Source folder: examples/${name}`);
    if (Array.isArray(t.required_files)) {
      t.required_files.forEach((f) => {
        const filePath = join8(templateDir, f);
        const globalPath = join8(sourceRoot, f);
        if (existsSync8(filePath)) {
          console.log(`  \x1B[32m\u2713\x1B[0m Required file (template override): ${f}`);
        } else if (existsSync8(globalPath)) {
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
function handleValidateAdapter(name) {
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
  const adapterDir = join8(sourceRoot, "adapters", name);
  if (!existsSync8(adapterDir)) {
    console.error(`  \x1B[31m\u2717 Source folder missing: adapters/${name}\x1B[0m`);
    errors++;
  } else {
    console.log(`  \x1B[32m\u2713\x1B[0m Source folder: adapters/${name}`);
    const setupFile = join8(adapterDir, "setup.md");
    if (existsSync8(setupFile)) {
      console.log(`  \x1B[32m\u2713\x1B[0m Required file: setup.md`);
    } else {
      console.error(`  \x1B[31m\u2717 Required file missing: adapters/${name}/setup.md\x1B[0m`);
      errors++;
    }
    if (a.rules_file) {
      const rulesFile = join8(adapterDir, a.rules_file);
      if (existsSync8(rulesFile)) {
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
  const skillsDir = join8(options.target, ".ai", "skills");
  let skillFile = join8(skillsDir, name.endsWith(".md") ? name : `${name}.md`);
  if (!existsSync8(skillFile)) {
    skillFile = join8(sourceRoot, ".ai", "skills", name.endsWith(".md") ? name : `${name}.md`);
  }
  if (!existsSync8(skillFile)) {
    console.error(`\x1B[31mError: Skill '${name}' not found.\x1B[0m`);
    process.exit(1);
  }
  console.log(`
\u{1F4CB} \x1B[34mValidating Skill: ${name}\x1B[0m`);
  const content = readFileSync9(skillFile, "utf8");
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
function handleValidateAllRegistries() {
  console.log(`
\u{1F6E1} \x1B[34mValidating All Registry Entries\x1B[0m
`);
  let errors = 0;
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
    const templateDir = join8(sourceRoot, "examples", name);
    if (t.status === "stable" && !existsSync8(templateDir)) {
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
function handleDoctorRelease(options) {
  console.log(`
\u{1FA7A} \x1B[36mRunning release audit doctor in: ${sourceRoot}\x1B[0m
`);
  let warnings = 0;
  let packageVersion = "unknown";
  try {
    const pkg = JSON.parse(readFileSync9(join8(sourceRoot, "package.json"), "utf8"));
    packageVersion = pkg.version;
    console.log(`  \x1B[32m\u2713\x1B[0m package.json version: ${packageVersion}`);
  } catch (e) {
    console.warn("  \x1B[31m\u2717\x1B[0m Failed to parse package.json");
    warnings++;
  }
  const checkInstallScript = (filename, regex) => {
    const filePath = join8(sourceRoot, filename);
    if (existsSync8(filePath)) {
      const content = readFileSync9(filePath, "utf8");
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
    const fullPath = join8(sourceRoot, file);
    if (existsSync8(fullPath)) {
      console.warn(`  \x1B[33m[WARNING]\x1B[0m Blacklisted file found in release root: ${file}`);
      warnings++;
    } else {
      console.log(`  \x1B[32m\u2713\x1B[0m No root blacklisted file: ${file}`);
    }
  });
  const scanSafety = (dir) => {
    if (!existsSync8(dir))
      return;
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join8(dir, item);
      try {
        const stat = statSync(fullPath);
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
  scanSafety(join8(sourceRoot, "examples"));
  console.log("\n==================================================");
  if (warnings > 0) {
    console.warn(`  \x1B[33mRelease doctor complete with ${warnings} warnings.\x1B[0m
`);
  } else {
    console.log("  \x1B[32m\u2714 Release hygiene checks PASSED successfully!\x1B[0m\n");
  }
}
function scanTarget(targetDir) {
  const files = [];
  let ignoredCount = 0;
  function walk(dir) {
    if (!existsSync8(dir))
      return;
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join8(dir, item);
      const relPath = relative(targetDir, fullPath).replace(/\\/g, "/");
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
      const pkg = JSON.parse(readFileSync9(join8(targetDir, "package.json"), "utf8"));
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
  const gitignorePath = join8(targetDir, ".gitignore");
  const gitignoreContent = existsSync8(gitignorePath) ? readFileSync9(gitignorePath, "utf8") : "";
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
function buildMemoryIndex(targetDir) {
  const { files, ignoredCount } = scanTarget(targetDir);
  const framework_signals = detectFrameworkSignals(files, targetDir);
  const dependency_signals = detectDependencySignals(files, targetDir);
  const ai_dev_os_signals = detectAiDevOsSignals(files);
  const risks = detectRisks(files, targetDir);
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
  const intelDir = join8(targetDir, ".ai", "intelligence");
  if (!existsSync8(intelDir)) {
    mkdirSync3(intelDir, { recursive: true });
  }
  const hashJsonPath = join8(intelDir, "memory.hash.json");
  writeFileSync4(hashJsonPath, JSON.stringify(index, null, 2), "utf8");
  const summaryMdPath = join8(intelDir, "memory.summary.md");
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
  writeFileSync4(summaryMdPath, md, "utf8");
}
function diffMemory(targetDir) {
  const hashJsonPath = join8(targetDir, ".ai", "intelligence", "memory.hash.json");
  if (!existsSync8(hashJsonPath)) {
    return null;
  }
  let existing;
  try {
    existing = JSON.parse(readFileSync9(hashJsonPath, "utf8"));
  } catch (e) {
    return null;
  }
  const currentScan = buildMemoryIndex(targetDir);
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
function handleScan(options) {
  console.log(`
\u{1F50D} \x1B[36mCodebase Scan target: ${options.target}\x1B[0m`);
  console.log("==================================================");
  const { files, ignoredCount } = scanTarget(options.target);
  const frameworkSignals = detectFrameworkSignals(files, options.target);
  const dependencySignals = detectDependencySignals(files, options.target);
  const aiDevOsSignals = detectAiDevOsSignals(files);
  const risks = detectRisks(files, options.target);
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
function handleMemoryBuild(options) {
  console.log(`
\u{1F9E0} \x1B[36mBuilding Codebase Memory in: ${options.target}\x1B[0m`);
  console.log("==================================================");
  const index = buildMemoryIndex(options.target);
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
function handleMemoryRefresh(options) {
  console.log(`
\u{1F9E0} \x1B[36mRefreshing Codebase Memory in: ${options.target}\x1B[0m`);
  console.log("==================================================");
  const diff = diffMemory(options.target);
  if (!diff) {
    console.log("  No existing memory index found. Building fresh index...");
    handleMemoryBuild(options);
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
function handleMemoryDiff(options) {
  console.log(`
\u{1F9E0} \x1B[36mDiffing Codebase State against Memory in: ${options.target}\x1B[0m`);
  console.log("==================================================");
  const diff = diffMemory(options.target);
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
function handleFeedbackAdd(options) {
  const intelDir = join8(options.target, ".ai", "intelligence");
  if (!options.dryRun && !existsSync8(intelDir)) {
    mkdirSync3(intelDir, { recursive: true });
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
  const feedbackLogPath = join8(intelDir, "feedback-log.jsonl");
  if (options.dryRun) {
    console.log(`\x1B[36m[DRY-RUN] WOULD APPEND TO ${feedbackLogPath}:\x1B[0m`);
    console.log(recordLine.trim());
  } else {
    try {
      let isDuplicate = false;
      if (existsSync8(feedbackLogPath)) {
        const lines = readFileSync9(feedbackLogPath, "utf8").split("\n");
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
      writeFileSync4(feedbackLogPath, recordLine, { flag: "a", encoding: "utf8" });
      console.log(`\u2714 Feedback successfully added (ID: ${rawRecord.id})`);
    } catch (e) {
      console.error(`\x1B[31mError: Failed to write to feedback-log.jsonl: ${e.message}\x1B[0m`);
      process.exit(1);
    }
  }
}
function handleFeedbackList(options) {
  const feedbackLogPath = join8(options.target, ".ai", "intelligence", "feedback-log.jsonl");
  if (!existsSync8(feedbackLogPath)) {
    console.log("No feedback logged yet.");
    return;
  }
  try {
    const content = readFileSync9(feedbackLogPath, "utf8");
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
  const intelDir = join8(options.target, ".ai", "intelligence");
  const feedbackLogPath = join8(intelDir, "feedback-log.jsonl");
  if (!existsSync8(feedbackLogPath)) {
    console.log("No feedback logs found to compile.");
    return;
  }
  try {
    const content = readFileSync9(feedbackLogPath, "utf8");
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
    const targetRulesPath = join8(intelDir, "learning-rules.md");
    if (options.dryRun) {
      console.log(`\x1B[36m[DRY-RUN] WOULD WRITE TO ${targetRulesPath}:\x1B[0m`);
      console.log(md);
    } else {
      writeFileSync4(targetRulesPath, md, "utf8");
      console.log(`\u2714 Compiled ${lines.length} feedback items into learning rules in .ai/intelligence/learning-rules.md`);
    }
  } catch (e) {
    console.error(`\x1B[31mError: Failed to compile learning rules: ${e.message}\x1B[0m`);
    process.exit(1);
  }
}
function handleImprovePropose(options) {
  const proposalsDir = join8(options.target, ".ai", "proposals");
  if (!options.dryRun && !existsSync8(proposalsDir)) {
    mkdirSync3(proposalsDir, { recursive: true });
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
  const gitignorePath = join8(options.target, ".gitignore");
  const agentsPath = join8(options.target, "AGENTS.md");
  if (!existsSync8(gitignorePath)) {
    problem = "Missing .gitignore file in target workspace. AI agents may scan large build directories and run out of token context.";
    evidence = `.gitignore file is not present at root directory: ${options.target}`;
    affectedFiles = [".gitignore"];
    suggestedChange = "Create a standard .gitignore file to exclude node_modules, build/ and dist/ directories.";
    rollbackPlan = "git clean -fd .gitignore";
  } else if (!existsSync8(agentsPath)) {
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
  const proposalFile = join8(proposalsDir, `${id}.md`);
  if (options.dryRun) {
    console.log(`\x1B[36m[DRY-RUN] WOULD WRITE PROPOSAL TO ${proposalFile}:\x1B[0m`);
    console.log(md);
  } else {
    writeFileSync4(proposalFile, md, "utf8");
    console.log(`\u2714 Created codebase improvement proposal: .ai/proposals/${id}.md`);
  }
}
function handleImproveReview(options) {
  const proposalsDir = join8(options.target, ".ai", "proposals");
  if (!existsSync8(proposalsDir)) {
    console.log("No improvement proposals found.");
    return;
  }
  try {
    const files = readdirSync(proposalsDir).filter((f) => f.startsWith("proposal-") && f.endsWith(".md"));
    if (files.length === 0) {
      console.log("No improvement proposals found.");
      return;
    }
    console.log(`
\u{1F4CB} \x1B[36mCodebase Improvement Proposals\x1B[0m`);
    console.log("==================================================");
    files.forEach((file) => {
      const fullPath = join8(proposalsDir, file);
      const content = readFileSync9(fullPath, "utf8");
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
  const proposalsDir = join8(options.target, ".ai", "proposals");
  if (!existsSync8(proposalsDir)) {
    console.log("Improvement Proposal Engine Status:");
    console.log("  Total Proposals:  0");
    console.log("  Pending Approval: 0");
    return;
  }
  try {
    const files = readdirSync(proposalsDir).filter((f) => f.startsWith("proposal-") && f.endsWith(".md"));
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    files.forEach((file) => {
      const content = readFileSync9(join8(proposalsDir, file), "utf8");
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
  return createHash2("sha256").update(content, "utf8").digest("hex");
}
function validatePath(targetRoot, relPath) {
  const normalizedRel = relPath.replace(/\\/g, "/");
  if (normalizedRel.startsWith("/") || normalizedRel.includes("..")) {
    return { valid: false, reason: `Path '${relPath}' contains directory traversal or is absolute.`, type: "outside" };
  }
  const resolved = resolve3(targetRoot, relPath);
  const relativeFromRoot = relative(targetRoot, resolved);
  if (relativeFromRoot.startsWith("..") || isAbsolute2(relativeFromRoot) || resolved === targetRoot) {
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
  if (!existsSync8(proposalFile)) {
    gates.frontmatter = { status: "fail", reason: "missing frontmatter" };
    return { valid: false, reason: "missing frontmatter", gates };
  }
  const content = readFileSync9(proposalFile, "utf8");
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
      } else if (existsSync8(resolvedPath) && !op.overwrite) {
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
      } else if (!existsSync8(resolvedPath)) {
        if (constraintsStatus === "pass") {
          constraintsStatus = "fail";
          constraintsReason = `replace_text zero matches`;
        }
      } else {
        const fileContent = readFileSync9(resolvedPath, "utf8");
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
  console.log(`\u{1F50D} \x1B[36mGenerating diff for proposal: ${proposalFile}\x1B[0m
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
        const exists = existsSync8(op.resolvedPath);
        if (exists) {
          console.log(`  \x1B[31m\u26A0\uFE0F  [Overwriting existing file]\x1B[0m`);
        } else {
          console.log(`  \x1B[32m+ [Creating new file]\x1B[0m`);
        }
        const linesCount = op.content.split(/\r?\n/).length;
        console.log(`  + [File content: ${linesCount} line(s), overwrite: ${!!op.overwrite}]`);
        printTruncatedLines(op.content, "  +", "\x1B[32m");
      } else if (type === "append_line") {
        const exists = existsSync8(op.resolvedPath);
        let currentFileContent = "";
        if (exists) {
          currentFileContent = readFileSync9(op.resolvedPath, "utf8");
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
    const logDir2 = join8(options.target, ".ai", "proposals");
    if (!existsSync8(logDir2)) {
      try {
        mkdirSync3(logDir2, { recursive: true });
      } catch (e) {
      }
    }
    const logFile2 = join8(logDir2, "apply-log.jsonl");
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
      writeFileSync4(logFile2, JSON.stringify(record2) + "\n", { flag: "a", encoding: "utf8" });
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
      const relPath = relative(options.target, op.resolvedPath).replace(/\\/g, "/");
      if (!filesChanged.includes(relPath)) {
        filesChanged.push(relPath);
      }
      if (existsSync8(op.resolvedPath)) {
        const fileContent = readFileSync9(op.resolvedPath, "utf8");
        beforeHashes[relPath] = getSha256(fileContent);
      } else {
        beforeHashes[relPath] = null;
      }
    });
    operations.forEach((op, idx) => {
      const relPath = relative(options.target, op.resolvedPath).replace(/\\/g, "/");
      console.log(`  Executing Operation #${idx + 1} (${op.type}) on '${relPath}'...`);
      if (op.type === "create_file") {
        const dir = dirname4(op.resolvedPath);
        if (!existsSync8(dir)) {
          mkdirSync3(dir, { recursive: true });
        }
        const exists = existsSync8(op.resolvedPath);
        writeFileSync4(op.resolvedPath, op.content, "utf8");
        if (exists) {
          console.log(`    [OVERWRITTEN] Overwrote existing file '${relPath}'.`);
        } else {
          console.log(`    [CREATED] Created new file '${relPath}'.`);
        }
      } else if (op.type === "append_line") {
        let content = "";
        if (existsSync8(op.resolvedPath)) {
          content = readFileSync9(op.resolvedPath, "utf8");
        }
        const fileLines = content.split(/\r?\n/);
        const lineExists = fileLines.some((l) => l.trim() === op.line.trim());
        if (!lineExists) {
          let newContent = content;
          if (content.length > 0 && !content.endsWith("\n") && !content.endsWith("\r")) {
            newContent += "\n";
          }
          newContent += op.line + "\n";
          const dir = dirname4(op.resolvedPath);
          if (!existsSync8(dir)) {
            mkdirSync3(dir, { recursive: true });
          }
          writeFileSync4(op.resolvedPath, newContent, "utf8");
          console.log(`    [APPENDED] Appended 1 line to '${relPath}'.`);
        } else {
          console.log(`    [IDEMPOTENT] Line already exists in '${relPath}'. Skipping append.`);
        }
      } else if (op.type === "replace_text") {
        const fileContent = readFileSync9(op.resolvedPath, "utf8");
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
        writeFileSync4(op.resolvedPath, newContent, "utf8");
        console.log(`    [REPLACED] Replaced ${count} occurrence(s) of find text in '${relPath}'.`);
      }
    });
    filesChanged.forEach((relPath) => {
      const fullPath = resolve3(options.target, relPath);
      if (existsSync8(fullPath)) {
        const fileContent = readFileSync9(fullPath, "utf8");
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
  const logDir = join8(options.target, ".ai", "proposals");
  if (!existsSync8(logDir)) {
    mkdirSync3(logDir, { recursive: true });
  }
  const logFile = join8(logDir, "apply-log.jsonl");
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
    writeFileSync4(logFile, JSON.stringify(record) + "\n", { flag: "a", encoding: "utf8" });
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
  const logFile = join8(options.target, ".ai", "proposals", "apply-log.jsonl");
  if (!existsSync8(logFile)) {
    console.log("No apply log found.");
    return;
  }
  try {
    const lines = readFileSync9(logFile, "utf8").trim().split(/\r?\n/);
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
function handleStatus(options) {
  console.log(`
\u{1F4CA} \x1B[36mRepository Intelligence Status: ${options.target}\x1B[0m`);
  console.log("==================================================");
  let pkgName = "unknown";
  let pkgVersion2 = "unknown";
  try {
    const pkgPath = join8(options.target, "package.json");
    if (existsSync8(pkgPath)) {
      const pkg = JSON.parse(readFileSync9(pkgPath, "utf8"));
      pkgName = pkg.name || pkgName;
      pkgVersion2 = pkg.version || pkgVersion2;
    }
  } catch (e) {
  }
  console.log(`  \x1B[33mProject Info:\x1B[0m`);
  console.log(`    Package Name:    ${pkgName}`);
  console.log(`    Package Version: ${pkgVersion2}`);
  const { files } = scanTarget(options.target);
  const frameworkSignals = detectFrameworkSignals(files, options.target);
  const dependencySignals = detectDependencySignals(files, options.target);
  console.log(`  \x1B[33mFramework & Dependency Signals:\x1B[0m`);
  console.log(`    Frameworks:      ${frameworkSignals.join(", ") || "None"}`);
  console.log(`    Dependencies:    ${dependencySignals.join(", ") || "None"}`);
  const memoryHashPath = join8(options.target, ".ai", "intelligence", "memory.hash.json");
  let memoryStatus = "\x1B[31mMISSING\x1B[0m";
  let lastBuildTime = "N/A";
  if (existsSync8(memoryHashPath)) {
    try {
      const memObj = JSON.parse(readFileSync9(memoryHashPath, "utf8"));
      lastBuildTime = memObj.generated_at || "N/A";
      const diff = diffMemory(options.target);
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
  const feedbackPath = join8(options.target, ".ai", "intelligence", "feedback-log.jsonl");
  let feedbackCount = 0;
  if (existsSync8(feedbackPath)) {
    try {
      feedbackCount = readFileSync9(feedbackPath, "utf8").trim().split(/\r?\n/).filter((l) => l.trim() !== "").length;
    } catch (e) {
    }
  }
  const rulesPath = join8(options.target, ".ai", "intelligence", "learning-rules.md");
  const rulesStatus = existsSync8(rulesPath) ? "\x1B[32mPRESENT\x1B[0m" : "\x1B[31mMISSING\x1B[0m";
  console.log(`  \x1B[33mFeedback Loop & Rules:\x1B[0m`);
  console.log(`    Feedback Count:  ${feedbackCount}`);
  console.log(`    Learning Rules:  ${rulesStatus}`);
  const proposalsDir = join8(options.target, ".ai", "proposals");
  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  let totalProposals = 0;
  if (existsSync8(proposalsDir)) {
    try {
      const propFiles = readdirSync(proposalsDir).filter((f) => f.startsWith("proposal-") && f.endsWith(".md"));
      totalProposals = propFiles.length;
      propFiles.forEach((file) => {
        const content = readFileSync9(join8(proposalsDir, file), "utf8");
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
  console.log(`  \x1B[33mImprovement Proposals:\x1B[0m`);
  console.log(`    Total proposals: ${totalProposals}`);
  console.log(`    Pending:         \x1B[33m${pendingCount}\x1B[0m`);
  console.log(`    Approved:        \x1B[32m${approvedCount}\x1B[0m`);
  console.log(`    Rejected:        \x1B[31m${rejectedCount}\x1B[0m`);
  const applyLogPath = join8(options.target, ".ai", "proposals", "apply-log.jsonl");
  let applyLogCount = 0;
  if (existsSync8(applyLogPath)) {
    try {
      applyLogCount = readFileSync9(applyLogPath, "utf8").trim().split(/\r?\n/).filter((l) => l.trim() !== "").length;
    } catch (e) {
    }
  }
  console.log(`  \x1B[33mApply Audit Log:\x1B[0m`);
  console.log(`    Apply Count:     ${applyLogCount}`);
  let nextMove = "mmdo status";
  if (!existsSync8(join8(options.target, ".ai", "config.yaml"))) {
    nextMove = "\x1B[36mnpx multimodel-dev-os init\x1B[0m (initialize MultiModel Dev OS first)";
  } else if (!existsSync8(memoryHashPath)) {
    nextMove = "\x1B[36mnpx multimodel-dev-os memory build\x1B[0m (initialize memory index)";
  } else {
    const diff = diffMemory(options.target);
    if (diff && (diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0)) {
      nextMove = "\x1B[36mnpx multimodel-dev-os memory refresh\x1B[0m (update memory with changes)";
    } else if (feedbackCount > 0 && !existsSync8(rulesPath)) {
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
function getWorkflowsPath(target) {
  let workflowsPath = join8(target, ".ai", "registries", "workflows.yaml");
  let usingFallback = false;
  if (!existsSync8(workflowsPath)) {
    const fallbackPath = join8(sourceRoot, ".ai", "registries", "workflows.yaml");
    if (existsSync8(fallbackPath)) {
      workflowsPath = fallbackPath;
      usingFallback = true;
    }
  }
  return { workflowsPath, usingFallback };
}
function handleWorkflowList(options) {
  const { workflowsPath, usingFallback } = getWorkflowsPath(options.target);
  if (!existsSync8(workflowsPath)) {
    console.log("No workflows registry found.");
    return;
  }
  if (usingFallback) {
    console.log("\x1B[33mNotice: Local workflows registry not found. Using bundled workflows registry fallback.\x1B[0m");
  }
  try {
    const registry = parseYaml(readFileSync9(workflowsPath, "utf8")) || {};
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
    });
    console.log();
  } catch (e) {
    console.error(`\x1B[31mError loading workflows: ${e.message}\x1B[0m`);
  }
}
function handleWorkflowShow(wName, options) {
  const { workflowsPath, usingFallback } = getWorkflowsPath(options.target);
  if (!existsSync8(workflowsPath)) {
    console.log("No workflows registry found.");
    return;
  }
  if (usingFallback) {
    console.log("\x1B[33mNotice: Local workflows registry not found. Using bundled workflows registry fallback.\x1B[0m");
  }
  try {
    const registry = parseYaml(readFileSync9(workflowsPath, "utf8")) || {};
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
function handleWorkflowPlan(wName, options) {
  const { workflowsPath, usingFallback } = getWorkflowsPath(options.target);
  if (!existsSync8(workflowsPath)) {
    console.log("No workflows registry found.");
    return;
  }
  if (usingFallback) {
    console.log("\x1B[33mNotice: Local workflows registry not found. Using bundled workflows registry fallback.\x1B[0m");
  }
  try {
    const registry = parseYaml(readFileSync9(workflowsPath, "utf8")) || {};
    const workflows = registry.workflows || {};
    const wf = workflows[wName];
    if (!wf) {
      console.error(`\x1B[31mError: Workflow '${wName}' not found.\x1B[0m`);
      process.exit(1);
    }
    const name = wf.name || wName;
    console.log(`
\u{1F4DD} \x1B[36mExecution Plan for Workflow: ${name}\x1B[0m`);
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
function handleWorkflowRun(wName, options) {
  const { workflowsPath, usingFallback } = getWorkflowsPath(options.target);
  if (!existsSync8(workflowsPath)) {
    console.log("No workflows registry found.");
    return;
  }
  if (usingFallback) {
    console.log("\x1B[33mNotice: Local workflows registry not found. Using bundled workflows registry fallback.\x1B[0m");
  }
  try {
    const registry = parseYaml(readFileSync9(workflowsPath, "utf8")) || {};
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
      "scan": () => handleScan(options),
      "doctor": () => handleDoctor(options),
      "verify": () => handleVerify({ ...options, noExit: true }),
      "memory diff": () => handleMemoryDiff({ ...options, noExit: true }),
      "memory refresh": () => handleMemoryRefresh(options),
      "memory build": () => handleMemoryBuild(options),
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
function handleHandoffBuild(options) {
  const intelDir = join8(options.target, ".ai", "intelligence");
  if (!existsSync8(intelDir)) {
    mkdirSync3(intelDir, { recursive: true });
  }
  const handoffPath = join8(intelDir, "handoff.md");
  let pkgName = "unknown";
  let pkgVersion2 = "unknown";
  try {
    const pkgPath = join8(options.target, "package.json");
    if (existsSync8(pkgPath)) {
      const pkg = JSON.parse(readFileSync9(pkgPath, "utf8"));
      pkgName = pkg.name || pkgName;
      pkgVersion2 = pkg.version || pkgVersion2;
    }
  } catch (e) {
  }
  const { files } = scanTarget(options.target);
  const frameworkSignals = detectFrameworkSignals(files, options.target);
  const dependencySignals = detectDependencySignals(files, options.target);
  const memoryHashPath = join8(intelDir, "memory.hash.json");
  let memoryStatus = "MISSING";
  let memoryTime = "N/A";
  if (existsSync8(memoryHashPath)) {
    try {
      const memObj = JSON.parse(readFileSync9(memoryHashPath, "utf8"));
      memoryTime = memObj.generated_at || "N/A";
      const diff = diffMemory(options.target);
      if (diff) {
        memoryStatus = diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 ? "CURRENT" : "STALE";
      }
    } catch (e) {
      memoryStatus = "CORRUPT";
    }
  }
  const feedbackPath = join8(intelDir, "feedback-log.jsonl");
  let feedbackCount = 0;
  if (existsSync8(feedbackPath)) {
    try {
      feedbackCount = readFileSync9(feedbackPath, "utf8").trim().split(/\r?\n/).filter((l) => l.trim() !== "").length;
    } catch (e) {
    }
  }
  const rulesPath = join8(intelDir, "learning-rules.md");
  const rulesStatus = existsSync8(rulesPath) ? "PRESENT" : "MISSING";
  const proposalsDir = join8(options.target, ".ai", "proposals");
  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  if (existsSync8(proposalsDir)) {
    try {
      const propFiles = readdirSync(proposalsDir).filter((f) => f.startsWith("proposal-") && f.endsWith(".md"));
      propFiles.forEach((file) => {
        const content = readFileSync9(join8(proposalsDir, file), "utf8");
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
  const applyLogPath = join8(proposalsDir, "apply-log.jsonl");
  let applyLogCount = 0;
  let lastApplyId = "None";
  if (existsSync8(applyLogPath)) {
    try {
      const lines = readFileSync9(applyLogPath, "utf8").trim().split(/\r?\n/).filter((l) => l.trim() !== "");
      applyLogCount = lines.length;
      if (applyLogCount > 0) {
        const lastRecord = JSON.parse(lines[lines.length - 1]);
        lastApplyId = lastRecord.id || "unknown";
      }
    } catch (e) {
    }
  }
  let rulesSummary = "No learning rules defined yet.";
  if (existsSync8(rulesPath)) {
    try {
      const rulesContent = readFileSync9(rulesPath, "utf8");
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
  if (!existsSync8(join8(options.target, ".ai", "config.yaml"))) {
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
    writeFileSync4(handoffPath, handoffContent, "utf8");
    console.log(`
\u2714 Handoff context built successfully in: .ai/intelligence/handoff.md`);
  } catch (e) {
    console.error(`\x1B[31mError writing handoff: ${e.message}\x1B[0m`);
  }
}
function handleHandoffShow(options) {
  const handoffPath = join8(options.target, ".ai", "intelligence", "handoff.md");
  if (!existsSync8(handoffPath)) {
    console.log("No compiled handoff file exists. Building first...");
    handleHandoffBuild(options);
  }
  try {
    const content = readFileSync9(handoffPath, "utf8");
    console.log("\n" + content);
  } catch (e) {
    console.error(`\x1B[31mError reading handoff: ${e.message}\x1B[0m`);
  }
}
function handleDoctorIntelligence(options) {
  console.log(`
\u{1FA7A} \x1B[36mRunning advisory intelligence doctor checkup in: ${options.target}\x1B[0m
`);
  let warnings = 0;
  const warn = (msg) => {
    console.warn(`  \x1B[33m[WARNING]\x1B[0m ${msg}`);
    warnings++;
  };
  const memoryHashPath = join8(options.target, ".ai", "intelligence", "memory.hash.json");
  if (!existsSync8(memoryHashPath)) {
    warn("Memory hash index (.ai/intelligence/memory.hash.json) is MISSING. Run `memory build` first.");
  } else {
    try {
      const diff = diffMemory(options.target);
      if (!diff) {
        warn("Memory hash index is present but corrupt.");
      } else if (diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0) {
        warn(`Memory hash index is STALE. Delts: +${diff.added.length}, -${diff.removed.length}, ~${diff.changed.length}. Run \`memory refresh\`.`);
      }
    } catch (e) {
      warn("Failed to diff memory index.");
    }
  }
  const feedbackPath = join8(options.target, ".ai", "intelligence", "feedback-log.jsonl");
  if (!existsSync8(feedbackPath)) {
    warn("Feedback log (.ai/intelligence/feedback-log.jsonl) is MISSING.");
  }
  const rulesPath = join8(options.target, ".ai", "intelligence", "learning-rules.md");
  if (!existsSync8(rulesPath)) {
    warn("Learning rules (.ai/intelligence/learning-rules.md) are MISSING. Run `feedback summarize` to compile logs.");
  }
  const proposalsDir = join8(options.target, ".ai", "proposals");
  if (!existsSync8(proposalsDir)) {
    warn("Proposals directory (.ai/proposals) is MISSING.");
  } else {
    try {
      const files = readdirSync(proposalsDir).filter((f) => f.startsWith("proposal-") && f.endsWith(".md"));
      let pending = 0;
      files.forEach((file) => {
        const content = readFileSync9(join8(proposalsDir, file), "utf8");
        const fmMatch = content.match(/^---([\s\S]*?)---/);
        if (fmMatch) {
          const metadata = parseYaml(fmMatch[1]) || {};
          if ((metadata.approval_status || "pending") === "pending") {
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
  const applyLogPath = join8(options.target, ".ai", "proposals", "apply-log.jsonl");
  if (!existsSync8(applyLogPath)) {
    warn("Apply audit log (.ai/proposals/apply-log.jsonl) is MISSING.");
  }
  const gitignorePath = join8(options.target, ".gitignore");
  if (existsSync8(gitignorePath)) {
    const gitignoreContent = readFileSync9(gitignorePath, "utf8");
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
  if (existsSync8(memoryHashPath)) {
    try {
      const memObj = JSON.parse(readFileSync9(memoryHashPath, "utf8"));
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
      const pkg = JSON.parse(readFileSync9(join8(target, "package.json"), "utf8"));
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
      const pkg = JSON.parse(readFileSync9(join8(target, "package.json"), "utf8"));
      if (pkg.scripts) {
        Object.keys(pkg.scripts).forEach((k) => packageScripts.push(k));
      }
    } catch (e) {
    }
  }
  const githubWorkflows = [];
  const githubDir = join8(target, ".github", "workflows");
  if (existsSync8(githubDir)) {
    try {
      readdirSync(githubDir).forEach((f) => {
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
    analysis.envRiskMarkers.forEach((m) => console.log(`    \u2514\u2500> ${m} (potential secrets exposure risk)`));
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
  const planPath = join8(options.target, ".ai", "intelligence", "onboarding.plan.json");
  const reportPath = join8(options.target, ".ai", "intelligence", "onboarding.report.md");
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
    const intelDir = join8(options.target, ".ai", "intelligence");
    if (!options.dryRun && !existsSync8(intelDir)) {
      mkdirSync3(intelDir, { recursive: true });
    }
    if (!options.dryRun) {
      writeFileSync4(planPath, JSON.stringify(planData, null, 2), "utf8");
      writeFileSync4(reportPath, reportMd, "utf8");
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
  const planPath = join8(options.target, ".ai", "intelligence", "onboarding.plan.json");
  if (!existsSync8(planPath)) {
    console.error('\x1B[31mError: Onboarding plan not found. Run "npx multimodel-dev-os onboard plan" first.\x1B[0m');
    process.exit(1);
  }
  let plan;
  try {
    plan = JSON.parse(readFileSync9(planPath, "utf8"));
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
      srcFile = join8(sourceRoot, "RUNBOOK.md");
    } else {
      srcFile = join8(sourceRoot, f.source_template);
    }
    operations.push({ dest: f.path, src: srcFile });
  });
  const templateDir = join8(sourceRoot, "examples", template);
  const templateAiDir = join8(templateDir, ".ai");
  if (existsSync8(templateAiDir) && !options.caveman) {
    const subdirs = ["context", "skills"];
    subdirs.forEach((sub) => {
      const subPath = join8(templateAiDir, sub);
      if (existsSync8(subPath)) {
        readdirSync(subPath).forEach((file) => {
          operations.push({
            dest: join8(".ai", sub, file),
            src: join8(subPath, file)
          });
        });
      }
    });
  }
  const globalAiSubdirs = ["context", "agents", "skills", "prompts", "checks", "templates", "session-logs", "registries", "proposals", "intelligence"];
  globalAiSubdirs.forEach((sub) => {
    const globalPath = join8(sourceRoot, ".ai", sub);
    if (existsSync8(globalPath)) {
      readdirSync(globalPath).forEach((file) => {
        const destRel = join8(".ai", sub, file);
        if (!operations.some((op) => op.dest === destRel)) {
          if (options.caveman && (sub === "context" || sub === "skills" || sub === "prompts" || sub === "checks")) {
            return;
          }
          operations.push({
            dest: destRel,
            src: join8(globalPath, file)
          });
        }
      });
    }
  });
  let createdCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;
  operations.forEach((op) => {
    const destPath = join8(options.target, op.dest);
    const destDir = dirname4(destPath);
    if (existsSync8(destPath)) {
      if (options.force) {
        if (!options.dryRun) {
          const backupPath = destPath + ".bak";
          writeFileSync4(backupPath, readFileSync9(destPath));
          if (!existsSync8(destDir))
            mkdirSync3(destDir, { recursive: true });
          writeFileSync4(destPath, readFileSync9(op.src));
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
        if (!existsSync8(destDir))
          mkdirSync3(destDir, { recursive: true });
        writeFileSync4(destPath, readFileSync9(op.src));
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
    const fullPath = join8(options.target, f);
    const exists = existsSync8(fullPath);
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
function getEnabledAdapters(target) {
  const configPath = join8(target, ".ai", "config.yaml");
  if (existsSync8(configPath)) {
    try {
      const config = parseYaml(readFileSync9(configPath, "utf8")) || {};
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
  Object.keys(ADAPTERS).forEach((name) => {
    const a = ADAPTERS[name];
    const isEnabled = enabled[name] || false;
    const rulesFile = a.rules_file;
    const exists = existsSync8(join8(options.target, rulesFile));
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
  const adaptersToDiff = [];
  if (aName === "all") {
    const enabled = getEnabledAdapters(options.target);
    Object.keys(ADAPTERS).forEach((name) => {
      if (enabled[name])
        adaptersToDiff.push(name);
    });
  } else {
    if (!ADAPTERS[aName]) {
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
    const a = ADAPTERS[name];
    const srcFile = join8(sourceRoot, "adapters", name, a.rules_file);
    const destFile = join8(options.target, a.rules_file);
    if (!existsSync8(srcFile)) {
      console.warn(`Warning: Source file for adapter '${name}' is missing at: ${srcFile}`);
      return;
    }
    const srcContent = readFileSync9(srcFile, "utf8");
    if (existsSync8(destFile)) {
      const destContent = readFileSync9(destFile, "utf8");
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
  const adaptersToSync = [];
  if (aName === "all") {
    const enabled = getEnabledAdapters(options.target);
    Object.keys(ADAPTERS).forEach((name) => {
      if (enabled[name])
        adaptersToSync.push(name);
    });
  } else {
    if (!ADAPTERS[aName]) {
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
    const a = ADAPTERS[name];
    const srcFile = join8(sourceRoot, "adapters", name, a.rules_file);
    const destFile = join8(options.target, a.rules_file);
    const destDir = dirname4(destFile);
    if (!existsSync8(srcFile)) {
      console.warn(`Warning: Source file for adapter '${name}' is missing at: ${srcFile}`);
      return;
    }
    if (existsSync8(destFile)) {
      if (options.force) {
        if (!options.dryRun) {
          const backupPath = destFile + ".bak";
          writeFileSync4(backupPath, readFileSync9(destFile));
          if (!existsSync8(destDir))
            mkdirSync3(destDir, { recursive: true });
          writeFileSync4(destFile, readFileSync9(srcFile));
          console.log(`  \x1B[33mOVERWRITE (BACKUP CREATED):\x1B[0m ${a.rules_file} -> ${a.rules_file}.bak`);
        } else {
          console.log(`  \x1B[36m[DRY-RUN] WOULD OVERWRITE & BACKUP:\x1B[0m ${a.rules_file}`);
        }
      } else {
        console.log(`  \x1B[37m[SKIP] Already exists:\x1B[0m ${a.rules_file}`);
      }
    } else {
      if (!options.dryRun) {
        if (!existsSync8(destDir))
          mkdirSync3(destDir, { recursive: true });
        writeFileSync4(destFile, readFileSync9(srcFile));
        console.log(`  \x1B[32mCREATE:\x1B[0m ${a.rules_file}`);
      } else {
        console.log(`  \x1B[36m[DRY-RUN] WOULD CREATE:\x1B[0m ${a.rules_file}`);
      }
    }
  });
  console.log();
}
function handleDoctorOnboarding(options) {
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
    if (!existsSync8(join8(options.target, f))) {
      warn(`Crucial onboarding file '${f}' is missing from project root.`);
    }
  });
  const configPath = join8(options.target, ".ai", "config.yaml");
  if (!existsSync8(configPath)) {
    warn("MultiModel Dev OS configuration file (.ai/config.yaml) is missing.");
  }
  const registriesDir = join8(options.target, ".ai", "registries");
  if (!existsSync8(registriesDir)) {
    warn("Registries directory (.ai/registries) is missing.");
  }
  const proposalsDir = join8(options.target, ".ai", "proposals");
  if (!existsSync8(proposalsDir)) {
    warn("Proposals directory (.ai/proposals) is missing.");
  }
  const intelligenceDir = join8(options.target, ".ai", "intelligence");
  if (!existsSync8(intelligenceDir)) {
    warn("Intelligence directory (.ai/intelligence) is missing.");
  }
  const gitignorePath = join8(options.target, ".gitignore");
  if (existsSync8(gitignorePath)) {
    const gitignoreContent = readFileSync9(gitignorePath, "utf8");
    const checkIgnore = (pattern) => {
      if (!gitignoreContent.includes(pattern)) {
        warn(`Generated runtime file '${pattern}' is not ignored in .gitignore.`);
      }
    };
    checkIgnore("onboarding.plan.json");
    checkIgnore("onboarding.report.md");
  }
  const { files } = scanTarget(options.target);
  const packageManagers = detectDependencySignals(files, options.target);
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
            console.log(`    \u2514\u2500 ${sub.name.padEnd(35)} \u2192 \x1B[36mnpx multimodel-dev-os ${sub.command}${targetFlag}\x1B[0m`);
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
      const cliPath = join8(sourceRoot, "bin", "multimodel-dev-os.js");
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
    return new Promise((resolve4) => {
      process.stdin.once("keypress", () => {
        resolve4();
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
function getPluginsDir(targetDir) {
  return join8(targetDir, ".ai", "plugins");
}
function handlePluginList(options) {
  const pluginsDir = getPluginsDir(options.target);
  const rawRelPath = relative(process.cwd(), join8(sourceRoot, ".ai", "plugins", "plugin.example.yaml")).replace(/\\/g, "/");
  const examplePath = rawRelPath.startsWith(".") ? rawRelPath : `./${rawRelPath}`;
  if (!existsSync8(pluginsDir)) {
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
    files = readdirSync(pluginsDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  } catch (e) {
  }
  const plugins = [];
  files.forEach((f) => {
    try {
      const p = parseYaml(readFileSync9(join8(pluginsDir, f), "utf8"));
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
  if (existsSync8(pluginsDir)) {
    const files = readdirSync(pluginsDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
    for (const f of files) {
      try {
        const parsed = parseYaml(readFileSync9(join8(pluginsDir, f), "utf8"));
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
\u{1F50D} \x1B[36mPlugin Specifications: ${p.name} (v${p.version})\x1B[0m`);
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
  if (!existsSync8(fullPath)) {
    console.error(`\x1B[31mError: Plugin file not found at: ${pluginPath}\x1B[0m`);
    process.exit(1);
  }
  console.log(`
\u{1F4CB} \x1B[34mValidating Plugin: ${pluginPath}\x1B[0m`);
  console.log("==================================================");
  let errors = 0;
  let plugin = null;
  try {
    plugin = parseYaml(readFileSync9(fullPath, "utf8"));
  } catch (e) {
    console.error(`  \x1B[31m\u2717 [SYNTAX] Failed to parse YAML: ${e.message}\x1B[0m`);
    errors++;
  }
  if (plugin) {
    const reqKeys = ["name", "slug", "version", "description", "author"];
    reqKeys.forEach((k) => {
      if (plugin[k] === void 0 || plugin[k] === null) {
        console.error(`  \x1B[31m\u2717 [METADATA] Missing required key: ${k}\x1B[0m`);
        errors++;
      } else if (typeof plugin[k] !== "string") {
        console.error(`  \x1B[31m\u2717 [METADATA] Key '${k}' must be a string (found: ${typeof plugin[k]})\x1B[0m`);
        errors++;
      } else if (k === "slug") {
        if (!/^[a-z0-9-_]+$/i.test(plugin[k])) {
          console.error(`  \x1B[31m\u2717 [METADATA] Key 'slug' must be alphanumeric with dashes or underscores only (found: "${plugin[k]}")\x1B[0m`);
          errors++;
        } else {
          console.log(`  \x1B[32m\u2713 [METADATA] Key: slug ("${plugin[k]}")`);
        }
      } else {
        console.log(`  \x1B[32m\u2713 [METADATA] Key: ${k} ("${plugin[k]}")`);
      }
    });
    if (plugin.allowed_file_patterns !== void 0) {
      if (!Array.isArray(plugin.allowed_file_patterns)) {
        console.error(`  \x1B[31m\u2717 [SAFETY] allowed_file_patterns must be an array\x1B[0m`);
        errors++;
      } else {
        plugin.allowed_file_patterns.forEach((pat) => {
          if (typeof pat !== "string") {
            console.error(`  \x1B[31m\u2717 [SAFETY] allowed_file_patterns item must be a string: ${pat}\x1B[0m`);
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
            console.error(`  \x1B[31m\u2717 [SAFETY] File pattern '${pat}' violates safety boundaries (must reside under .ai/ or adapters/, contain no '..', and exclude blacklisted files)\x1B[0m`);
            errors++;
          }
        });
        if (errors === 0) {
          console.log(`  \x1B[32m\u2713 [SAFETY] allowed_file_patterns verified: ${plugin.allowed_file_patterns.length} items`);
        }
      }
    }
    if (plugin.denied_file_patterns !== void 0) {
      if (!Array.isArray(plugin.denied_file_patterns)) {
        console.error(`  \x1B[31m\u2717 [SAFETY] denied_file_patterns must be an array\x1B[0m`);
        errors++;
      } else {
        plugin.denied_file_patterns.forEach((pat) => {
          if (typeof pat !== "string") {
            console.error(`  \x1B[31m\u2717 [SAFETY] denied_file_patterns item must be a string: ${pat}\x1B[0m`);
            errors++;
          }
        });
        console.log(`  \x1B[32m\u2713 [SAFETY] denied_file_patterns verified: ${plugin.denied_file_patterns.length} items`);
      }
    }
    if (plugin.workflows !== void 0) {
      if (typeof plugin.workflows !== "object" || Array.isArray(plugin.workflows)) {
        console.error(`  \x1B[31m\u2717 [CAPABILITIES] workflows must be an object\x1B[0m`);
        errors++;
      } else {
        console.log(`  \x1B[32m\u2713 [CAPABILITIES] workflows verified`);
      }
    }
    if (plugin.templates !== void 0) {
      if (typeof plugin.templates !== "object" || Array.isArray(plugin.templates)) {
        console.error(`  \x1B[31m\u2717 [CAPABILITIES] templates must be an object\x1B[0m`);
        errors++;
      } else {
        console.log(`  \x1B[32m\u2713 [CAPABILITIES] templates verified`);
      }
    }
    if (plugin.adapters !== void 0) {
      if (typeof plugin.adapters !== "object" || Array.isArray(plugin.adapters)) {
        console.error(`  \x1B[31m\u2717 [CAPABILITIES] adapters must be an object\x1B[0m`);
        errors++;
      } else {
        console.log(`  \x1B[32m\u2713 [CAPABILITIES] adapters verified`);
      }
    }
    if (plugin.safety_notes !== void 0) {
      if (typeof plugin.safety_notes !== "string") {
        console.error(`  \x1B[31m\u2717 [SAFETY] safety_notes must be a string\x1B[0m`);
        errors++;
      } else {
        console.log(`  \x1B[32m\u2713 [SAFETY] safety_notes verified`);
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
  if (!existsSync8(fullPath)) {
    console.error(`\x1B[31mError: Plugin file not found at: ${pluginPath}\x1B[0m`);
    process.exit(1);
  }
  const isValid = handlePluginValidate(pluginPath, { noExit: true });
  if (!isValid) {
    console.error(`\x1B[31mError: Plugin validation failed. Installation aborted.\x1B[0m`);
    process.exit(1);
  }
  const policy = loadRegistryPolicy(options.target || process.cwd());
  const pluginContent = readFileSync9(fullPath, "utf8");
  const plugin = parseYaml(pluginContent);
  const slug = plugin.slug;
  const sourceDir = dirname4(fullPath);
  console.log(`
\u{1F4E5} \x1B[34mInstalling Plugin: ${plugin.name} [slug: ${slug}]\x1B[0m`);
  const filesToCopy = [];
  filesToCopy.push({
    src: fullPath,
    dest: join8(".ai", "plugins", `${slug}.yaml`),
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
      const srcFile = join8(sourceDir, normPattern);
      if (existsSync8(srcFile) && statSync(srcFile).isFile()) {
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
    if (existsSync8(item.src)) {
      totalSize += statSync(item.src).size;
    }
  });
  if (totalSize > policy.max_plugin_size_kb * 1024) {
    console.error(`\x1B[31mError: Plugin total size (${(totalSize / 1024).toFixed(1)}KB) exceeds policy limit (${policy.max_plugin_size_kb}KB). Installation aborted.\x1B[0m`);
    process.exit(1);
  }
  let conflicts = false;
  filesToCopy.forEach((item) => {
    const destPath = join8(options.target, item.dest);
    if (existsSync8(destPath)) {
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
      const exists = existsSync8(join8(options.target, item.dest));
      const suffix = exists ? " \x1B[33m(will overwrite)\x1B[0m" : "";
      console.log(`  - \x1B[36m[WOULD COPY]\x1B[0m ${item.src} -> ${item.dest}${suffix}`);
    });
    console.error(`
\x1B[31mError: Installation refused. Run with --approved to apply these changes.\x1B[0m
`);
    process.exit(1);
  }
  filesToCopy.forEach((item) => {
    const destPath = join8(options.target, item.dest);
    const destDir = dirname4(destPath);
    if (!existsSync8(destDir)) {
      mkdirSync3(destDir, { recursive: true });
    }
    if (existsSync8(destPath)) {
      const bakPath = `${destPath}.bak`;
      writeFileSync4(bakPath, readFileSync9(destPath));
      console.log(`  \x1B[33mBACKUP:\x1B[0m Created backup: ${item.dest}.bak`);
    }
    writeFileSync4(destPath, readFileSync9(item.src));
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
  if (!existsSync8(pluginsDir)) {
    console.log("  No plugins directory found. 0 plugins installed.\n");
    return;
  }
  let files = [];
  try {
    files = readdirSync(pluginsDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  } catch (e) {
  }
  if (files.length === 0) {
    console.log("  No plugins installed.\n");
    return;
  }
  files.forEach((f) => {
    try {
      const pPath = join8(pluginsDir, f);
      const p = parseYaml(readFileSync9(pPath, "utf8"));
      if (p && p.name) {
        console.log(`
* \x1B[32m${p.name}\x1B[0m (v${p.version || "1.0.0"})`);
        let missingCount = 0;
        let presentCount = 0;
        if (Array.isArray(p.allowed_file_patterns)) {
          p.allowed_file_patterns.forEach((pat) => {
            const destPath = join8(options.target, pat);
            if (existsSync8(destPath) && statSync(destPath).isFile()) {
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
            const destPath = join8(options.target, pat);
            if (!existsSync8(destPath) || !statSync(destPath).isFile()) {
              console.log(`    \x1B[31m\u2717\x1B[0m ${pat}`);
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
  if (existsSync8(pluginsDir)) {
    try {
      const files = readdirSync(pluginsDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
      files.forEach((f) => {
        try {
          const parsed = parseYaml(readFileSync9(join8(pluginsDir, f), "utf8"));
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
    srcPath = join8(sourceRoot, ".ai", "plugins", "catalog", `${slug}.yaml`);
  } else if (p._source === "local") {
    srcPath = join8(options.target || process.cwd(), ".ai", "plugins", "catalog", `${slug}.yaml`);
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
    srcPath = join8(sourceRoot, ".ai", "registry-cache", regName, "catalog", `${slug}.yaml`);
  } else {
    srcPath = join8(sourceRoot, ".ai", "plugins", "catalog", `${slug}.yaml`);
  }
  if (!existsSync8(srcPath)) {
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
    const destManifest = join8(pluginsDir, `${slug}.yaml`);
    if (!existsSync8(destManifest)) {
      console.log(`  - \x1B[33m${p.name}\x1B[0m (v${p.version}): \x1B[90mNot installed\x1B[0m`);
      console.log(`    Install via: \x1B[36mnpx multimodel-dev-os catalog install ${slug} --approved\x1B[0m`);
    } else {
      let missingCount = 0;
      let presentCount = 0;
      try {
        const targetP = parseYaml(readFileSync9(destManifest, "utf8"));
        if (Array.isArray(targetP.allowed_file_patterns)) {
          targetP.allowed_file_patterns.forEach((pat) => {
            const destPath = join8(options.target, pat);
            if (existsSync8(destPath) && statSync(destPath).isFile()) {
              presentCount++;
            } else {
              missingCount++;
            }
          });
        }
        const total = presentCount + missingCount;
        if (total === 0 || missingCount === 0) {
          console.log(`  - \x1B[32m${p.name}\x1B[0m (v${p.version}): \x1B[32m\u2713 Installed (Up-to-date)\x1B[0m`);
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
function handleCatalogRecommend(options) {
  const analysis = getAnalysis(options.target);
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
          const files = readdirSync(options.target);
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
function handleRegistryList(options) {
  const sources = loadRegistrySources();
  const policy = loadRegistryPolicy(options.target);
  if (options.json) {
    console.log(JSON.stringify(sources, null, 2));
    return;
  }
  console.log(`
\u{1F5C2}\uFE0F  \x1B[36mRegistry Sources [v${version}]\x1B[0m`);
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
  const cacheDir = join8(sourceRoot, ".ai", "registry-cache", name);
  if (existsSync8(cacheDir)) {
    try {
      const files = readdirSync(cacheDir);
      files.forEach((f) => {
        const fp = join8(cacheDir, f);
        if (statSync(fp).isFile()) {
          writeFileSync4(fp, "");
        }
      });
    } catch (e) {
    }
  }
  console.log(`
\x1B[32m\u2714 Registry '${name}' removed successfully.\x1B[0m`);
  console.log(`  Source entry removed from .ai/registries/sources.yaml`);
  if (existsSync8(cacheDir)) {
    console.log(`  Cache directory cleared: .ai/registry-cache/${name}/`);
  }
  console.log("");
}
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
\u26A0\uFE0F  \x1B[33mRegistry Sync Refused \u2014 Explicit Approval Required\x1B[0m`);
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
      return execFileSync(process.execPath, ["-e", script, "--", targetUrl], { encoding: "utf8", timeout: 3e4 });
    };
    console.log(`Downloading: ${catalogUrl}`);
    console.log(`  \u2192 .ai/registry-cache/${name}/catalog.yaml ...`);
    const catalogData = fetchUrlSync(catalogUrl);
    writeFileSync4(catalogDest, catalogData, "utf8");
    const catalogSize = (Buffer.byteLength(catalogData) / 1024).toFixed(1);
    console.log(`  \u2192 OK (${catalogSize}KB)`);
    let manifestData = null;
    try {
      console.log(`Downloading: ${manifestUrl}`);
      console.log(`  \u2192 .ai/registry-cache/${name}/manifest.json ...`);
      manifestData = fetchUrlSync(manifestUrl);
      writeFileSync4(manifestDest, manifestData, "utf8");
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
            writeFileSync4(fileDest, fileData, "utf8");
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
    writeFileSync4(join8(cacheDir, "checksums.json"), checksumsJson, "utf8");
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
  const lockfileStatus = existsSync8(lockfilePath) ? `\x1B[32mpresent\x1B[0m (${lockfileEntryCount} entr${lockfileEntryCount === 1 ? "y" : "ies"})` : "\x1B[90mnot present\x1B[0m";
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
    const cacheDir = join8(sourceRoot, ".ai", "registry-cache", s.name);
    const hasCache = s.type !== "local" && existsSync8(cacheDir);
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
function handleRegistryVerify(name, options) {
  console.log(`
\u{1F50D} \x1B[36mVerifying Registry: ${name}\x1B[0m`);
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
    cacheDir = join8(sourceRoot, ".ai", "plugins");
  } else {
    cacheDir = join8(sourceRoot, ".ai", "registry-cache", name);
  }
  const catalogDest = join8(cacheDir, "catalog.yaml");
  const manifestDest = join8(cacheDir, "manifest.json");
  const checksumPath = join8(cacheDir, "checksums.json");
  if (!isBundled && !existsSync8(cacheDir)) {
    console.error(`\x1B[31mError: No cache found for registry '${name}'. Run registry sync first.\x1B[0m`);
    process.exit(1);
  }
  if (isBundled && !existsSync8(catalogDest)) {
    console.error(`\x1B[31mError: Bundled catalog.yaml not found.\x1B[0m`);
    process.exit(1);
  }
  let catalogContent = "";
  let catalogHash = "N/A";
  if (existsSync8(catalogDest)) {
    catalogContent = readFileSync9(catalogDest, "utf8");
    catalogHash = computeSHA256(catalogContent);
  }
  let manifestObj = null;
  let manifestHash = "N/A";
  if (existsSync8(manifestDest)) {
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
    if (!existsSync8(checksumPath)) {
      console.log(`  \x1B[33m\u26A0 Checksums: Missing checksums.json in cache\x1B[0m`);
      integrityVerified = false;
    } else {
      try {
        const checksums = JSON.parse(readFileSync9(checksumPath, "utf8"));
        Object.entries(checksums).forEach(([file, expectedHash]) => {
          const filePath = join8(cacheDir, file);
          if (!existsSync8(filePath)) {
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
    lockfileStatus = existsSync8(lockfilePath) ? `\x1B[32mpresent\x1B[0m` : `\x1B[33mmissing\x1B[0m`;
    if (!lockEntry) {
      if (policy.require_lockfile_on_verify) {
        provenanceStatus = `\x1B[31m\u2717 Failed (require_lockfile_on_verify is true but entry missing)\x1B[0m`;
        lockfileVerdict = "Failed";
      } else {
        provenanceStatus = `\x1B[33m\u26A0 Missing provenance entry (no sync lock)\x1B[0m`;
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
        trustedPublisherStatus = `\x1B[33m\u26A0 Unknown key_id (Not in trust store)\x1B[0m`;
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
      finalVerdict = `\x1B[33m\u26A0 Unsigned (Allowed by policy)\x1B[0m`;
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
\u{1F50D} \x1B[36mRegistry Source: ${name}\x1B[0m`);
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
    const cacheDir = join8(sourceRoot, ".ai", "registry-cache", name);
    if (existsSync8(cacheDir)) {
      const catalogPath = join8(cacheDir, "catalog.yaml");
      if (existsSync8(catalogPath)) {
        try {
          const parsed = parseYaml(readFileSync9(catalogPath, "utf8"));
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
function handleRegistryCacheClear(options) {
  if (!options.approved) {
    console.error("\x1B[31mError: Cache cannot be cleared without explicit approval. Pass the --approved flag.\x1B[0m");
    const cacheRoot2 = join8(sourceRoot, ".ai", "registry-cache");
    if (existsSync8(cacheRoot2)) {
      const dirs = readdirSync(cacheRoot2).filter((d) => d !== "README.md");
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
  const entries = readdirSync(cacheRoot).filter((d) => d !== "README.md");
  let cleared = 0;
  entries.forEach((d) => {
    const dirPath = join8(cacheRoot, d);
    try {
      if (statSync(dirPath).isDirectory()) {
        const files = readdirSync(dirPath);
        files.forEach((f) => {
          const fp = join8(dirPath, f);
          if (statSync(fp).isFile()) {
            writeFileSync4(fp, "");
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
