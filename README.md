# EEZ Fitness

A cross-platform fitness and nutrition-tracking app built with **TypeScript**, **React Native (Expo)** and **Supabase**.

EEZ Fitness brings food logging, workouts and progress tracking together in one app, with calories and macros shown against your personal targets. Energy is also shown in kilojoules, the unit used on Australian food labels.

> **Status:** in active development. The account system and core screens are complete; food, workout and weight tracking are being built in stages.

## Features

### Working now
- **Accounts:** sign up with an email verification code, sign in, sign out and reset a forgotten password (Supabase Auth)
- **Friendly error handling:** Supabase error codes are translated into plain-language messages
- **Screens:** home dashboard, food log, workouts, progress and profile, built with Expo Router tab navigation
- **Custom UI components:** activity rings, line charts, progress bars and glass-effect cards
- **Appearance settings:** light and dark themes that follow the device or a manual choice

### Coming next
- Editing goals, macro targets and personal details
- Food search and manual food entry
- AI meal scanner (log a meal from a photo)
- Weight tracking and progress charts from real data
- Workout logging and training history
- Data export and account deletion

The screens currently show placeholder data (`src/data/sample.ts`), which is replaced by each user's own data as features are built.

## Security

- **Encrypted sessions on the device.** Login sessions are encrypted with AES-256 before being saved. The encryption key is stored in the iOS Keychain or Android Keystore via Expo SecureStore, following Supabase's recommended approach for Expo apps.
- **No secrets in the app.** The app only uses Supabase's public publishable key. The secret service-role key is never included in the code.
- **Environment variables are kept out of Git.** Supabase settings live in a local `.env` file, which is ignored by Git; `.env.example` shows the format.
- **Sessions refresh only while the app is open**, as Supabase recommends.

## Tech stack

| Area | Tools |
|---|---|
| Language | TypeScript |
| App framework | React Native, Expo, Expo Router |
| Backend and auth | Supabase |
| Secure storage | Expo SecureStore, AsyncStorage, aes-js |
| Animation and graphics | React Native Reanimated, React Native SVG |
| Code quality | ESLint, TypeScript strict type checking |

## Project structure

```
src/
  app/          Screens (file-based routing)
    (auth)/     Welcome, sign up, sign in, verify, password reset
    (tabs)/     Home, log, workouts, progress, profile
  components/   Reusable UI components
  providers/    Auth and appearance state
  lib/          Supabase client, error messages, nutrition helpers
  constants/    Colours and themes
  data/         Placeholder data used while features are built
```

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and add your Supabase project URL and publishable key.
3. Start the app:
   ```bash
   npx expo start
   ```
   Then open it in an iOS simulator, Android emulator, a development build or the web preview.

## About

Built by Enver Balabanel, an ICT student at Western Sydney University, as a personal project. Developed with AI-assisted tools (Claude Code).

Copyright © 2026 Enver Balabanel. All rights reserved. See [LICENSE](LICENSE).
