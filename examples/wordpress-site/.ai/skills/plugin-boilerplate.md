# Skill: WordPress secure plugin structure

Use this skill when scaffolding a secure WordPress plugin or PHP module:

1. **Direct Access Protection:** Ensure every PHP file starts with direct execution guards:
   ```php
   if ( ! defined( 'ABSPATH' ) ) {
       exit; // Exit if accessed directly.
   }
   ```
2. **Class Namespacing:** Namespace your classes to prevent namespace collisions (e.g. `namespace WP_Custom_Plugin;`).
3. **Database Escaping:** Use prepared statements for direct database calls:
   ```php
   global $wpdb;
   $query = $wpdb->prepare(
       "SELECT * FROM {$wpdb->prefix}custom_table WHERE id = %d",
       $item_id
   );
   $results = $wpdb->get_results( $query );
   ```
4. **Hook Verification:** Register all activations cleanly inside a central bootstrap hook.
