# MultiModel Dev OS Testing Suite

This directory contains the testing manuals, schemas, and smoke routines to protect the code quality of `multimodel-dev-os`.

---

## 1. Testing Strategy

We enforce a multi-tiered validation approach to protect release packaging:

```
┌────────────────────────────────────────────────────────┐
│ Tier 1: Structural Verification (scripts/verify.js)     │
│ Enforces 100+ files and contract schemas checkouts     │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Tier 2: CLI Smoke Checks (bin/multimodel-dev-os.js)     │
│ Validates command signature help and version trackers  │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Tier 3: Template QA checks                             │
│ Scaffolds tech templates to confirm zero-warnings runs │
└────────────────────────────────────────────────────────┘
```

---

## 2. Running the Linter Verification

Always execute the strict linter before committing or tagging:
```bash
npm run verify
```

This dynamic zero-dependency Node.js pipeline audits files structures, config directories, schemas, and package dry-run tarball footprint constraints.
