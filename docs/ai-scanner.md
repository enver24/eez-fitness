# AI meal scanner

The scanner is fully built but **switched off** until an AI key is added. While it's off, the app
shows "AI scanning isn't switched on yet" and suggests searching for foods instead.

## How it works

```
iPhone ──(photo, ~1024 px JPEG)──► analyse-meal (Supabase Edge Function) ──► Anthropic API
                                    • checks the user is signed in
                                    • checks the daily scan limit (default 10)
                                    • holds the secret API key
```

- The photo is held in memory only for the request. It isn't stored on the phone, in Supabase or by EEZ Fitness.
- The AI returns a fixed JSON shape (structured outputs), which the function checks before sending it back.
- The user always reviews and corrects the result before anything is saved.
- Failed scans and "no food found" don't count against the daily limit.

## Switching it on (costs money)

1. Create an account at https://console.anthropic.com, add prepaid credit (about US$5–10 is plenty for a
   small beta), and set a **monthly spend limit** under Settings → Limits.
2. Create an API key. **Don't paste it into chat or commit it.**
3. Store it as a Supabase secret: Supabase dashboard → your project → **Edge Functions** → **Secrets** →
   **Add new secret**, name `ANTHROPIC_API_KEY`, paste the key as the value, and save.

4. Optional settings:

   ```bash
   npx supabase secrets set DAILY_SCAN_LIMIT=10
   npx supabase secrets set AI_MODEL=claude-opus-5-5
   ```

   The default model is Claude Opus 5.5 at low effort (roughly 1–2 US cents per scan). Setting
   `AI_MODEL=claude-haiku-5-5` is much cheaper; compare the accuracy on a few of your own meals first.

No app update is needed: the next scan uses the key.

## Developer notes

- Code: `supabase/functions/analyse-meal/index.ts`; deploy with
  `npx supabase functions deploy analyse-meal --use-api`.
- Daily limits: `consume_ai_quota` / `refund_ai_quota` in `supabase/migrations/20261104050000_ai_quota.sql`,
  callable only with the service role.
- In development builds, the scan screen offers a clearly labelled sample result so the review screen can be
  tested without AI. Sample results can't be saved.
