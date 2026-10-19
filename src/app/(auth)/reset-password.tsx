import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { MIN_PASSWORD_LENGTH, friendlyAuthError } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

/** Step 2 of resetting a password: enter the emailed code and a new password. */
export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function handleReset() {
    if (!/^\d{6,8}$/.test(code.trim())) {
      setError('Enter the code from the email.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters for your new password.`);
      return;
    }
    setBusy(true);
    setError(undefined);

    // The code proves the user owns the email and signs them in...
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'recovery',
    });
    if (verifyError) {
      setBusy(false);
      setError(friendlyAuthError(verifyError));
      return;
    }
    // ...then we set their new password. The app opens automatically.
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) setError(friendlyAuthError(updateError));
  }

  return (
    <Screen title="New password" showBack>
      <Text variant="body" color="textSecondary">
        We sent a code to <Text variant="bodyStrong">{email}</Text>. Enter it with your new
        password.
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
      />
      <TextField
        label="New password"
        value={password}
        onChangeText={setPassword}
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      {error && (
        <Text variant="callout" color="danger">
          {error}
        </Text>
      )}
      <Button title={busy ? 'Saving…' : 'Save new password'} onPress={handleReset} disabled={busy} />
    </Screen>
  );
}
