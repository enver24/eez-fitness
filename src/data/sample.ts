/**
 * PLACEHOLDER DATA for screens that aren't connected to the database yet
 * (workouts and weight).
 *
 * Nothing here is real. Stages 7 (weight) and 8 (workouts) replace it with
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

/** Morning weigh-ins for the last 8 weeks, oldest first (kg). */
export const sampleWeights = [
  86.4, 86.1, 85.9, 85.6, 85.8, 85.2, 84.9, 84.7, 84.8, 84.3, 84.1, 83.9, 84.0, 83.6, 83.4, 83.2,
];

/** Which of the last 7 days had food logged (Mon → Sun). */
export const sampleLoggedDays = [true, true, true, false, true, true, false];
