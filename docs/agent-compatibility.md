# Coding Agent & IDE Adapter Compatibility

MultiModel Dev OS acts as an interoperability layer across modern developer agents, terminal assistants, and IDE extensions.

---

## Agent Registry Mapping
Compatible configurations and destination files are detailed in [.ai/adapters/registry.yaml](../.ai/adapters/registry.yaml):

```yaml
adapters:
  continue:
    name: "Continue"
    config_file: ".continue/config.json"
    type: "editor-extension"
    docs: "docs/adapters.md"
  cline:
    name: "Cline"
    config_file: ".clinerules"
    type: "coding-agent"
    docs: "docs/agent-compatibility.md"
  roo-code:
    name: "Roo Code"
    config_file: ".clinerules"
    type: "coding-agent"
    docs: "docs/agent-compatibility.md"
```

---

## Supported Agent Configurations

### 1. Continue
* **File Target**: `.continue/config.json`
* **Workflow**: Integrates custom system prompts and routing matrices into the VS Code / JetBrains sidebar panel.

### 2. Cline / Roo Code
* **File Target**: `.clinerules`
* **Workflow**: Feeds strict directory layout schemas and role assignments directly to agent context loops during project scans.

### 3. Aider
* **File Target**: `.aider.conf.yml`
* **Workflow**: Centralizes exclude filters, auto-commit actions, and CLI test verification shortcuts.

### 4. Windsurf
* **File Target**: `.windsurfrules`
* **Workflow**: Injects development constraints and build commands into the IDE context window.

### 5. OpenHands / Terminal Agents
* **File Target**: `CLAUDE.md` / `adapters/codex/AGENTS.md`
* **Workflow**: Standardize shell execution targets and error-handling steps for autonomous agents.
