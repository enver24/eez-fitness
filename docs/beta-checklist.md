# Before the private beta

What's left before inviting testers, roughly in order. Items marked 💳 cost money.

## Accounts and email (free, needs you)
- [ ] **Email provider for codes.** Sign up for a free SMTP service (e.g. Brevo), add its SMTP details in
      Supabase → Authentication → Emails → SMTP Settings, then edit the *Confirm signup* and *Reset password*
      templates to show `{{ .Token }}`.
- [ ] **Turn email confirmation back on** (Supabase → Authentication → Sign In / Providers → Confirm email).
      The app already has the code-entry screens.
- [ ] **Privacy contact email.** Set `EXPO_PUBLIC_PRIVACY_CONTACT_EMAIL` in `.env`.

## Production backend (free)
- [ ] **Create a separate Supabase project for testers in the Sydney region** (the development project is in
      Singapore). Link it and run `npx supabase db push --remote` and
      `npx supabase functions deploy analyse-meal --use-api`, then point the beta build at it.
- [ ] Update the privacy policy's storage location to Sydney once testers use that project.

## Optional
- [ ] 💳 **AI meal scanner:** add an Anthropic API key (see `docs/ai-scanner.md`).
- [ ] 💳 **AI body previews:** add an OpenAI API key (see `docs/ai-body-preview.md`).

## Release (💳 Apple Developer Program, about A$149 a year)
- [ ] App icon and splash screen in EEZ Fitness colours.
- [ ] Join the Apple Developer Program.
- [ ] Build with EAS (`npx eas-cli@latest build -p ios`) and submit to TestFlight.
- [ ] Host the privacy policy at a public URL (App Store Connect requires one).
- [ ] Create a TestFlight external testing group and share the public link.

## Before every beta build
- [ ] `npm run typecheck && npx expo lint && npm test`
- [ ] `npm run test:privacy` (against the development project)
