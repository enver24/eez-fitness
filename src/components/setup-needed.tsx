import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { GlowBackground } from '@/components/ui/glow-background';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';

/** Shown to developers when the Supabase settings in .env are missing. */
export function SetupNeeded() {
  return (
    <View style={styles.root}>
      <GlowBackground />
      <SafeAreaView style={styles.center}>
        <Card>
          <Text variant="heading">Setup needed</Text>
          <Text variant="callout" color="textSecondary">
            Add your Supabase Project URL and publishable key to the .env file, then restart the
            app server.
          </Text>
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
