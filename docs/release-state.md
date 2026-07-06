# Release State

MultiModel Dev OS uses a maintainer-controlled release process. Package preparation, Git tagging, draft GitHub releases, npm publication, and mirror publication are separate states.

`npm publish` is always a manual maintainer action. A version can be prepared in the repository before it is published to npmjs. During that window the repository may already contain the version bump, release commit, annotated tag, and draft GitHub release.

The GitHub release should remain draft until npmjs confirms the version is published. The optional GitHub Packages mirror should run after npmjs publication is confirmed.

## Release States

| State | Meaning |
|:---|:---|
| Prepared | Version metadata, changelog, release notes, and package files are ready locally or in a release commit. |
| Pushed | The release preparation commit has been pushed to `main`. |
| Tagged | An annotated Git tag exists for the prepared version. |
| Draft release created | A draft GitHub release exists for the tag, but it is not public yet. |
| npmjs published | The version is visible on npmjs and `npm view multimodel-dev-os version` returns that version. |
| GitHub release published | The GitHub release is no longer draft and is marked latest when appropriate. |
| GitHub Packages mirrored | The optional `@rizvee/multimodel-dev-os` package has been published to GitHub Packages. |
| Fully released | npmjs, GitHub release, GitHub Actions, docs, and optional package mirrors have all reached the intended final state. |

## Current Status

### v4.0.0

- Fully released on npmjs.
- Public GitHub release is published.
- GitHub Packages mirror has been published.

### v4.0.1

- Prepared.
- Tagged as `v4.0.1`.
- Draft GitHub release exists.
- npmjs publish is pending.
- v4.0.1 remains pending manual npm publish from the `v4.0.1` tag only.

### main (v4.1 development lane)

- main contains the v4.1.0 release state.
- main must not be published as v4.0.1.
- v4.1.0 is published on npmjs.
- The GitHub release for v4.1.0 is public and marked latest.
- The optional GitHub Packages mirror workflow has completed; package visibility and access are controlled by GitHub Packages settings.
- v4.1.0 provides declarative Skill OS metadata, validation, documentation, and read-only inspection foundations; it does not execute automation, enforce permissions at runtime, or make advisory guardrails block live commands.

## Release Notes

- v4.0.1 remains unpublished and must only be published from the `v4.0.1` tag if Hasan ever chooses to publish it.
- v4.1.0 is fully released from `main`.

## Manual Publish Command

```bash
npm publish --access public
```

## Post-Publish Command Sequence

After Hasan publishes npmjs manually, confirm the public package before publishing the GitHub release:

```bash
npm view multimodel-dev-os version
npx -y multimodel-dev-os@latest --help
gh release edit v4.1.0 --draft=false --latest
gh workflow run publish-github-package.yml --ref main
```

The GitHub release should stay draft if npmjs still reports the previous latest version.
