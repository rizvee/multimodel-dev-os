# Mobile Staging Operations & Build Runbook

This document details common development, testing, and release build workflows.

---

## 1. Local Testing & Execution

Start local bundler:
```bash
npm run start
```
Run Jest unit tests:
```bash
npm run test
```

---

## 2. Staging / Preview Builds

Build staging APK locally or remotely using EAS CLI:
```bash
# Preview build for internal testing (requires EAS account configured)
npx eas build --platform android --profile preview
```

---

## 3. Production Play Store release

Build production Play Store package (AAB):
```bash
npx eas build --platform android --profile production
```
 Ensure that your Google Play Console credentials and key keystores are linked securely inside the EAS dashboard.
