import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchProfile, updateProfile, type ProfileUpdate } from '@/lib/profile';
import { useAuth } from '@/providers/auth';

/** The signed-in user's profile, loaded from the database and cached. */
export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  });
}

/** Saves changes to the profile, then refreshes it everywhere in the app. */
export function useUpdateProfile() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: (changes: ProfileUpdate) => updateProfile(userId!, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
  });
}

/** Today's calorie and macro targets from the profile (zero until set up). */
export function useTargets() {
  const { data: profile } = useProfile();
  return {
    calories: profile?.calorie_target ?? 0,
    protein: profile?.protein_target_g ?? 0,
    carbs: profile?.carbs_target_g ?? 0,
    fat: profile?.fat_target_g ?? 0,
  };
}
