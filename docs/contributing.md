# Contributing to MultiModel Dev OS

Thank you for your interest in contributing! We welcome contributions of all kinds — from bug reports and documentation fixes to new adapters and feature proposals.

---

## Quick Start for Contributors

1. **Fork** the repository and clone your fork
2. Run `npm install` to install dev dependencies
3. Make your changes
4. Run `npm run verify` to ensure all 289 checks pass
5. Submit a Pull Request

---

## Ways to Contribute

### 🐛 Reporting Bugs

- File issues on [GitHub Issues](https://github.com/rizvee/multimodel-dev-os/issues)
- Before reporting, run `npx multimodel-dev-os doctor` to check for local workspace issues
- Include: OS version, active IDE adapter, Node.js version, and steps to reproduce

### 📝 Improving Documentation

Documentation improvements are highly valued! Look for:
- Typos, unclear explanations, or outdated information
- Missing examples or use cases
- Translation opportunities

### 🔌 Proposing New Adapters

New adapters (e.g., Windsurf, Continue, Aider, Roo Code) expand the ecosystem:

1. Create a directory under `adapters/{tool-name}/`
2. Add the tool-native instruction files referencing `AGENTS.md` and `MEMORY.md`
3. Add a clear `setup.md` installation guide
4. Update `.ai/adapters/registry.yaml` with the new adapter entry
5. Update the supported tools table in `README.md`

### 📦 Creating Templates

Template contributions bring real-world stack configurations to more developers:

1. Create a directory under `examples/{template-name}/`
2. Follow the structure in existing templates (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `.ai/config.yaml`, `.ai/context/`, `.ai/skills/`)
3. Validate against `.ai/schema/template.schema.json`
4. Add a test assertion in `scripts/verify.js`

### 💡 Good First Issues

New to the project? Look for issues labeled:
- **`good first issue`** — small, well-scoped tasks perfect for first-time contributors
- **`documentation`** — doc improvements that don't require deep codebase knowledge
- **`adapter-request`** — community-requested adapter integrations

Browse open issues: **[github.com/rizvee/multimodel-dev-os/issues](https://github.com/rizvee/multimodel-dev-os/issues)**
