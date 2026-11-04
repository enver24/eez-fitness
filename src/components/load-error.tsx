import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GlowBackground } from '@/components/ui/glow-background';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

/** Shown when the signed-in user's profile can't be loaded. */
export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.root}>
      <GlowBackground />
      <SafeAreaView style={styles.center}>
        <Card>
          <Text variant="heading">Couldn’t load your profile</Text>
          <Text variant="callout" color="textSecondary">
            Check your internet connection and try again.
          </Text>
          <Button title="Try again" onPress={onRetry} />
          <Button title="Sign out" variant="secondary" size="md" onPress={() => supabase.auth.signOut()} />
        </Card>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing[4],
  },
});
