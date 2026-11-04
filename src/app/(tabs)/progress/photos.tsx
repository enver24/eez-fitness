import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { PrivatePhoto } from '@/components/private-photo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { useDeletePhoto, usePhotoUrls, useProgressPhotos, useUploadPhoto } from '@/hooks/use-progress-photos';
import { useTheme } from '@/hooks/use-theme';
import { localDate } from '@/lib/diary';
import {
  POSES,
  REMINDER_OPTIONS,
  comparisonPair,
  deleteAllPhotoFiles,
  formatPhotoDate,
  type Pose,
} from '@/lib/progress-photos';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';

type PendingPhoto = { uri: string; width: number; height: number };

function dayOptions() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return [
    { value: localDate(), label: 'Today' },
    { value: localDate(yesterday), label: 'Yesterday' },
  ];
}

/** Progress photos: consent, upload, gallery and before/after comparison. */
export default function ProgressPhotosScreen() {
  const { data: profile } = useProfile();
  if (!profile) return null;
  return profile.progress_photos_consent_at ? <Gallery /> : <Consent />;
}

function Consent() {
  const updateProfile = useUpdateProfile();
  return (
    <Screen title="Progress photos" showBack>
      <Card>
        <Text variant="heading">Before you start</Text>
        <View style={styles.points}>
          {[
            'Photos are private. Only you can see them, and they’re only shown through links that expire after an hour.',
            'They’re stored securely with our database provider, Supabase (in Singapore during the beta).',
            'They’re never shared, never used for ads, and never sent to AI.',
            'You can delete any photo at any time. Deleting your account deletes all of them.',
            'Photos can’t measure body fat or predict results. They’re just for seeing your own progress.',
          ].map((point) => (
            <View key={point} style={styles.point}>
              <Icon name="checkmark" size={14} color="accent" />
              <Text variant="callout" color="textSecondary" style={styles.flex}>
                {point}
              </Text>
            </View>
          ))}
        </View>
      </Card>
      {updateProfile.error && (
        <Text variant="callout" color="danger">
          Couldn’t save. Check your connection and try again.
        </Text>
      )}
      <Button
        title={updateProfile.isPending ? 'Saving…' : 'I agree, turn on progress photos'}
        onPress={() => updateProfile.mutate({ progress_photos_consent_at: new Date().toISOString() })}
        disabled={updateProfile.isPending}
      />
      <Button title="Not now" variant="secondary" size="md" onPress={() => router.back()} />
    </Screen>
  );
}

function Gallery() {
  const theme = useTheme();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const photos = useProgressPhotos().data ?? [];
  const urls = usePhotoUrls(photos).data ?? {};
  const upload = useUploadPhoto();
  const deletePhoto = useDeletePhoto();
  const updateProfile = useUpdateProfile();
  const [pose, setPose] = useState<Pose>('front');
  const [pending, setPending] = useState<PendingPhoto>();
  const [note, setNote] = useState('');
  const [takenOn, setTakenOn] = useState(localDate());
  const [comparePose, setComparePose] = useState<Pose>('front');
  const [error, setError] = useState<string>();
  const [turningOff, setTurningOff] = useState(false);

  async function add(source: 'camera' | 'library') {
    setError(undefined);
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('EEZ Fitness needs permission to use the camera or photos. You can turn it on in Settings.');
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.9 };
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets[0]) return;
    const { uri, width, height } = result.assets[0];
    setPending({ uri, width, height });
    setNote('');
    setTakenOn(localDate());
  }

  function save() {
    if (!pending) return;
    upload.mutate(
      { ...pending, takenOn, pose, note },
      {
        onSuccess: () => setPending(undefined),
        onError: () => setError('Couldn’t upload the photo. Check your connection and try again.'),
      },
    );
  }

  function turnOff() {
    const doTurnOff = async () => {
      if (!session) return;
      setTurningOff(true);
      try {
        await deleteAllPhotoFiles(session.user.id);
        await supabase.from('progress_photos').delete().eq('user_id', session.user.id);
        await queryClient.invalidateQueries({ queryKey: ['progress-photos'] });
        updateProfile.mutate(
          { progress_photos_consent_at: null, progress_photo_reminder: 'off' },
          { onSuccess: () => router.back() },
        );
      } catch {
        setError('Couldn’t delete all photos. Check your connection and try again.');
      } finally {
        setTurningOff(false);
      }
    };
    if (Platform.OS === 'web') return void doTurnOff();
    Alert.alert('Delete all progress photos?', 'All your photos will be permanently deleted and progress photos turned off.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: () => void doTurnOff() },
    ]);
  }

  const pair = comparisonPair(photos, comparePose);
  const busy = upload.isPending || deletePhoto.isPending || turningOff;

  return (
    <Screen title="Progress photos" showBack>
      {pending ? (
        <Card>
          <Image source={{ uri: pending.uri }} style={styles.preview} contentFit="cover" cachePolicy="none" />
          <Text variant="label" color="textSecondary">
            Pose
          </Text>
          <ChoiceChips options={POSES} selected={[pose]} onChange={([value]) => setPose(value)} />
          <ChoiceChips options={dayOptions()} selected={[takenOn]} onChange={([value]) => setTakenOn(value)} />
          <TextField
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Week 3, feeling leaner"
            maxLength={200}
            multiline
          />
          {upload.isPending ? (
            <View style={styles.busy}>
              <ActivityIndicator color={theme.accent} />
              <Text variant="callout" color="textSecondary">
                Uploading privately…
              </Text>
            </View>
          ) : (
            <View style={styles.row}>
              <View style={styles.flex}>
                <Button title="Save photo" size="md" onPress={save} />
              </View>
              <View style={styles.flex}>
                <Button title="Cancel" size="md" variant="secondary" onPress={() => setPending(undefined)} />
              </View>
            </View>
          )}
        </Card>
      ) : (
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button title="Take photo" icon="camera" size="md" onPress={() => add('camera')} disabled={busy} />
          </View>
          <View style={styles.flex}>
            <Button title="Choose photo" size="md" variant="secondary" onPress={() => add('library')} disabled={busy} />
          </View>
        </View>
      )}
      <Text variant="caption" color="textSecondary">
        Tip: same spot, same light, same pose each time makes changes easier to see.
      </Text>
      {error && (
        <Text variant="callout" color="danger">
          {error}
        </Text>
      )}

      {photos.length >= 2 && (
        <>
          <SectionHeader title="Compare" />
          <ChoiceChips options={POSES} selected={[comparePose]} onChange={([value]) => setComparePose(value)} />
          {pair ? (
            <View style={styles.row}>
              {[
                { photo: pair.before, label: 'Before' },
                { photo: pair.after, label: 'Latest' },
              ].map(({ photo, label }) => (
                <View key={label} style={styles.flex}>
                  <PrivatePhoto url={urls[photo.storagePath]} style={styles.compareImage} label={`${label} photo`} />
                  <Text variant="label" color="textSecondary" align="center" style={styles.caption}>
                    {label} · {formatPhotoDate(photo.takenOn)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text variant="callout" color="textSecondary">
              Add at least two photos of this pose on different days to compare.
            </Text>
          )}
        </>
      )}

      <SectionHeader title={`All photos (${photos.length})`} />
      {photos.length === 0 ? (
        <Text variant="callout" color="textSecondary">
          No photos yet. Take your first one above.
        </Text>
      ) : (
        <View style={styles.grid}>
          {photos.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => router.push({ pathname: '/progress/photo', params: { id: photo.id } })}
              accessibilityRole="button"
              style={styles.cell}>
              <PrivatePhoto
                url={urls[photo.storagePath]}
                style={styles.thumb}
                label={`${photo.pose} photo from ${formatPhotoDate(photo.takenOn)}`}
              />
              <Text variant="caption" color="textSecondary" numberOfLines={1}>
                {formatPhotoDate(photo.takenOn)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <SectionHeader title="Weekly check-in" />
      <Card>
        <Text variant="callout" color="textSecondary">
          Get a reminder to take a progress photo at the start or end of your training week. It only
          appears if you haven’t taken one yet that week.
        </Text>
        <ChoiceChips
          options={REMINDER_OPTIONS}
          selected={[profile?.progress_photo_reminder ?? 'off']}
          onChange={([value]) => updateProfile.mutate({ progress_photo_reminder: value })}
        />
      </Card>

      <Button
        title={turningOff ? 'Deleting…' : 'Turn off and delete all photos'}
        variant="destructive"
        icon="trash"
        size="md"
        onPress={turnOff}
        disabled={busy}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  points: {
    gap: Spacing[3],
  },
  point: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'flex-start',
  },
  busy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
  },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
  },
  compareImage: {
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
  },
  caption: {
    marginTop: Spacing[1],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  cell: {
    width: '31%',
    gap: Spacing[1],
  },
  thumb: {
    aspectRatio: 3 / 4,
    borderRadius: Radius.sm,
  },
});
