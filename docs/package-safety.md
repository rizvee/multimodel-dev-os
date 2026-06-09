# Package Safety and Security Hygiene

This document defines strict safety guidelines for the MultiModel Dev OS workspace.

## Excluded Items List

To prevent security compromises, credential exposure, or prompt bloating, the following files must **never** be included in git pushes or packaged in NPM releases:

1. **Local Credentials & API Keys:**
   * `.npmrc` (specifically containing authentication tokens)
   * `.env` / `.env.local`
2. **Build and Cache Artifacts:**
   * `node_modules/`
   * `dist/` / `build/`
   * `docs/.vitepress/dist/`
   * `docs/.vitepress/cache/`
3. **Mobile & Android Signing Artifacts:**
   * `*.keystore` / `*.jks` files
   * `google-services.json`
   * `GoogleService-Info.plist`
   * Signing configuration credentials

## Enforcement

The project release audit scripts strictly enforce these checks:
```bash
npm run verify
```
Any violation will cause verification and build pipelines to fail immediately.
