import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PhotoCheckInCard } from '@/components/photo-check-in-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useExercises, useWorkouts } from '@/hooks/use-workouts';
import { formatNumber } from '@/lib/nutrition';
import { loadSavedDraft } from '@/lib/workout-draft';
import {
  exerciseCount,
  formatWorkoutDate,
  personalRecords,
  startOfWeek,
  workoutVolume,
  type Workout,
} from '@/lib/workouts';

function workoutSubtitle(workout: Workout) {
  const parts = [formatWorkoutDate(workout.performedOn)];
  if (workout.durationMin) parts.push(`${workout.durationMin} min`);
  const count = exerciseCount(workout.sets);
  parts.push(`${count} exercise${count === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

export default function WorkoutsScreen() {
  const workouts = useWorkouts().data ?? [];
  const exercises = useExercises().data ?? [];
  const exerciseNames = new Map(exercises.map((e) => [e.id, e.name]));
  const [hasUnfinished, setHasUnfinished] = useState(false);

  // Show "Resume workout" if a workout was started but not finished.
  // Re-checked every time this screen comes back into view.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadSavedDraft().then((draft) => {
        if (!cancelled) setHasUnfinished(!!draft && draft.exercises.length > 0);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const weekStart = startOfWeek();
  const thisWeek = workouts.filter((w) => w.performedOn >= weekStart);
  const weekMinutes = thisWeek.reduce((sum, w) => sum + (w.durationMin ?? 0), 0);
  const weekVolume = thisWeek.reduce((sum, w) => sum + workoutVolume(w.sets), 0);
  const records = personalRecords(workouts).slice(0, 8);

  return (
    <Screen title="Workouts">
      <Button
        title={hasUnfinished ? 'Resume workout' : 'Start a workout'}
        icon="plus"
        onPress={() => router.push('/workouts/session')}
      />

      <PhotoCheckInCard />

      <Card>
        <Text variant="label" color="textSecondary">
          This week
        </Text>
        <View style={styles.stats}>
          <Stat value={String(thisWeek.length)} label="Workouts" color="accent" />
          <Stat value={formatNumber(weekMinutes)} label="Minutes" color="protein" />
          <Stat value={`${(weekVolume / 1000).toFixed(1)}t`} label="Lifted" color="carbs" />
        </View>
      </Card>

      <SectionHeader title="Recent sessions" />
      {workouts.length === 0 ? (
        <Text variant="callout" color="textSecondary">
          No workouts yet. Tap “Start a workout” to log your first one.
        </Text>
      ) : (
        <Card flush>
          {workouts.slice(0, 15).map((workout, index, list) => (
            <ListRow
              key={workout.id}
              icon="dumbbell"
              title={workout.name}
              subtitle={workoutSubtitle(workout)}
              value={`${formatNumber(Math.round(workoutVolume(workout.sets)))} kg`}
              onPress={() => router.push({ pathname: '/workouts/session', params: { id: workout.id } })}
              divider={index < list.length - 1}
            />
          ))}
        </Card>
      )}

      {records.length > 0 && (
        <>
          <SectionHeader title="Personal records" />
          <Card flush>
            {records.map((record, index) => (
              <ListRow
                key={record.exerciseId}
                icon="trophy"
                iconColor="fat"
                title={exerciseNames.get(record.exerciseId) ?? 'Exercise'}
                subtitle={`${formatWorkoutDate(record.performedOn)} · est. 1-rep max ${Math.round(record.estimatedMax)} kg`}
                value={`${record.weightKg} kg × ${record.reps}`}
                divider={index < records.length - 1}
              />
            ))}
          </Card>
          <Text variant="caption" color="textTertiary">
            Estimated 1-rep max uses the Epley formula. It’s a guide, not a target to test.
          </Text>
        </>
      )}
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
