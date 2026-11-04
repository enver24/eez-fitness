# AI body previews

An optional feature in Progress → Goal visualiser. A user picks one of their own progress photos and an
image AI edits it to show roughly how they might look at their goal weight. It's **switched off** until an
image-AI key is added.

## Safeguards
- Needs progress photos turned on **and** a separate AI-preview consent (`profiles.body_visual_consent_at`).
- Only the user's own photos can be used; the `body-visual` Edge Function checks ownership.
- The prompt asks for the same person, pose, clothing and background, with modest, realistic changes only.
- Daily limit (default 3) via `consume_ai_quota('body_visual')`; failures are refunded.
- Results are stored privately in the user's photo folder and expire after 30 days unless kept. Expired
  previews are deleted the next time the user makes one.
- Clear "AI guess, not a prediction" wording everywhere; "Turn off AI previews" deletes them all.

## Switching it on (costs money)
1. Create an OpenAI Platform account at https://platform.openai.com, add prepaid credit (US$5–10) and set a
   **monthly budget limit**. Check their current usage policies allow editing photos of real people.
2. Create an API key. **Don't paste it into chat or commit it.**
3. Store it as a Supabase secret: Supabase dashboard → your project → **Edge Functions** → **Secrets** →
   **Add new secret**, name `OPENAI_API_KEY`, paste the key as the value, and save.

4. Optional: `npx supabase secrets set DAILY_VISUAL_LIMIT=3 IMAGE_MODEL=gpt-image-1.5`
5. Test with one of your own photos. If the service declines photos or the request format has changed,
   check the Edge Function logs in the Supabase dashboard (Edge Functions → body-visual → Logs).

Costs are roughly US$0.05–0.20 per preview, depending on the model and quality.
