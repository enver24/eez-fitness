import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { LineChart } from '@/components/ui/line-chart';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { withAlpha } from '@/constants/themes';
import { sampleGoalWeight, sampleLoggedDays, sampleWeights } from '@/data/sample';
import { useTheme } from '@/hooks/use-theme';
import { comingSoon } from '@/lib/coming-soon';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ProgressScreen() {
  const theme = useTheme();
  const start = sampleWeights[0];
  const current = sampleWeights[sampleWeights.length - 1];
  const change = current - start;
  const goalProgress = (start - current) / (start - sampleGoalWeight);
  const daysLogged = sampleLoggedDays.filter(Boolean).length;

  return (
    <Screen title="Progress">
      {/* Weight */}
      <Card>
        <View style={styles.weightHeader}>
          <View>
            <Text variant="label" color="textSecondary">
              Weight
            </Text>
            <Text variant="number" style={styles.bigNumber}>
              {current.toFixed(1)}
              <Text variant="bodyStrong" color="textSecondary">
                {' '}kg
              </Text>
            </Text>
          </View>
          <View style={[styles.changePill, { backgroundColor: withAlpha(theme.accent, 0.18) }]}>
            <Text variant="caption" color="accent" rounded style={styles.changeText}>
              {change > 0 ? '+' : ''}
              {change.toFixed(1)} kg · 8 wks
            </Text>
          </View>
        </View>
        <LineChart values={sampleWeights} goal={sampleGoalWeight} />
        <Text variant="caption" color="textTertiary">
          Dashed line: goal of {sampleGoalWeight} kg
        </Text>
        <Button title="Log today's weight" icon="plus" variant="secondary" size="md" onPress={() => comingSoon('Weight tracking', 7)} />
      </Card>

      {/* Goal */}
      <SectionHeader title="Goal" />
      <Card>
        <View style={styles.goalRow}>
          <Icon name="target" size={20} color="accent" />
          <Text variant="bodyStrong" style={styles.flex}>
            {start.toFixed(1)} kg → {sampleGoalWeight} kg
          </Text>
          <Text variant="callout" color="textSecondary" rounded>
            {Math.round(goalProgress * 100)}%
          </Text>
        </View>
        <ProgressBar progress={goalProgress} />
        <Text variant="caption" color="textSecondary">
          {(current - sampleGoalWeight).toFixed(1)} kg to go
        </Text>
      </Card>

      {/* Consistency */}
      <SectionHeader title="Consistency" />
      <Card>
        <Text variant="callout" color="textSecondary">
          Food logged on {daysLogged} of the last 7 days
        </Text>
        <View style={styles.days}>
          {sampleLoggedDays.map((logged, index) => (
            <View key={index} style={styles.day}>
              <View
                style={[
                  styles.dayDot,
                  { backgroundColor: logged ? theme.button : theme.fill },
                ]}>
                {logged && <Icon name="checkmark" size={13} color="onButton" />}
              </View>
              <Text variant="caption" color="textTertiary">
                {DAY_LABELS[index]}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  changePill: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: 999,
  },
  changeText: {
    fontWeight: '800',
  },
  bigNumber: {
    fontSize: 44,
    lineHeight: 48,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  flex: {
    flex: 1,
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: Spacing[1],
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
