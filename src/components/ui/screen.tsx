import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Glass } from '@/components/ui/glass';
import { GlowBackground } from '@/components/ui/glow-background';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenProps = {
  title: string;
  /** Small line above the title, e.g. today's date. */
  eyebrow?: string;
  /** Optional element shown to the right of the title. */
  headerRight?: ReactNode;
  /** Show a back button (for screens opened from another screen). */
  showBack?: boolean;
  children: ReactNode;
};

/**
 * The standard screen layout: colour glows in the background, a big
 * slanted title, and scrollable content underneath.
 */
export function Screen({ title, eyebrow, headerRight, showBack, children }: ScreenProps) {
  return (
    <View style={styles.root}>
      <GlowBackground />
      <SafeAreaView edges={['top']} style={styles.root}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {showBack && (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
              style={styles.back}>
              <Glass radius={20} style={styles.backGlass}>
                <Icon name="chevronLeft" size={17} />
              </Glass>
            </Pressable>
          )}
          <View style={styles.header}>
            <View style={styles.headerText}>
              {eyebrow && (
                <Text variant="label" color="textSecondary">
                  {eyebrow}
                </Text>
              )}
              <Text variant="hero" accessibilityRole="header">
                {title}
              </Text>
            </View>
            {headerRight}
          </View>
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[10] + BottomTabInset,
    gap: Spacing[3],
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: Spacing[2],
  },
  backGlass: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing[3],
    marginBottom: Spacing[2],
  },
  headerText: {
    flex: 1,
    gap: Spacing[1],
  },
});
