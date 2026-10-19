import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import {
  CONSENT_VERSION,
  MIN_PASSWORD_LENGTH,
  friendlyAuthError,
  isValidEmail,
} from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

type Errors = Partial<Record<'firstName' | 'email' | 'password' | 'consent' | 'form', string>>;

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [consented, setConsented] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  async function handleSignUp() {
    const next: Errors = {};
    if (!firstName.trim()) next.firstName = 'Enter your first name.';
    if (!isValidEmail(email)) next.email = 'Enter a valid email address.';
    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (!isAdult || !consented) next.consent = 'Tick both boxes to continue.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    const now = new Date().toISOString();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // Saved with the account so we have a record of what they agreed to.
        data: {
          first_name: firstName.trim(),
          adult_confirmed_at: now,
          consent_version: CONSENT_VERSION,
          consent_given_at: now,
        },
      },
    });
    setBusy(false);

    if (error) {
      setErrors({ form: friendlyAuthError(error) });
      return;
    }
    // If email confirmation is on, there's no session yet: ask for the code.
    if (!data.session) {
      router.push({ pathname: '/verify', params: { email: email.trim() } });
    }
  }

  return (
    <Screen title="Create account" showBack>
      <TextField
        label="First name"
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Alex"
        autoComplete="given-name"
        textContentType="givenName"
        error={errors.firstName}
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        error={errors.email}
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        error={errors.password}
      />

      <Card>
        <Checkbox checked={isAdult} onChange={setIsAdult}>
          <Text variant="callout">I’m 18 or older.</Text>
        </Checkbox>
        <Checkbox checked={consented} onChange={setConsented}>
          <Text variant="callout">
            I agree that EEZ Fitness can store my health and fitness information (such as weight,
            meals and workouts) to provide the app, and that meal photos I choose to scan are sent
            to an AI service, which may be outside Australia, to estimate nutrition.
          </Text>
        </Checkbox>
        {errors.consent && (
          <Text variant="caption" color="danger">
            {errors.consent}
          </Text>
        )}
      </Card>

      <Notice>
        EEZ Fitness gives general information only. It is not medical or nutritional advice and is
        not a substitute for a qualified health professional.
      </Notice>

      {errors.form && (
        <Text variant="callout" color="danger">
          {errors.form}
        </Text>
      )}

      <View style={styles.footer}>
        <Button title={busy ? 'Creating account…' : 'Create account'} onPress={handleSignUp} disabled={busy} />
        <Button title="I already have an account" variant="secondary" size="md" onPress={() => router.replace('/sign-in')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
});
