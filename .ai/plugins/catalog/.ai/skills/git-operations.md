# Git Operations Skill

This skill guides the AI agent when managing Git repositories and releasing versions.

## Guidelines

1. **Commit Messages:**
   - Adhere to Conventional Commits:
     - `feat: ...` for new features
     - `fix: ...` for bug fixes
     - `docs: ...` for documentation updates
     - `chore: ...` for builds, versions, etc.
   - Keep the summary line under 50 characters.

2. **Branch Management:**
   - Ensure you are working on the target branch (e.g. `main` or `develop`).
   - Check working tree cleanliness before tagging or pushing.

3. **Releasing:**
   - Verify version alignment in package config, scripts, and logs before releasing.
   - Tag releases with annotated git tags: `git tag -a vX.Y.Z -m "message"`.
