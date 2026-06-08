# Expo React Native Android Boilerplate

This template provides a production-ready React Native boilerplate configured for Android delivery using Expo, EAS Build, secure environment profile separation, automated API retries, and unit tests.

---

## 1. Directory Structure

```
├── app.json                  # Expo application static configurations
├── eas.json                  # EAS Build pipeline profiles
├── app.config.ts             # Dynamic env profiles selector
├── jest.config.js            # Jest testing suite configuration
├── src/
│   ├── app/
│   │   └── _layout.tsx       # Root layout, NetInfo listeners, and screen boundaries
│   ├── lib/
│   │   └── secure-storage.ts # Safe wrapper for expo-secure-store (key/value device encryption)
│   └── services/
│       └── api-client.ts     # Fetch API wrapper with timeout thresholds and auto-retries
```

---

## 2. Environment Variables & App Configuration

We decouple environment configurations in [app.config.ts](file:///f:/multimodel-dev-os/examples/expo-react-native-android/app.config.ts) using `APP_ENV`.

### Supported Profiles
1. **Development (`development`)**:
   * API Url: `http://10.0.2.2:3000/api` (Localhost mapping for Android Emulator)
2. **Staging (`staging`)**:
   * API Url: `https://staging-api.multimodel.dev`
3. **Production (`production`)**:
   * API Url: `https://api.multimodel.dev`

### To launch a specific environment locally:
```bash
# Start with staging parameters
APP_ENV=staging npx expo start

# Start with production parameters
APP_ENV=production npx expo start
```

---

## 3. EAS Build Setup

We configure three build targets in [eas.json](file:///f:/multimodel-dev-os/examples/expo-react-native-android/eas.json) to separate local debugging from store delivery.

### Build Commands
```bash
# 1. Build local development client (Internal testing APK with debugging tools)
eas build --profile development --platform android

# 2. Build staging/preview release (Internal testing APK)
eas build --profile preview --platform android

# 3. Build production release (Signed Android App Bundle (.aab) ready for Google Play Store)
eas build --profile production --platform android
```

> [!CAUTION]
> **No-Secrets Policy**: Do not commit actual `owner` or `projectId` credentials into `app.json` or environment files. Fill in placeholders locally during project provisioning.

---

## 4. API Client & Secure Storage

### API Retry Loop
The [api-client.ts](file:///f:/multimodel-dev-os/examples/expo-react-native-android/src/services/api-client.ts) automatically retries requests up to 3 times on transient network failures before aborting. You can enable offline mock responses by setting:
```typescript
const USE_MOCK_DATA = true;
```

### Encrypted Key-Value Storage
Use the [secure-storage.ts](file:///f:/multimodel-dev-os/examples/expo-react-native-android/src/lib/secure-storage.ts) class to securely store credentials (like JWT tokens) on the device using keychain encryption:
```typescript
import { SecureStorage } from '../lib/secure-storage';

// Write credential
await SecureStorage.setItem('auth_token', 'JWT-TOKEN-DATA');

// Retrieve credential
const token = await SecureStorage.getItem('auth_token');
```

---

## 5. Pre-flight Play Store Release Checklist

Ensure you complete these steps before submitting `production` bundles:
1. **Change package name**: Update `"package": "com.multimodel.devos"` in `app.json` to your unique identifier.
2. **Update version parameters**: Set unique `"version"` and incremental `"versionCode"` in `app.json` for every build.
3. **Configure App Signing Keys**: Ensure your keystore is generated securely on EAS or imported safely from local credentials. Do not commit keystores to Git.
4. **Permissions Audit**: Verify that only required permissions (like `INTERNET`) are enabled in `app.json`.
5. **Run tests**:
   ```bash
   npm test
   ```
