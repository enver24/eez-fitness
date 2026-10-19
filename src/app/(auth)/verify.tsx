import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { friendlyAuthError } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

/** Enter the code from the confirmation email to finish signing up. */
export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function handleVerify() {
    if (!/^\d{6,8}$/.test(code.trim())) {
      setError('Enter the code from the email.');
      return;
    }
    setBusy(true);
    setError(undefined);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    });
    setBusy(false);
    // On success the user is signed in and the app opens automatically.
    if (verifyError) setError(friendlyAuthError(verifyError));
  }

  async function handleResend() {
    setError(undefined);
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
    if (resendError) setError(friendlyAuthError(resendError));
    else setInfo('New code sent. Check your inbox.');
  }

  return (
    <Screen title="Check your email" showBack>
      <Text variant="body" color="textSecondary">
        We sent a code to <Text variant="bodyStrong">{email}</Text>. Enter it below to confirm
        your account. Check your junk folder if it hasn’t arrived.
      </Text>
      <TextField
        label="Code"
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={8}
        error={error}
      />
      {info && (
        <Text variant="callout" color="accent">
          {info}
        </Text>
      )}
      <Button title={busy ? 'Checking…' : 'Confirm'} onPress={handleVerify} disabled={busy} />
      <Button title="Send a new code" variant="secondary" size="md" onPress={handleResend} />
    </Screen>
  );
}
