import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';

import { PrivatePhoto } from '@/components/private-photo';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Radius } from '@/constants/theme';
import { useDeletePhoto, usePhotoUrls, useProgressPhotos, useUpdatePhotoNote } from '@/hooks/use-progress-photos';
import { POSES, type ProgressPhoto } from '@/lib/progress-photos';

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** One progress photo, full size, with a delete button. /progress/photo?id=<id> */
export default function PhotoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const photo = (useProgressPhotos().data ?? []).find((p) => p.id === id);
  const urls = usePhotoUrls(photo ? [photo] : []).data ?? {};
  const deletePhoto = useDeletePhoto();
  if (!photo) return null;
  return <PhotoDetail key={photo.id} photo={photo} url={urls[photo.storagePath]} deletePhoto={deletePhoto} />;
}

function PhotoDetail({
  photo,
  url,
  deletePhoto,
}: {
  photo: ProgressPhoto;
  url?: string;
  deletePhoto: ReturnType<typeof useDeletePhoto>;
}) {
  const updateNote = useUpdatePhotoNote();
  const [note, setNote] = useState(photo.note ?? '');
  const noteChanged = note.trim() !== (photo.note ?? '');

  function remove() {
    const target = photo;
    const doDelete = () => deletePhoto.mutate(target, { onSuccess: () => router.back() });
    if (Platform.OS === 'web') return doDelete();
    Alert.alert('Delete this photo?', 'It will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  }

  return (
    <Screen eyebrow={POSES.find((p) => p.value === photo.pose)?.label ?? 'Photo'} title="Photo" showBack>
      <PrivatePhoto url={url} style={styles.image} contentFit="contain" label="Progress photo" />
      <Text variant="callout" color="textSecondary">
        {formatDate(photo.takenOn)}
      </Text>
      <TextField
        label="Note"
        value={note}
        onChangeText={setNote}
        placeholder="Add a note about this photo"
        maxLength={200}
        multiline
      />
      {noteChanged && (
        <Button
          title={updateNote.isPending ? 'Saving…' : 'Save note'}
          size="md"
          onPress={() => updateNote.mutate({ id: photo.id, note })}
          disabled={updateNote.isPending}
        />
      )}
      {updateNote.error && (
        <Text variant="callout" color="danger">
          Couldn’t save the note. Check your connection and try again.
        </Text>
      )}
      {deletePhoto.error && (
        <Text variant="callout" color="danger">
          Couldn’t delete the photo. Check your connection and try again.
        </Text>
      )}
      <Button
        title={deletePhoto.isPending ? 'Deleting…' : 'Delete photo'}
        variant="destructive"
        icon="trash"
        size="md"
        onPress={remove}
        disabled={deletePhoto.isPending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: Radius.lg,
  },
});
