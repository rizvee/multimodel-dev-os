# Contributing to MultiModel Dev OS

Thank you for your interest in contributing to MultiModel Dev OS! We are committed to making this project developer-friendly, robust, and highly collaborative.

---

## Contributing Principles & Stable Protocol Rules

MultiModel Dev OS `v1.0.0` officially freezes the Layer 1 core root contracts (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`) and standard scaffolding subdirectories under `.ai/`.

> [!WARNING]
> **Strict Protocol Stability**: Any changes that alter the naming of the four root contracts or break standard subdirectory structures are **prohibited** as they represent breaking changes to the core protocol specification. Please ensure all proposed changes are backward-compatible.

---

## How to Contribute

### 1. Reporting Bugs
- Audited issues can be filed directly under [GitHub Issues](https://github.com/rizvee/multimodel-dev-os/issues).
- Before creating a bug report, run `node bin/multimodel-dev-os.js doctor` to inspect local environments for workspace context bloats or misalignments.
- Include OS version, active IDE adapter, and detailed steps to reproduce.

### 2. Requesting Templates
We welcome contributions of pre-filled real-world template blueprints!
- Template blueprints belong under `.ai/templates/` and as examples in the `examples/` directory.
- Check template structure compliance using the templates schemas: `.ai/schema/template.schema.json`.

### 3. Proposing Adapters
New adapters (e.g., Windsurf, Continue, Aider) make the Dev OS ecosystem richer:
1. Create a dedicated directory under `adapters/{tool-name}/`.
2. Add the tool-native instruction files referencing `/AGENTS.md` and `/MEMORY.md`.
3. Add a clear, step-by-step `setup.md` installation guide.
4. Update the compatibility tables in the `README.md` and `docs/compatibility.md`.

---

## Local Verification Testing

Before submitting a Pull Request, you **must** run the local cross-platform verification suite:

```bash
# Install development dependencies
npm install

# Run the strict release verifier suite (asserts file structures, schema mappings, and version matching)
npm run verify

# Verify local VitePress docs build without warning loops
npm run docs:build
```

All Pull Requests must pass the automated GitHub Action verifications before they can be merged.

---

## Code of Conduct

Please review and adhere to the guidelines set out in our [Code of Conduct](CODE_OF_CONDUCT.md) to keep this community open and inclusive.

---

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

