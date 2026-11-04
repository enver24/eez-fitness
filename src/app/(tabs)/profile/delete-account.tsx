import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { deleteAllPhotoFiles } from '@/lib/progress-photos';
import { supabase } from '@/lib/supabase';

const CONFIRM_WORD = 'DELETE';

/** Permanently deletes the signed-in user's account and all their data. */
export default function DeleteAccountScreen() {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const confirmed = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  async function handleDelete() {
    setBusy(true);
    setError(undefined);
    // Photo files aren't removed by deleting the account, so delete them first.
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    try {
      if (userId) await deleteAllPhotoFiles(userId);
    } catch {
      setBusy(false);
      setError('Couldn’t delete your photos. Check your connection and try again.');
      return;
    }
    // Runs in the database and can only delete the caller's own account.
    const { error: deleteError } = await supabase.rpc('delete_my_account');
    if (deleteError) {
      setBusy(false);
      setError('Couldn’t delete your account. Check your connection and try again.');
      return;
    }
    // Clear the login stored on this phone. The welcome screen opens automatically.
    await supabase.auth.signOut({ scope: 'local' });
  }

  return (
    <Screen title="Delete account" showBack>
      <Card>
        <Text variant="bodyStrong" color="danger">
          This can’t be undone.
        </Text>
        <Text variant="callout" color="textSecondary">
          Your account and everything in it will be permanently deleted: your profile and goals,
          food diary, weight history, workouts and progress photos.
        </Text>
      </Card>
      <TextField
        label={`Type ${CONFIRM_WORD} to confirm`}
        value={confirmText}
        onChangeText={setConfirmText}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder={CONFIRM_WORD}
      />
      {error && (
        <Text variant="callout" color="danger">
          {error}
        </Text>
      )}
      <Button
        title={busy ? 'Deleting…' : 'Delete my account'}
        variant="destructive"
        icon="trash"
        onPress={handleDelete}
        disabled={!confirmed || busy}
      />
    </Screen>
  );
}
