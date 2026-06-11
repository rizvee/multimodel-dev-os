# Template Recommendation Engine

The recommendation engine matches existing codebases to the best-fit template profile.

## Heuristics & Confidence Scores

The engine assigns weights to file signatures and package dependencies:

* **Next.js SaaS (`nextjs-saas`)**: Matches if `next.config.js` or `next.config.ts` is present (Weight: +0.6) or `package.json` contains `next` dependency (Weight: +0.4).
* **Android Expo Mobile (`expo-react-native-android`)**: Matches if `app.json` or `eas.json` is present (Weight: +0.8).
* **WordPress Theme/Plugin (`wordpress-theme-plugin`)**: Matches if `wp-content` directory or header-decorated PHP style files are found (Weight: +0.8).
* **E-Commerce Store (`ecommerce-store`)**: Matches if Stripe, Shopify, or checkout-related dependencies are present (Weight: +0.4).
* **SEO Landing Page (`seo-landing-page`)**: Matches if raw HTML files + Tailwind configs exist without framework elements (Weight: +0.5).
* **General App (`general-app`)**: Serves as the fallback profile if no other template achieves a confidence score greater than 0.4.

## Command

To check template recommendations for your project:

```bash
npx multimodel-dev-os onboard recommend --target .
```
