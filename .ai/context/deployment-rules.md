# Deployment Rules & Procedures

> Standard parameters for continuous delivery, deployment gating, production environments, and rollbacks.

## Environments
- Staging URL: `null`
- Production URL: `null`

## Build Gating Checks
- All unit tests must pass
- Code build must succeed in production bundle mode
- Lint checks must return 0 errors

## Automated Rollback Criteria
- `null`
