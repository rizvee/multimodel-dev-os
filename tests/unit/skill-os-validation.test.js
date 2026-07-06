import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { validateSkillOs } from '../../src/skill-os/validation.js';

const tempDir = join(process.cwd(), 'temp-skill-os-validation-test');

function writeFile(relPath, content) {
  const fullPath = join(tempDir, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf8');
}

function writeJsonSchemas() {
  for (const relPath of [
    '.ai/schema/skill.schema.json',
    '.ai/schema/prompt-template.schema.json',
    '.ai/schema/tool-permission.schema.json',
    '.ai/schema/agent-cluster.schema.json',
  ]) {
    writeFile(relPath, '{"type":"object"}\n');
  }
}

function writeReferencedFiles() {
  for (const relPath of [
    '.ai/skills/release.md',
    '.ai/checks/pre.md',
    '.ai/context/project.md',
    'README.md',
  ]) {
    writeFile(relPath, '# fixture\n');
  }
}

function validSkillsYaml(overrides = '') {
  return `skills:
  release-governance:
    id: release-governance
    name: "Release Governance"
    version: "1.0.0"
    description: "Release checks"
    category: release-governance
    risk_level: high
    permissions:
      - read-only
      - draft-only
    skill_file: ".ai/skills/release.md"
    required_context:
      - ".ai/context/project.md"
    checks:
      - ".ai/checks/pre.md"
    provided_outputs:
      - "report"
${overrides}`;
}

function validPromptTemplatesYaml(overrides = '') {
  return `prompt_templates:
  release-audit:
    id: release-audit
    name: "Release Audit"
    version: "1.0.0"
    description: "Release audit prompt"
    race_plus:
      role: "Release engineer"
      action: "Audit release state"
      context:
        required_files:
          - "README.md"
      expectation: "Report blockers"
      constraints:
        - "Do not publish"
      output_format: "markdown"
      verification:
        - "npm run verify"
      next_action: "Wait for approval"
${overrides}`;
}

function validToolPermissionsYaml(overrides = '') {
  return `tool_permissions:
  filesystem-read:
    tool_id: filesystem-read
    display_name: "Filesystem Read"
    class: read-only
    allowed_operations:
      - "read files"
    blocked_operations:
      - "write files"
    requires_confirmation: false
    requires_clean_worktree: false
    requires_validation: false
    audit_log: false
  filesystem-write:
    tool_id: filesystem-write
    display_name: "Filesystem Write"
    class: write-with-confirmation
    allowed_operations:
      - "write files"
    blocked_operations:
      - "write secrets"
    requires_confirmation: true
    requires_clean_worktree: false
    requires_validation: true
    audit_log: true
  npm-publish:
    tool_id: npm-publish
    display_name: "npm Publish"
    class: restricted-admin
    allowed_operations:
      - "publish approved package"
    blocked_operations:
      - "publish without approval"
    requires_confirmation: true
    requires_clean_worktree: true
    requires_validation: true
    audit_log: true
${overrides}`;
}

function validAgentClustersYaml(overrides = '') {
  return `agent_clusters:
  core-technical:
    id: core-technical
    name: "Core Technical"
    description: "Technical work"
    scope:
      - "code"
    typical_skills:
      - release-governance
    allowed_tool_classes:
      - read-only
      - draft-only
    required_context:
      - "README.md"
    outputs:
      - "report"
    validation_expectations:
      - "Run checks"
${overrides}`;
}

function writeValidProject() {
  writeJsonSchemas();
  writeReferencedFiles();
  writeFile('.ai/registries/skills.yaml', validSkillsYaml());
  writeFile('.ai/registries/prompt-templates.yaml', validPromptTemplatesYaml());
  writeFile('.ai/registries/tool-permissions.yaml', validToolPermissionsYaml());
  writeFile('.ai/registries/agent-clusters.yaml', validAgentClustersYaml());
}

describe('Skill OS validation', () => {
  beforeEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });
    writeValidProject();
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('passes for the bundled Skill OS registries', () => {
    const result = validateSkillOs(process.cwd());
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.summary.skills).toBeGreaterThan(0);
    expect(result.summary.promptTemplates).toBeGreaterThan(0);
    expect(result.summary.toolPermissions).toBeGreaterThan(0);
    expect(result.summary.agentClusters).toBeGreaterThan(0);
  });

  it('fails when a required skill field is missing', () => {
    writeFile('.ai/registries/skills.yaml', validSkillsYaml().replace('    name: "Release Governance"\n', ''));
    const result = validateSkillOs(tempDir);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("skill 'release-governance' missing required field: name");
  });

  it('fails invalid slug IDs', () => {
    writeFile('.ai/registries/skills.yaml', validSkillsYaml().replace('id: release-governance', 'id: Release Governance'));
    const result = validateSkillOs(tempDir);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("skill 'release-governance' has invalid slug id: Release Governance");
  });

  it('fails invalid risk levels', () => {
    writeFile('.ai/registries/skills.yaml', validSkillsYaml().replace('risk_level: high', 'risk_level: severe'));
    const result = validateSkillOs(tempDir);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("skill 'release-governance' has invalid risk_level: severe");
  });

  it('fails invalid permission classes', () => {
    writeFile('.ai/registries/skills.yaml', validSkillsYaml().replace('      - draft-only', '      - root-access'));
    const result = validateSkillOs(tempDir);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("skill 'release-governance' permission does not map to known tool permission class: root-access");
  });

  it('fails path traversal references', () => {
    writeFile('.ai/registries/skills.yaml', validSkillsYaml().replace('skill_file: ".ai/skills/release.md"', 'skill_file: "../release.md"'));
    const result = validateSkillOs(tempDir);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("skill 'release-governance' skill_file must be a safe relative path: ../release.md");
  });

  it('fails missing referenced skill files', () => {
    writeFile('.ai/registries/skills.yaml', validSkillsYaml().replace('skill_file: ".ai/skills/release.md"', 'skill_file: ".ai/skills/missing.md"'));
    const result = validateSkillOs(tempDir);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("skill 'release-governance' skill_file references missing file or directory: .ai/skills/missing.md");
  });

  it('fails prompt templates missing RACE+ fields', () => {
    writeFile('.ai/registries/prompt-templates.yaml', validPromptTemplatesYaml().replace('      next_action: "Wait for approval"\n', ''));
    const result = validateSkillOs(tempDir);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("prompt template 'release-audit' missing RACE+ field: next_action");
  });

  it('fails restricted-admin tools without confirmation', () => {
    writeFile('.ai/registries/tool-permissions.yaml', validToolPermissionsYaml().replace('    requires_confirmation: true\n    requires_clean_worktree: true', '    requires_confirmation: false\n    requires_clean_worktree: true'));
    const result = validateSkillOs(tempDir);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("tool permission 'npm-publish' must require confirmation for class restricted-admin");
  });

  it('fails dangerous operations marked read-only', () => {
    writeFile('.ai/registries/tool-permissions.yaml', validToolPermissionsYaml(`
  unsafe-read:
    tool_id: unsafe-read
    display_name: "Unsafe Read"
    class: read-only
    allowed_operations:
      - "publish package"
    blocked_operations:
      - "none"
    requires_confirmation: false
    requires_clean_worktree: false
    requires_validation: false
    audit_log: false
`));
    const result = validateSkillOs(tempDir);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("tool permission 'unsafe-read' marks dangerous operations as read-only");
  });

  it('fails agent clusters with invalid tool classes', () => {
    writeFile('.ai/registries/agent-clusters.yaml', validAgentClustersYaml().replace('      - draft-only', '      - unrestricted-root'));
    const result = validateSkillOs(tempDir);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("agent cluster 'core-technical' references invalid tool class: unrestricted-root");
  });
});
