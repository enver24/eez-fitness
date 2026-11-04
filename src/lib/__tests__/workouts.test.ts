/// <reference types="jest" />

import { draftToWorkout, newDraft, validateDraft, type WorkoutDraft } from '@/lib/workout-draft';
import {
  estimatedOneRepMax,
  exerciseCount,
  personalRecords,
  startOfWeek,
  workoutVolume,
  type Workout,
} from '@/lib/workouts';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

const bench = 'bench-id';
const squat = 'squat-id';

function workout(performedOn: string, sets: [string, number, number, number][]): Workout {
  return {
    id: performedOn,
    name: 'Session',
    performedOn,
    durationMin: 60,
    notes: null,
    sets: sets.map(([exerciseId, position, reps, weightKg], index) => ({
      exerciseId,
      exercisePosition: position,
      setNumber: index + 1,
      reps,
      weightKg,
    })),
  };
}

describe('workout maths', () => {
  it('adds up volume as weight × reps', () => {
    expect(workoutVolume([{ reps: 10, weightKg: 60 }, { reps: 8, weightKg: 70 }])).toBe(1160);
  });

  it('counts distinct exercises', () => {
    expect(exerciseCount([{ exercisePosition: 0 }, { exercisePosition: 0 }, { exercisePosition: 1 }])).toBe(2);
  });

  it('estimates a one-rep max with the Epley formula', () => {
    expect(estimatedOneRepMax(100, 1)).toBe(100);
    expect(estimatedOneRepMax(100, 10)).toBeCloseTo(133.3, 1);
    expect(estimatedOneRepMax(0, 10)).toBe(0);
  });

  it('finds the heaviest set per exercise as the record', () => {
    const records = personalRecords([
      workout('2026-11-03', [[bench, 0, 5, 90], [squat, 1, 3, 120]]),
      workout('2026-10-27', [[bench, 0, 8, 85], [bench, 0, 3, 90]]),
    ]);
    const benchRecord = records.find((r) => r.exerciseId === bench)!;
    expect(benchRecord).toMatchObject({ weightKg: 90, reps: 5, performedOn: '2026-11-03' });
    // 85 kg × 8 gives a higher estimated max than 90 × 5.
    expect(benchRecord.estimatedMax).toBeCloseTo(107.7, 1);
    expect(records.find((r) => r.exerciseId === squat)?.weightKg).toBe(120);
  });

  it('starts the week on Monday', () => {
    expect(startOfWeek(new Date('2026-11-05T12:00:00'))).toBe('2026-11-02'); // Thursday → Monday
    expect(startOfWeek(new Date('2026-11-08T12:00:00'))).toBe('2026-11-02'); // Sunday → Monday
  });
});

describe('workout drafts', () => {
  const draft: WorkoutDraft = {
    ...newDraft(),
    name: 'Push day',
    exercises: [
      {
        key: 'a',
        exerciseId: bench,
        sets: [
          { key: '1', reps: '8', weight: '80' },
          { key: '2', reps: '', weight: '' }, // empty row: skipped
        ],
      },
      { key: 'b', exerciseId: squat, sets: [{ key: '3', reps: '', weight: '' }] }, // no sets: dropped
    ],
  };

  it('accepts a workout with at least one set', () => {
    expect(validateDraft(draft)).toBeNull();
  });

  it('rejects a workout without any reps', () => {
    expect(validateDraft({ ...draft, exercises: [] })).toMatch(/at least one set/);
  });

  it('rejects impossible numbers', () => {
    const bad = { ...draft, exercises: [{ key: 'a', exerciseId: bench, sets: [{ key: '1', reps: '8', weight: '5000' }] }] };
    expect(validateDraft(bad)).toMatch(/Weight/);
  });

  it('drops empty rows and exercises when saving', () => {
    const saved = draftToWorkout(draft);
    expect(saved.sets).toEqual([{ exerciseId: bench, exercisePosition: 0, setNumber: 1, reps: 8, weightKg: 80 }]);
  });
});
