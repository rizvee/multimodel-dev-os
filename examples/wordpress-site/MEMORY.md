# WordPress Site — Project Memory

## Architectural Decisions
- **Custom Post Types (CPT):** Registered custom post types strictly using the `init` action hook to ensure URL rewrite rules initialize cleanly.
- **WP Transients:** Cached heavy database option operations using WordPress Transients API to preserve SQL query load budgets.
