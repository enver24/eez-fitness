import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteCheckIn,
  fetchCheckIns,
  fetchFoodLoggedDays,
  saveCheckIn,
  type CheckInInput,
} from '@/lib/check-ins';

export function useCheckIns() {
  return useQuery({ queryKey: ['check-ins'], queryFn: fetchCheckIns });
}

/** After saving a weight, refresh check-ins and the profile (its weight changes too). */
function useCheckInMutation<T>(mutationFn: (input: T) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check-ins'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useSaveCheckIn() {
  return useCheckInMutation((input: CheckInInput) => saveCheckIn(input));
}

export function useDeleteCheckIn() {
  return useCheckInMutation((id: string) => deleteCheckIn(id));
}

export function useFoodLoggedDays(fromDate: string) {
  return useQuery({
    queryKey: ['diary', 'logged-days', fromDate],
    queryFn: () => fetchFoodLoggedDays(fromDate),
  });
}
