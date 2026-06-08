# Skill: Expo Android EAS Build Checks

## Purpose
Ensures that app.json, eas.json, and environment variables are verified before launching an EAS Build.

## Activation Trigger
Running `EAS build` or preparing staging/production releases.

## Safe Verification Check
- Assert `android.package` is set to `com.multimodel.devos` in `app.json`.
- Confirm `eas.json` contains `preview` and `production` profiles.
