# E-commerce Store — Project Memory

## Architectural Decisions
- **Stripe Session Handlers:** Utilized Stripe checkout sessions directly to minimize custom database operations for token vaults.
- **Webhook Security:** Configured secure, cryptographically validated stripe webhook receivers in order routers to mitigate replay attacks.
