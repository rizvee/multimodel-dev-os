# Skill: Secure webhook endpoint implementation

Use this skill when implementing a secure checkout webhook listener:

1. **Verify Signatures:** Always verify the incoming payload signature using the webhook secret:
   ```javascript
   const event = stripe.webhooks.constructEvent(
       req.body,
       req.headers['stripe-signature'],
       process.env.STRIPE_WEBHOOK_SECRET
   );
   ```
2. **Replay Attack Mitigation:** Validate timestamp tolerances inside payload events.
3. **Idempotency:** Implement idempotency gates in the database so that processing the same webhook event ID twice does not duplicate order entries.
4. **Fast Response:** Return a `200 OK` status immediately before running heavy asynchronous background tasks to prevent Stripe from resending payloads.
