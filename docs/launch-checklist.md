# Public Launch Checklist

A complete list of operational and promotional gates to successfully deploy and publicize `multimodel-dev-os` to the global developer ecosystem.

---

## 1. GitHub Launch Checklist

Ensure the repository is clean, communicative, and ready for public forks/stars:
- [ ] **Community Standards Audit:** Confirm root files `LICENSE` (MIT), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `SECURITY.md` are present and correctly formatted.
- [ ] **GitHub Workflows Pass:** Validate that the `.github/workflows/verify.yml` actions run successfully on push events.
- [ ] **Community Engagement CTAs:** Confirm standard issue templates exist inside `.github/ISSUE_TEMPLATE/` to guide bug reporting and feature additions.

---

## 2. NPM Verification Checklist

Assure packaging hygiene before executing npm publishes:
- [ ] **Technical Structure Verify:** Run the cross-platform structural verifier:
  ```bash
  npm run verify
  ```
  Ensure all 102 target assertions return successful passes.
- [ ] **Dynamic Manifest Sync:** Assert that the dynamic version in `package.json` matches exactly across the CHANGELOG.md and installer scripts.
- [ ] **NPM Pack Audit:** Run the packaging dry-run:
  ```bash
  npm pack --dry-run
  ```
  Confirm that the output tarball size is under `~65kB`, the unpacked file size is under `~200kB`, and compiled docs caches (`docs/.vitepress/dist`, `docs/.vitepress/cache`) are completely ignored.

---

## 3. Docs Site Checklist

Verify documentation site integrity before public indexing:
- [ ] **VitePress Compile:** Run `npm run docs:build` and confirm that Rollup completes client and server bundle compilation successfully.
- [ ] **Asset Resolution:** Verify that all SVGs (terminal-demo, social-preview, architecture-preview) compile seamlessly and display correctly inside docs pages.
- [ ] **Pages Navigation:** Click all navigation sidebars, navbar tabs, and footer links under the hosted root `/multimodel-dev-os/` path to confirm zero broken links.

---

## 4. Social Launch Checklist

Prepare the phase-by-phase promotional campaigns to maximize engagement:
- [ ] **Product Hunt Staging:** Prepare high-end media cards (`social-preview.svg`) and draft the first-comment outline explaining our zero-dependency context layer.
- [ ] **Hacker News Submission:** Format the direct developer pitch under a clean Show HN title: `Show HN: MultiModel Dev OS — A portable .editorconfig for your AI coding agents`.
- [ ] **Reddit Outreach:** Select relevant communities (`/r/webdev`, `/r/node`, `/r/LocalLLaMA`) and schedule clear announcements addressing instruction drift.
