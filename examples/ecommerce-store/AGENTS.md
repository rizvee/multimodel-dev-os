# E-commerce Store — Agent Instructions

project: ecommerce-headless-store
stack: MedusaJS, Stripe API, Node, React, Redis, Postgres
description: Headless e-commerce system with Stripe checkout loops and cart state validations.

## Build Commands
```
dev:   npm run dev
build: npm run build
test:  npm run test
lint:  npm run lint
```

## Coding Conventions
- **Language:** ES6 TypeScript/JavaScript.
- **PCI-Compliance:** Never log or save raw credit card details on server logs; delegate billing operations strictly to Stripe.
- **Cart Validation:** Validate all quantities and product variant IDs against the backend database before creating checkout sessions.
