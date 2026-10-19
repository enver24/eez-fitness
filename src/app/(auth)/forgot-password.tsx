import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { friendlyAuthError, isValidEmail } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

/** Step 1 of resetting a password: email the user a code. */
export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError(undefined);
    const { error: sendError } = await supabase.auth.resetPasswordForEmail(email.trim());
    setBusy(false);
    if (sendError) {
      setError(friendlyAuthError(sendError));
      return;
    }
    router.push({ pathname: '/reset-password', params: { email: email.trim() } });
  }

  return (
    <Screen title="Reset password" showBack>
      <Text variant="body" color="textSecondary">
        Enter your email and we’ll send you a code to choose a new password.
      </Text>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        error={error}
      />
      <Button title={busy ? 'Sending…' : 'Send code'} onPress={handleSend} disabled={busy} />
    </Screen>
  );
}
