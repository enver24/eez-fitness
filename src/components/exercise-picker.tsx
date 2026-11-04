import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice';
import { Glass } from '@/components/ui/glass';
import { Icon } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useCreateExercise } from '@/hooks/use-workouts';
import { useTheme } from '@/hooks/use-theme';
import { MUSCLE_GROUPS, type Exercise } from '@/lib/workouts';

/**
 * Choose an exercise to add to a workout: search the built-in library and
 * your own exercises, or create a new one.
 */
export function ExercisePicker({
  exercises,
  onPick,
  onCancel,
}: {
  exercises: Exercise[];
  onPick: (exercise: Exercise) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  if (creating) {
    return (
      <CreateExerciseForm
        initialName={query.trim()}
        existing={exercises}
        onCreated={onPick}
        onCancel={() => setCreating(false)}
      />
    );
  }

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = exercises.filter((e) =>
    words.every((w) => `${e.name} ${e.muscleGroup}`.toLowerCase().includes(w)),
  );
  const mine = matches.filter((e) => e.isCustom);
  const library = matches.filter((e) => !e.isCustom);

  return (
    <Screen title="Add exercise" onBack={onCancel}>
      <Glass radius={Radius.md} style={styles.search}>
        <Icon name="search" size={17} color="textTertiary" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search, e.g. bench or legs"
          placeholderTextColor={theme.textTertiary}
          autoCorrect={false}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </Glass>

      <Button
        title={query.trim() && matches.length === 0 ? `Create “${query.trim()}”` : 'Create your own exercise'}
        icon="plus"
        variant="secondary"
        size="md"
        onPress={() => setCreating(true)}
      />

      {mine.length > 0 && (
        <>
          <SectionHeader title="Your exercises" />
          <ExerciseList exercises={mine} onPick={onPick} />
        </>
      )}

      {library.length > 0 && (
        <>
          <SectionHeader title={mine.length > 0 ? 'Library' : 'Exercises'} />
          <ExerciseList exercises={library.slice(0, 80)} onPick={onPick} />
        </>
      )}

      {matches.length === 0 && (
        <Text variant="callout" color="textSecondary">
          No exercises match “{query.trim()}”. Create it as your own exercise above.
        </Text>
      )}
    </Screen>
  );
}

function ExerciseList({ exercises, onPick }: { exercises: Exercise[]; onPick: (exercise: Exercise) => void }) {
  return (
    <Card flush>
      {exercises.map((exercise, index) => (
        <ListRow
          key={exercise.id}
          title={exercise.name}
          subtitle={exercise.muscleGroup}
          onPress={() => onPick(exercise)}
          divider={index < exercises.length - 1}
        />
      ))}
    </Card>
  );
}

function CreateExerciseForm({
  initialName,
  existing,
  onCreated,
  onCancel,
}: {
  initialName: string;
  existing: Exercise[];
  onCreated: (exercise: Exercise) => void;
  onCancel: () => void;
}) {
  const createExercise = useCreateExercise();
  const [name, setName] = useState(initialName);
  const [muscleGroup, setMuscleGroup] = useState('Other');
  const [error, setError] = useState<string>();

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return setError('Give the exercise a name.');
    if (trimmed.length > 60) return setError('Keep the name under 60 characters.');
    const duplicate = existing.find((e) => e.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      // It already exists, so just use that one.
      onCreated(duplicate);
      return;
    }
    createExercise.mutate(
      { name: trimmed, muscleGroup },
      {
        onSuccess: onCreated,
        onError: () => setError('Couldn’t create the exercise. Check your connection and try again.'),
      },
    );
  }

  return (
    <Screen title="New exercise" onBack={onCancel}>
      <TextField
        label="Exercise name"
        value={name}
        onChangeText={(value) => {
          setName(value);
          setError(undefined);
        }}
        placeholder="Cable lateral raise"
        autoFocus
        error={error}
      />
      <Text variant="label" color="textSecondary">
        Muscle group
      </Text>
      <ChoiceChips options={MUSCLE_GROUPS} selected={[muscleGroup]} onChange={([value]) => setMuscleGroup(value)} />
      <Text variant="caption" color="textSecondary">
        Your exercises are private to you and appear under “Your exercises” next time.
      </Text>
      <Button
        title={createExercise.isPending ? 'Creating…' : 'Create and add to workout'}
        onPress={save}
        disabled={createExercise.isPending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    ...Type.body,
    paddingVertical: Spacing[3],
    position: 'relative',
  },
});
