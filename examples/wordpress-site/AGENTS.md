# WordPress Site — Agent Instructions

project: wordpress-custom-profile
stack: WordPress Core, Gutenberg Block Editor, PHP, custom plugins, MySQL
description: Custom theme and plugin scaffolding targeting sanitized PHP database queries.

## Build Commands
```
dev:   composer run dev
build: composer run build
test:  composer run test
lint:  composer run lint
```

## Coding Conventions
- **Language:** PHP 8.1+ and ES6 Javascript for Gutenberg custom blocks.
- **Sanitization Gates:** Enforce output escaping: `esc_attr()`, `esc_html()`, `esc_url()`, and `wp_kses()`.
- **Database Safety:** Always use `$wpdb->prepare()` for custom SQL queries to avoid SQL Injection vulnerabilities.
