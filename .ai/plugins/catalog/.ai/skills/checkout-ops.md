# E-Commerce Webhook & Gateway Audits Skill

This skill guides the AI agent when managing checkout configurations and payment webhook processing code.

## Guidelines

1. **Webhook Security:**
   - Always verify signature payloads using the provider's SDK (e.g. `stripe.webhooks.constructEvent`).
   - Throw explicit, logged errors on signature validation failures to assist debugging.
2. **Transaction Integrity:**
   - Double-check payment amounts and currency codes against internal database models before marking orders paid.
   - Use transactional writes when updating orders and inventory counts.
