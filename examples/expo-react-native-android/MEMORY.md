# Android App Architecture Memory & Constraints

## Technical Baseline
- **Build Tooling**: EAS CLI (Expo Application Services)
- **Android Target**: API level 34 (Android 14)
- **Minimum SDK**: API level 23 (Android 6.0)

## Security Guidelines
- **No Hardcoded Secrets**: All keys (API endpoints, tokens) must be injected dynamically via Expo Config `extra` parameters using `.env` files.
- **Secure Storage**: Sensitive auth tokens must be saved using `expo-secure-store`. Do NOT use standard `AsyncStorage` for passwords or tokens.

## Package Identity
- **Android Package Name**: `com.multimodel.devos` (defined in `app.json`)
