# EEZ Fitness

A cross-platform fitness and nutrition-tracking app built with **TypeScript**, **React Native (Expo)** and **Supabase**.

EEZ Fitness brings food logging, workouts and progress tracking together in one app, with calories and macros shown against your personal targets. Energy is also shown in kilojoules, the unit used on Australian food labels.

> **Status:** in active development. Accounts, onboarding, personal targets and the database (with per-user privacy rules) are live; food, workout and weight tracking are being built in stages.

## Screenshots

<p>
  <img src="docs/screenshots/welcome.jpg" alt="Welcome screen" width="200">
  <img src="docs/screenshots/today.jpg" alt="Today dashboard" width="200">
  <img src="docs/screenshots/log.jpg" alt="Food log" width="200">
  <img src="docs/screenshots/workouts.jpg" alt="Workouts" width="200">
</p>
<p>
  <img src="docs/screenshots/progress.jpg" alt="Progress" width="200">
  <img src="docs/screenshots/themes.jpg" alt="Colour themes" width="200">
  <img src="docs/screenshots/light-mode.jpg" alt="Light mode" width="200">
</p>

*Food, workout and weight screens currently show placeholder data.*

## Features

### Working now
- **Screens:** home dashboard, food log, workouts, progress and profile, built with Expo Router tab navigation
- **Custom UI components:** activity rings, line charts, progress bars and glass-effect cards
- **Appearance settings:** 10 colour themes, plus light and dark modes that follow the device or a manual choice

- **Accounts:** sign up (with 18+ confirmation and recorded consent), sign in, sign out and stay signed in (Supabase Auth)
- **Onboarding:** a four-step setup for personal details, goal, activity, diet and allergies
- **Personal targets:** daily calories and macros from the Mifflin–St Jeor equation, with a safe calorie floor and a capped deficit (unit-tested with Jest)
- **Editable profile:** update details, goal, diet and allergies; targets recalculate automatically
- **Account deletion:** permanently deletes the account and all of its data
- **Friendly error handling:** Supabase error codes are translated into plain-language messages

### Coming next
- Email verification codes and password reset by code (needs a custom email provider)
- Food search and manual food entry
- AI meal scanner (log a meal from a photo)
- Weight tracking and progress charts from real data
- Workout logging and training history
- Data export

The screens currently show placeholder data (`src/data/sample.ts`), which is replaced by each user's own data as features are built.

## Security
- **Row Level Security on every table.** Database rules ensure each user can only read and change their own rows; users can't change their own subscription plan or AI usage counters. `npm run test:privacy` proves this with two temporary users.
- **Account deletion runs in the database** and can only ever delete the caller's own account.
- **Encrypted sessions on the device.** Login sessions are designed to be encrypted with AES-256 before being saved. The encryption key is stored in the iOS Keychain or Android Keystore via Expo SecureStore, following Supabase's recommended approach for Expo apps.
- **No secrets in the app.** The app only uses Supabase's public publishable key. The secret service-role key is never included in the code.
- **Environment variables are kept out of Git.** Supabase settings live in a local `.env` file, which is ignored by Git; `.env.example` shows the format.
- **Sessions refresh only while the app is open**, as Supabase recommends.

## Tech stack

| Area | Tools |
|---|---|
| Language | TypeScript |
| App framework | React Native, Expo, Expo Router |
| Backend and auth | Supabase |
| Data fetching | TanStack Query |
| Database | PostgreSQL (Supabase) with SQL migrations in `supabase/migrations` |
| Secure storage | Expo SecureStore, AsyncStorage, aes-js |
| Animation and graphics | React Native Reanimated, React Native SVG |
| Testing and code quality | Jest, ESLint, TypeScript strict type checking |

## Project structure

```
src/
  app/          Screens (file-based routing)
    (auth)/        Welcome, sign up, sign in, verify, password reset
    (onboarding)/  First-time profile setup
    (tabs)/        Home, log, workouts, progress, profile
  components/   Reusable UI components
  providers/    Auth and appearance state
  hooks/        Data hooks (profile, theme)
  lib/          Supabase client, targets calculator, profile helpers
supabase/
  migrations/   Database tables and privacy rules (SQL)
scripts/        Privacy test
  constants/    Colours and themes
  data/         Placeholder data used while features are built
```

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and add your Supabase project URL and publishable key.
3. Apply the database migrations to your Supabase project:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push --remote
   ```
4. Start the app:
   ```bash
   npx expo start
   ```
   Then open it in Expo Go, an iOS simulator, an Android emulator or the web preview.
5. Run the tests:
   ```bash
   npm test
   npm run test:privacy
   ```

## About

Built by Enver Balabanel, an ICT student at Western Sydney University, as a personal project. Developed with AI-assisted tools (Claude Code).

Copyright © 2026 Enver Balabanel. All rights reserved. See [LICENSE](LICENSE).
