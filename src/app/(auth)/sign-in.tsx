import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { friendlyAuthError, isValidEmail } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    if (!isValidEmail(email) || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(undefined);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    // On success the app opens automatically.
    if (signInError) {
      setError(friendlyAuthError(signInError));
      setNeedsConfirmation(signInError.code === 'email_not_confirmed');
    }
  }

  return (
    <Screen title="Log in" showBack>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={handleSignIn}
      />
      <Pressable
        onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}
        accessibilityRole="button"
        style={styles.forgot}>
        <Text variant="callout" color="accent" style={styles.link}>
          Forgot password?
        </Text>
      </Pressable>

      {error && (
        <Text variant="callout" color="danger">
          {error}
        </Text>
      )}

      <View style={styles.footer}>
        <Button title={busy ? 'Logging in…' : 'Log in'} onPress={handleSignIn} disabled={busy} />
        {needsConfirmation && (
          <Button
            title="Enter confirmation code"
            variant="secondary"
            size="md"
            onPress={() => router.push({ pathname: '/verify', params: { email: email.trim() } })}
          />
        )}
        <Button title="Create an account" variant="secondary" size="md" onPress={() => router.replace('/sign-up')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  forgot: {
    alignSelf: 'flex-end',
  },
  link: {
    fontWeight: '700',
  },
  footer: {
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
});
