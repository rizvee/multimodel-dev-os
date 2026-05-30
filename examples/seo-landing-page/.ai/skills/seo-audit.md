# Skill: Google Lighthouse optimization

Use this skill when auditing and optimizing a static landing page:

1. **Meta Descriptions Verification:** Every page layout must contain:
   ```html
   <meta name="description" content="Precise SEO description (under 160 characters)" />
   ```
2. **Alt Tags Check:** Ensure every `<img>` tag has a valid, descriptively non-empty `alt` string.
3. **Structured Schemas:** Embed JSON-LD maps:
   ```html
   <script type="application/ld+json">
   {
     "@context": "https://schema.org",
     "@type": "WebSite",
     "name": "Custom Profile",
     "url": "https://example.com"
   }
   </script>
   ```
4. **Compression Audits:** Enforce `.webp` or `.avif` extensions for large backgrounds instead of uncompressed PNGs.
