import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PlannedSlot } from '@/lib/meal-planner';
import {
  deletePlannedMeal,
  fetchFavourites,
  fetchPlannedMeals,
  replacePlan,
  setFavourite,
  updatePlannedMeal,
} from '@/lib/meal-plan-store';

export function usePlannedMeals(from: string, to: string) {
  return useQuery({ queryKey: ['meal-plan', from, to], queryFn: () => fetchPlannedMeals(from, to) });
}

function usePlanMutation<T>(mutationFn: (input: T) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meal-plan'] }),
  });
}

export function useReplacePlan() {
  return usePlanMutation(({ dates, slots }: { dates: string[]; slots: PlannedSlot[] }) => replacePlan(dates, slots));
}

export function useUpdatePlannedMeal() {
  return usePlanMutation(({ id, ...changes }: { id: string; mealId?: string; servings?: number }) =>
    updatePlannedMeal(id, changes),
  );
}

export function useDeletePlannedMeal() {
  return usePlanMutation((id: string) => deletePlannedMeal(id));
}

export function useFavourites() {
  return useQuery({ queryKey: ['favourite-meals'], queryFn: fetchFavourites });
}

export function useSetFavourite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, favourite }: { mealId: string; favourite: boolean }) => setFavourite(mealId, favourite),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favourite-meals'] }),
  });
}
