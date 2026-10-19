import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  title: string;
  /** Small line above the title, e.g. today's date. */
  eyebrow?: string;
  /** Optional element shown to the right of the title, e.g. a button. */
  headerRight?: ReactNode;
  children: ReactNode;
};

/**
 * The standard layout for a tab screen: a large title at the top
 * and scrollable content underneath.
 */
export function Screen({ title, eyebrow, headerRight, children }: ScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            {eyebrow && (
              <Text variant="overline" color="textSecondary">
                {eyebrow}
              </Text>
            )}
            <Text variant="display" accessibilityRole="header">
              {title}
            </Text>
          </View>
          {headerRight}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[8] + BottomTabInset,
    gap: Spacing[4],
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
