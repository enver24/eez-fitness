/**
 * PLACEHOLDER DATA for screens that aren't connected to the database yet
 * (workouts).
 *
 * Nothing here is real. Stage 8 (workouts) replaces it with
 * the signed-in user's own data from the database.
 */

export const sampleWorkouts = [
  { name: 'Push day', date: 'Yesterday', exercises: 6, durationMin: 58, volumeKg: 8420 },
  { name: 'Legs', date: 'Fri 16 Oct', exercises: 5, durationMin: 64, volumeKg: 11250 },
  { name: 'Pull day', date: 'Wed 14 Oct', exercises: 6, durationMin: 52, volumeKg: 7980 },
];

export const samplePersonalRecords = [
  { exercise: 'Bench press', best: '90 kg × 5', date: 'Yesterday' },
  { exercise: 'Back squat', best: '125 kg × 3', date: 'Fri 16 Oct' },
  { exercise: 'Deadlift', best: '150 kg × 2', date: '2 Oct' },
];
