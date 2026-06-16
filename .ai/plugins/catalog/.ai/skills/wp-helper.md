# WordPress Theme & Plugin Helper Skill

This skill guides the AI agent when generating WordPress themes and plugins PHP code.

## Guidelines

1. **Coding Standards:**
   - Adhere to the official WordPress PHP Coding Standards.
   - Prefix all custom function names, classes, and globals with a unique slug to prevent namespace collisions.
2. **Security & Validation:**
   - Enforce escaping on all outputs (e.g. using `esc_html()`, `esc_attr()`, `esc_url()`).
   - Validate and sanitize input data using `sanitize_text_field()`, `absint()`, etc.
   - Implement nonce checks on all form submissions and AJAX requests using `wp_verify_nonce()`.
