import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createExercise,
  deleteWorkout,
  fetchExercises,
  fetchWorkouts,
  saveWorkout,
  type WorkoutInput,
} from '@/lib/workouts';
import { useAuth } from '@/providers/auth';

export function useExercises() {
  return useQuery({ queryKey: ['exercises'], queryFn: fetchExercises, staleTime: 1000 * 60 * 10 });
}

export function useCreateExercise() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createExercise(name, session!.user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });
}

export function useWorkouts() {
  return useQuery({ queryKey: ['workouts'], queryFn: fetchWorkouts });
}

export function useSaveWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workout: WorkoutInput) => saveWorkout(workout),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] }),
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorkout(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] }),
  });
}
