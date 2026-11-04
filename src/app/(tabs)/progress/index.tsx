import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { LineChart } from '@/components/ui/line-chart';
import { ListRow } from '@/components/ui/list-row';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { withAlpha } from '@/constants/themes';
import { useCheckIns, useFoodLoggedDays } from '@/hooks/use-check-ins';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { MEASUREMENTS, goalProgress, weightSeries, type CheckIn } from '@/lib/check-ins';
import { localDate } from '@/lib/diary';

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    return day;
  });
}

function formatDay(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function signed(value: number) {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)}`;
}

export default function ProgressScreen() {
  const theme = useTheme();
  const { data: profile } = useProfile();
  const checkIns = useCheckIns().data ?? [];
  const days = lastSevenDays();
  const loggedDays = new Set(useFoodLoggedDays(localDate(days[0])).data ?? []);

  const weights = weightSeries(checkIns);
  const start = weights[0];
  const current = weights.at(-1);
  const goalWeight = profile?.goal_weight_kg ?? null;
  const change = start && current ? current.weightKg - start.weightKg : 0;
  const daysLogged = days.filter((d) => loggedDays.has(localDate(d))).length;
  const latestMeasured = [...checkIns].reverse().find((c) => MEASUREMENTS.some(({ key }) => c[key] !== null));
  const firstMeasured = checkIns.find((c) => MEASUREMENTS.some(({ key }) => c[key] !== null));

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
              {current ? current.weightKg.toFixed(1) : '–'}
              <Text variant="bodyStrong" color="textSecondary">
                {' '}kg
              </Text>
            </Text>
          </View>
          {start && current && weights.length > 1 && (
            <View style={[styles.changePill, { backgroundColor: withAlpha(theme.accent, 0.18) }]}>
              <Text variant="caption" color="accent" rounded style={styles.changeText}>
                {signed(change)} kg since {formatDay(start.date)}
              </Text>
            </View>
          )}
        </View>
        {weights.length >= 2 ? (
          <>
            <LineChart values={weights.map((w) => w.weightKg)} goal={goalWeight ?? undefined} />
            {goalWeight && (
              <Text variant="caption" color="textTertiary">
                Dashed line: goal of {goalWeight} kg
              </Text>
            )}
          </>
        ) : (
          <Text variant="callout" color="textSecondary">
            Weigh in on a few different days to see your trend here.
          </Text>
        )}
        <Button title="Weigh in" icon="plus" size="md" onPress={() => router.push('/progress/check-in')} />
      </Card>

      {/* Goal */}
      {goalWeight && start && current && (
        <>
          <SectionHeader title="Goal" />
          <Card>
            <View style={styles.goalRow}>
              <Icon name="target" size={20} color="accent" />
              <Text variant="bodyStrong" style={styles.flex}>
                {start.weightKg.toFixed(1)} kg → {goalWeight} kg
              </Text>
              <Text variant="callout" color="textSecondary" rounded>
                {Math.round(goalProgress(start.weightKg, current.weightKg, goalWeight) * 100)}%
              </Text>
            </View>
            <ProgressBar progress={goalProgress(start.weightKg, current.weightKg, goalWeight)} />
            <Text variant="caption" color="textSecondary">
              {Math.abs(current.weightKg - goalWeight) < 0.1
                ? 'Goal reached. Nice work!'
                : `${Math.abs(current.weightKg - goalWeight).toFixed(1)} kg to go`}
            </Text>
          </Card>
        </>
      )}

      {/* Consistency */}
      <SectionHeader title="Consistency" />
      <Card>
        <Text variant="callout" color="textSecondary">
          Food logged on {daysLogged} of the last 7 days
        </Text>
        <View style={styles.days}>
          {days.map((day) => {
            const logged = loggedDays.has(localDate(day));
            return (
              <View key={day.toISOString()} style={styles.day}>
                <View style={[styles.dayDot, { backgroundColor: logged ? theme.button : theme.fill }]}>
                  {logged && <Icon name="checkmark" size={13} color="onButton" />}
                </View>
                <Text variant="caption" color="textTertiary">
                  {day.toLocaleDateString('en-AU', { weekday: 'narrow' })}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Measurements */}
      {latestMeasured && (
        <>
          <SectionHeader title="Measurements" />
          <Card flush>
            {MEASUREMENTS.filter(({ key }) => latestMeasured[key] !== null).map(({ key, label }, index, list) => {
              const first = firstMeasured?.[key];
              const latest = latestMeasured[key]!;
              const diff = first != null && firstMeasured !== latestMeasured ? latest - first : null;
              return (
                <ListRow
                  key={key}
                  title={label}
                  subtitle={diff !== null ? `${signed(diff)} cm since ${formatDay(firstMeasured!.measuredOn)}` : undefined}
                  value={`${latest} cm`}
                  divider={index < list.length - 1}
                />
              );
            })}
          </Card>
        </>
      )}

      {/* History */}
      {checkIns.length > 0 && (
        <>
          <SectionHeader title="History" />
          <Card flush>
            {[...checkIns]
              .reverse()
              .slice(0, 10)
              .map((checkIn: CheckIn, index, list) => (
                <ListRow
                  key={checkIn.id}
                  icon="scale"
                  title={checkIn.weightKg !== null ? `${checkIn.weightKg.toFixed(1)} kg` : 'Measurements'}
                  subtitle={new Date(`${checkIn.measuredOn}T00:00:00`).toLocaleDateString('en-AU', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                  onPress={() => router.push({ pathname: '/progress/check-in', params: { date: checkIn.measuredOn } })}
                  divider={index < list.length - 1}
                />
              ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing[2],
  },
  bigNumber: {
    fontSize: 44,
    lineHeight: 48,
  },
  changePill: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: 999,
    flexShrink: 1,
  },
  changeText: {
    fontWeight: '800',
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
