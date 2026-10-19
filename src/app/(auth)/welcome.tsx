import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityRings } from '@/components/ui/activity-rings';
import { Button } from '@/components/ui/button';
import { GlowBackground } from '@/components/ui/glow-background';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** The first screen a signed-out user sees. */
export default function WelcomeScreen() {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <GlowBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <ActivityRings
            size={180}
            strokeWidth={18}
            rings={[
              { progress: 0.82, color: theme.accent },
              { progress: 0.64, color: theme.protein },
              { progress: 0.46, color: theme.carbs },
            ]}
          />
          <Text variant="hero" align="center" style={styles.brand}>
            EEZ Fitness
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            Track your food, training and progress, with AI that does the counting.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button title="Create account" onPress={() => router.push('/sign-up')} />
          <Button title="Log in" variant="secondary" onPress={() => router.push('/sign-in')} />
          <Text variant="caption" color="textTertiary" align="center">
            Private beta · For adults 18 and over
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[4],
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[4],
  },
  brand: {
    fontSize: 48,
    lineHeight: 52,
    marginTop: Spacing[4],
  },
  actions: {
    gap: Spacing[3],
  },
});
