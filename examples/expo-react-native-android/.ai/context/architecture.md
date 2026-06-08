# Mobile App Architecture Map

This document establishes key folder boundaries and separation of concerns.

## Layout Folder Structure

```
mobile/
  app/                      # Expo Router screens & layouts
  components/               # Reusable UI theme primitives
  services/                 # API Clients, storage abstractions
  hooks/                    # Custom custom hook libraries
  tests/                    # Jest testing configurations
```

## Core Foundations
1. **API Communications**: Handled exclusively under `/services/api-client.ts`.
2. **Device State**: Sensitive keys kept out of Async Storage, saved in `expo-secure-store`.
