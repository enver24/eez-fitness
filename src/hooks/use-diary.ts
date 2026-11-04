import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  addEntries,
  addEntry,
  deleteEntry,
  fetchDayEntries,
  fetchEntry,
  fetchRecentFoods,
  updateEntry,
  type NewFoodEntry,
} from '@/lib/diary';
import { searchAustralianFoods, searchPackagedFoods } from '@/lib/food';

/** Food entries for one day. */
export function useDayEntries(date: string) {
  return useQuery({ queryKey: ['diary', date], queryFn: () => fetchDayEntries(date) });
}

export function useRecentFoods() {
  return useQuery({ queryKey: ['diary', 'recent'], queryFn: () => fetchRecentFoods() });
}

export function useEntry(id: string | undefined) {
  return useQuery({ queryKey: ['diary', 'entry', id], queryFn: () => fetchEntry(id!), enabled: !!id });
}

/** After any change, refresh every diary screen. */
function useDiaryMutation<T>(mutationFn: (input: T) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diary'] }),
  });
}

export function useAddEntry() {
  return useDiaryMutation((entry: NewFoodEntry) => addEntry(entry));
}

export function useAddEntries() {
  return useDiaryMutation((entries: NewFoodEntry[]) => addEntries(entries));
}

export function useUpdateEntry() {
  return useDiaryMutation(({ id, changes }: { id: string; changes: Partial<NewFoodEntry> }) =>
    updateEntry(id, changes),
  );
}

export function useDeleteEntry() {
  return useDiaryMutation((id: string) => deleteEntry(id));
}

/** Returns `value`, but only after it has stopped changing for `delay` ms. */
export function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Searches both food sources once the user pauses typing. */
export function useFoodSearch(text: string) {
  const query = useDebounced(text.trim(), 600);
  const enabled = query.length >= 2;
  const australian = useQuery({
    queryKey: ['food-search', 'afcd', query],
    queryFn: () => searchAustralianFoods(query),
    enabled,
    staleTime: 1000 * 60 * 60,
  });
  const packaged = useQuery({
    queryKey: ['food-search', 'off', query],
    queryFn: () => searchPackagedFoods(query),
    // Open Food Facts limits searches, so wait for 3+ letters.
    enabled: query.length >= 3,
    staleTime: 1000 * 60 * 60,
    retry: false,
  });
  return { query, enabled, australian, packaged, isTyping: text.trim() !== query };
}
