import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deletePhoto,
  fetchPhotos,
  fetchSignedUrls,
  updatePhotoNote,
  uploadPhoto,
  type Pose,
  type ProgressPhoto,
} from '@/lib/progress-photos';
import { useAuth } from '@/providers/auth';

export function useProgressPhotos(enabled = true) {
  return useQuery({ queryKey: ['progress-photos'], queryFn: fetchPhotos, enabled });
}

/** Signed links for the given photos. Refreshed before the hour-long links expire. */
export function usePhotoUrls(photos: ProgressPhoto[]) {
  const paths = photos.map((p) => p.storagePath).sort();
  return useQuery({
    queryKey: ['progress-photos', 'urls', paths],
    queryFn: () => fetchSignedUrls(paths),
    enabled: paths.length > 0,
    staleTime: 1000 * 60 * 45,
  });
}

export function useUploadPhoto() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { uri: string; width: number; height: number; takenOn: string; pose: Pose; note: string }) =>
      uploadPhoto({ ...input, userId: session!.user.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progress-photos'] }),
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photo: ProgressPhoto) => deletePhoto(photo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progress-photos'] }),
  });
}

export function useUpdatePhotoNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => updatePhotoNote(id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progress-photos'] }),
  });
}
