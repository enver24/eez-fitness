import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createVisual, deleteVisual, fetchVisuals, setKeepVisual, type BodyVisual } from '@/lib/body-visuals';

export function useBodyVisuals(enabled: boolean) {
  return useQuery({ queryKey: ['body-visuals'], queryFn: fetchVisuals, enabled });
}

function useVisualMutation<T, R = void>(mutationFn: (input: T) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['body-visuals'] }),
  });
}

export function useCreateVisual() {
  return useVisualMutation((photoId: string) => createVisual(photoId));
}

export function useKeepVisual() {
  return useVisualMutation(({ visual, keep }: { visual: BodyVisual; keep: boolean }) => setKeepVisual(visual, keep));
}

export function useDeleteVisual() {
  return useVisualMutation((visual: BodyVisual) => deleteVisual(visual));
}
