# Production Mobile Android Setup (Expo + React Native)

MultiModel Dev OS v1.2.0 adds a dedicated production-ready template for mobile Android clients under [examples/expo-react-native-android/](file:///F:/multimodel-dev-os/examples/expo-react-native-android/).

This guide describes how to customize and deploy this template using Expo EAS Build pipelines.

---

## 1. Directory Structure

The `expo-react-native-android` template structures standard mobile files:

* **`app.json`**: Global metadata mapping package namespaces (`com.multimodel.devos`), app icons, orientation constraints, and runtime permissions.
* **`eas.json`**: Configuration profile mapping for Expo EAS Build pipelines.
* **`app.config.ts`**: TypeScript config dynamically mapping environment profiles.
* **`src/services/api-client.ts`**: Standardized fetch client with connection timeout limits.
* **`src/lib/secure-storage.ts`**: Storage wrapper interface utilizing `expo-secure-store`.
* **`src/app/_layout.tsx`**: Expo Router root Layout component displaying loading/offline network states.
* **`jest.config.js`**: Jest configuration setting up native Expo mocks and test suites.

---

## 2. Environment Configurations

EAS Build uses the `APP_ENV` environment variable to direct endpoint paths:

| Profile / APP_ENV | Target API BaseUrl | Distribution Method |
| :--- | :--- | :--- |
| `development` | `http://10.0.2.2:3000/api` | Expo Go Dev Client |
| `staging` | `https://staging-api.multimodel.dev` | Internal testing APK |
| `production` | `https://api.multimodel.dev` | Play Store AAB Bundle |

---

## 3. Build & Submission Command Lines

To trigger builds on EAS servers:
```bash
# Build development client APK
eas build --profile development --platform android

# Build staging preview APK
eas build --profile preview --platform android

# Build production bundle AAB
eas build --profile production --platform android
```

---

## 4. Mobile Quality Assurance (QA) Checklist

To verify app compliance before distribution:
1. **No committed secrets**: Do not write keys inside `app.config.ts` or `app.json`. Use EAS secrets vault.
2. **Offline Handlers**: Verify layout redirects properly to connection failure views when network states drop.
3. **Session Encryptions**: Confirm tokens are stored exclusively inside `secure-storage.ts` (`expo-secure-store`), not `AsyncStorage`.

---

## 5. Android & Expo Template FAQ

### Q: Why does the API call fail in the Android Emulator when using localhost?
In Android emulators, `localhost` or `127.0.0.1` refers to the emulator's loopback interface itself, not your host computer. The host computer's loopback interface is mapped to the special IP address `10.0.2.2`. The `api-client` automatically resolves this default when `APP_ENV` is set to `development`.

### Q: How do I handle EAS credentials errors during eas build?
EAS credentials errors usually occur when the `projectId` or `owner` in `app.config.ts` does not match your Expo Developer account. To resolve this:
1. Log in to your Expo account via command line: `npx eas login`.
2. Configure your own Expo username in `app.config.ts` under `owner`.
3. Generate a project ID on your Expo dashboard and update the `projectId` placeholder in `app.config.ts`.

### Q: How do I test the API client's retry mechanism locally?
You can toggle offline mock responses by setting `useMockData: true` inside [api-client.ts](file:///f:/multimodel-dev-os/examples/expo-react-native-android/src/services/api-client.ts) constructor, or you can temporarily disconnect your development server to watch the console log warning attempts:
`[ApiClient] Attempt 1 failed: fetch failed. Retrying...`
The client will automatically retry up to 3 times before returning a `Max retries exceeded` error.

