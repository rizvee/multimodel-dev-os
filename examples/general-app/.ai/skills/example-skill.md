# Skill: Generic backend instructions and coding standards

Use this skill when developing standard backend API endpoints or refactoring general application logic:

1. **State Isolation:** Ensure clean separation of routing, middleware, controllers, and services.
2. **Parameters validation:** Validate all HTTP incoming payloads (body, query, headers) using validator middleware.
3. **Connection safety:** Ensure database connections are released back to pools even on errors.
4. **Environment Isolation:** Never hardcode credentials. Retrieve secrets strictly from `process.env`.
