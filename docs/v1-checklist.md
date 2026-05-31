# v1.0.0 Release Checklist

A strict checklist of quality gates and tests that must be run locally before the final release.

---

## 1. Quality Checklist

- [ ] All Layer 1 files exist (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`).
- [ ] Schema files (`config.schema.json`, `template.schema.json`, `adapter.schema.json`) exist under `.ai/schema/`.
- [ ] No external third-party dependencies are added to the core runtime of the CLI utility.
- [ ] Verify script runs without issues (`npm run verify`).
- [ ] Documentation builds without errors (`npm run docs:build`).
- [ ] Package whitelist filters have been reviewed to ensure `node_modules` and compiled VitePress distribution/caches are excluded.

---

## 2. CLI Execution Audits

Verify that the binary executable behaves identically across target systems:
```bash
node bin/multimodel-dev-os.js --help
node bin/multimodel-dev-os.js templates
node bin/multimodel-dev-os.js validate --target .
node bin/multimodel-dev-os.js doctor --target .
```

Verify dry-runs execute safely:
```bash
node bin/multimodel-dev-os.js init --template nextjs-saas --dry-run
```
