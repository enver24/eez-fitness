import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { samplePersonalRecords, sampleWorkouts } from '@/data/sample';
import { comingSoon } from '@/lib/coming-soon';
import { formatNumber } from '@/lib/nutrition';

export default function WorkoutsScreen() {
  const weekVolume = sampleWorkouts.reduce((sum, w) => sum + w.volumeKg, 0);
  const weekMinutes = sampleWorkouts.reduce((sum, w) => sum + w.durationMin, 0);

  return (
    <Screen title="Workouts">
      <Button title="Start a workout" icon="plus" onPress={() => comingSoon('Workout logging', 8)} />

      {/* This week */}
      <Card>
        <Text variant="label" color="textSecondary">
          This week
        </Text>
        <View style={styles.stats}>
          <Stat value={String(sampleWorkouts.length)} label="Workouts" color="accent" />
          <Stat value={formatNumber(weekMinutes)} label="Minutes" color="protein" />
          <Stat value={`${(weekVolume / 1000).toFixed(1)}t`} label="Lifted" color="carbs" />
        </View>
      </Card>

      {/* History */}
      <SectionHeader title="Recent sessions" actionLabel="See all" onAction={() => comingSoon('Training history', 8)} />
      <Card flush>
        {sampleWorkouts.map((workout, index) => (
          <ListRow
            key={workout.name + workout.date}
            icon="dumbbell"
            title={workout.name}
            subtitle={`${workout.date} · ${workout.durationMin} min · ${workout.exercises} exercises`}
            value={`${formatNumber(workout.volumeKg)} kg`}
            onPress={() => comingSoon('Workout details', 8)}
            divider={index < sampleWorkouts.length - 1}
          />
        ))}
      </Card>

      {/* Personal records */}
      <SectionHeader title="Personal records" />
      <Card flush>
        {samplePersonalRecords.map((record, index) => (
          <ListRow
            key={record.exercise}
            icon="trophy"
            iconColor="fat"
            title={record.exercise}
            subtitle={record.date}
            value={record.best}
            divider={index < samplePersonalRecords.length - 1}
          />
        ))}
      </Card>
    </Screen>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: ThemeColor }) {
  return (
    <View style={styles.stat}>
      <Text variant="number" color={color}>
        {value}
      </Text>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    gap: Spacing[4],
  },
  stat: {
    flex: 1,
    gap: 2,
  },
});
