# GitHub Packages Mirror

MultiModel Dev OS publishes primarily to the public npm registry as:

```bash
npm install -g multimodel-dev-os
```

GitHub Packages can optionally host a scoped mirror of the same release payload:

```bash
npm install -g @rizvee/multimodel-dev-os --registry=https://npm.pkg.github.com
```

## Package Identity

The root package name remains `multimodel-dev-os` for npmjs. Do not change the root `package.json` name when preparing npm releases.

GitHub Packages requires scoped npm names, so the mirror is staged as `@rizvee/multimodel-dev-os` only inside `.release/github-package/`.

## Prepare the Staged Package

```bash
node scripts/prepare-github-package.js
```

The script:

- runs an npm pack dry-run against the root package
- copies the same publishable files into `.release/github-package/`
- rewrites only the staged `package.json` name to `@rizvee/multimodel-dev-os`
- adds `publishConfig.registry: https://npm.pkg.github.com`
- leaves the root `package.json` unchanged

## Manual GitHub Packages Publish

The repository includes a manual-only workflow:

```bash
gh workflow run publish-github-package.yml
```

The workflow runs build, build-freshness, unit tests, release verification, staging, and then publishes from `.release/github-package/` using `GITHUB_TOKEN`.

GitHub Packages may default new packages to private visibility. Configure package visibility and access in GitHub after the first publish if the mirror should be public.

Do not use GitHub Packages as the primary install source unless your team intentionally wants to install from `npm.pkg.github.com`.
