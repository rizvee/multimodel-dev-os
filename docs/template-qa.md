# Template Quality Assurance Blueprint

To guarantee that all built-in and community templates scaffold cleanly and operate with zero syntax errors, templates must satisfy the following strict QA criteria before packaging.

---

## 1. Core QA Acceptance Checklist

All template profiles (Next.js SaaS, WordPress Site, SEO Landing Page, E-Commerce, General App) must pass these automated assertions:

### A. Initialization Check
- [ ] Running `npx multimodel-dev-os init --template <name>` scaffolds all required folders and root files cleanly.
- [ ] No empty write errors, name drifts, or file conflicts occur when executed in an empty target path.

### B. Validation & Doctor Checks
- [ ] Scaffolding outputs must return 100% successful passes when audited using the local validation linter:
  ```bash
  npx multimodel-dev-os validate
  ```
- [ ] Running the advisor must return zero warnings or compatibility alerts:
  ```bash
  npx multimodel-dev-os doctor
  ```

### C. Caveman Mode Compatibility
- [ ] The template must include functional minimal-token variants inside its `.ai/templates/` folder.
- [ ] Toggling `--caveman` writes successfully, creating compressed files without loss of structural boundaries.

### D. Adapter Installation Check
- [ ] The template must support native adapter mounts.
- [ ] Running `init --adapter cursor --adapter claude` copies the corresponding rule files and updates `.ai/config.yaml` to `true` instantly.

---

## 2. New Template Acceptance Criteria

When contributing custom team templates:
1. **Generic but Realistic:** Templates must not include personal branding, fake metrics, or unverified benchmarks.
2. **Zero Dependencies:** Templates must configure purely within the defined root and `.ai/` schema layers, introducing zero package dependencies.
3. **Structured Context:** Project briefs and model maps must align with the official protocol specifications.
