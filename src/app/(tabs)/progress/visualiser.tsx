import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BodyFigure } from '@/components/body-figure';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useCheckIns } from '@/hooks/use-check-ins';
import { useProfile } from '@/hooks/use-profile';
import { blendShapes, bodyShapes, weeksToGoal } from '@/lib/body-visual';
import { weightSeries } from '@/lib/check-ins';

/** An illustrated "now vs goal" figure. Uses no photos. */
export default function VisualiserScreen() {
  const { data: profile } = useProfile();
  const latest = weightSeries(useCheckIns().data ?? []).at(-1)?.weightKg;
  if (!profile) return null;

  const weight = latest ?? profile.weight_kg;
  const ready = profile.sex && profile.height_cm && weight && profile.goal_weight_kg && profile.goal;

  if (!ready) {
    return (
      <Screen title="Goal visualiser" showBack>
        <Card>
          <Text variant="callout" color="textSecondary">
            Add a goal weight to see an illustration of your goal.
          </Text>
          <Button title="Set a goal weight" size="md" onPress={() => router.push('/profile/edit?section=goal')} />
        </Card>
      </Screen>
    );
  }

  const shapes = bodyShapes({
    sex: profile.sex!,
    heightCm: profile.height_cm!,
    weightKg: weight!,
    goalWeightKg: profile.goal_weight_kg!,
    goal: profile.goal!,
    bodyFatPercent: profile.body_fat_percent,
  });
  const weeks = weeksToGoal(weight!, profile.goal_weight_kg!);

  return (
    <Screen title="Goal visualiser" showBack>
      <Notice>
        This is an illustration to help you picture your goal, not a prediction. It isn’t based on
        a photo of you and can’t measure body fat. Real bodies change in their own way and at their
        own pace.
      </Notice>

      <Card>
        <View style={styles.pair}>
          <View style={styles.figure}>
            <BodyFigure shape={shapes.now} sex={profile.sex!} height={230} />
            <Text variant="label" color="textSecondary">
              Now · {weight!.toFixed(1)} kg
            </Text>
          </View>
          <View style={styles.figure}>
            <BodyFigure shape={shapes.goal} sex={profile.sex!} height={230} highlight />
            <Text variant="label" color="accent">
              Goal · {profile.goal_weight_kg} kg
            </Text>
          </View>
        </View>
      </Card>

      <SectionHeader title="The journey" />
      <Card>
        <View style={styles.journey}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <BodyFigure key={t} shape={blendShapes(shapes.now, shapes.goal, t)} sex={profile.sex!} height={110} highlight={t === 1} />
          ))}
        </View>
        <Text variant="callout" color="textSecondary">
          {weeks === 0
            ? 'You’re at your goal weight. Nice work!'
            : `At a steady pace of ${weight! > profile.goal_weight_kg! ? '0.5 kg' : '0.25 kg'} a week, that’s roughly ${weeks} weeks. Everyone’s different, so treat this as a rough guide.`}
        </Text>
      </Card>

      <Text variant="caption" color="textTertiary">
        Drawn from your height, latest weight and goal weight
        {profile.body_fat_percent !== null ? ', using your body fat estimate as the starting point' : ''}.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pair: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  figure: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  journey: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
});
