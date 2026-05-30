# Runbook

> Operational procedures for deployment, rollback, and incident response.
> AI agents reference this before executing critical operations.

## Environment Setup

<!-- Steps to set up a development environment from scratch -->

```bash
# 1. Clone the repo
git clone <repo-url>
cd <project-name>

# 2. Install dependencies
null

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start development server
null
```

## Deploy

<!-- Step-by-step deployment procedure -->

| Step | Command | Notes |
|------|---------|-------|
| 1 | null | null |
| 2 | null | null |

**Deploy URL:** null
**Deploy branch:** null

## Rollback

<!-- How to revert a bad deployment -->

```bash
# Quick rollback to previous version
null
```

**Last known good commit:** null

## Incident Response

<!-- What to do when things break -->

1. **Identify:** Check error logs at `null`
2. **Communicate:** Notify team at `null`
3. **Mitigate:** Rollback if necessary (see above)
4. **Resolve:** Fix the root cause
5. **Document:** Add post-mortem to `MEMORY.md`

## Health Checks

<!-- Endpoints or commands to verify the system is working -->

| Check | Command/URL | Expected |
|-------|-------------|----------|
| null | null | null |

## Secrets & Config

<!-- Where secrets are stored (never put actual secrets here) -->

| Secret | Location | Rotation |
|--------|----------|----------|
| null | null | null |
