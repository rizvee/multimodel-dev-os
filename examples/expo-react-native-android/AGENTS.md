# MultiModel Dev OS - Android App Agents Specification

This document defines agent roles and boundaries for the Expo React Native Android application.

## Development Stack Guidelines

- **Framework**: Expo + React Native + TypeScript
- **State Management**: Zustand / React Context
- **Navigation**: Expo Router (File-based)
- **UI System**: Vanilla React Native + Tailwind CSS (NativeWind v4)

## CLI Executables Matrix

| Command | Action | Agent Role |
| :--- | :--- | :--- |
| `npm run lint` | Code style audit | Coder / Reviewer |
| `npm run test` | Jest test suite execution | QA Tester |
| `npx expo start` | Local development server | Coder |
| `npx eas build --platform android --profile preview` | Build staging APK bundle | DevOps |
| `npx eas build --platform android --profile production` | Build Play Store AAB release | DevOps |
