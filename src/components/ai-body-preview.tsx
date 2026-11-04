import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PrivatePhoto } from '@/components/private-photo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useBodyVisuals, useCreateVisual, useDeleteVisual, useKeepVisual } from '@/hooks/use-body-visuals';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { usePhotoUrls, useProgressPhotos } from '@/hooks/use-progress-photos';
import { useTheme } from '@/hooks/use-theme';
import { VISUAL_ERROR_MESSAGES, VisualError, daysLeft, deleteVisual, type BodyVisual } from '@/lib/body-visuals';
import { formatPhotoDate } from '@/lib/progress-photos';

/** Optional AI preview made from one of the user's own progress photos. */
export function AiBodyPreview() {
  const { data: profile } = useProfile();
  if (!profile) return null;

  return (
    <>
      <SectionHeader title="AI preview from your photo" />
      {!profile.progress_photos_consent_at ? (
        <Card>
          <Text variant="callout" color="textSecondary">
            Turn on progress photos to create an optional AI preview from one of your own photos.
          </Text>
          <Button title="Set up progress photos" size="md" variant="secondary" onPress={() => router.push('/progress/photos')} />
        </Card>
      ) : !profile.body_visual_consent_at ? (
        <Consent />
      ) : (
        <Previews />
      )}
    </>
  );
}

function Consent() {
  const updateProfile = useUpdateProfile();
  return (
    <Card>
      <Text variant="bodyStrong">Before you try AI previews</Text>
      {[
        'The photo you choose is sent securely to an image AI service (OpenAI, in the United States) to create the preview. It’s not used to train their models.',
        'The result is an AI guess, not a prediction. It can look unrealistic. Bodies change in their own way.',
        'Previews are private to you and are deleted automatically after 30 days unless you choose to keep them.',
        'If comparing yourself to edited images makes you feel worse, it’s fine to skip this. Your progress photos are the real record.',
      ].map((point) => (
        <View key={point} style={styles.point}>
          <Icon name="checkmark" size={14} color="accent" />
          <Text variant="callout" color="textSecondary" style={styles.flex}>
            {point}
          </Text>
        </View>
      ))}
      <Button
        title={updateProfile.isPending ? 'Saving…' : 'I understand, turn on AI previews'}
        size="md"
        onPress={() => updateProfile.mutate({ body_visual_consent_at: new Date().toISOString() })}
        disabled={updateProfile.isPending}
      />
    </Card>
  );
}

function Previews() {
  const theme = useTheme();
  const updateProfile = useUpdateProfile();
  const photos = useProgressPhotos().data ?? [];
  const visuals = useBodyVisuals(true).data ?? [];
  const urls =
    usePhotoUrls([
      ...photos,
      ...visuals.map((v) => ({ id: v.id, storagePath: v.storagePath, takenOn: '', pose: 'other' as const, note: null })),
    ]).data ?? {};
  const createVisual = useCreateVisual();
  const [selectedId, setSelectedId] = useState<string>();
  const [error, setError] = useState<string>();
  const [turningOff, setTurningOff] = useState(false);

  const selected = selectedId ?? photos[0]?.id;

  function create() {
    if (!selected) return;
    setError(undefined);
    createVisual.mutate(selected, {
      onError: (caught) => setError(VISUAL_ERROR_MESSAGES[caught instanceof VisualError ? caught.code : 'unknown']),
    });
  }

  function turnOff() {
    const doTurnOff = async () => {
      setTurningOff(true);
      try {
        for (const visual of visuals) await deleteVisual(visual);
        updateProfile.mutate({ body_visual_consent_at: null });
      } catch {
        setError('Couldn’t delete your previews. Check your connection and try again.');
      } finally {
        setTurningOff(false);
      }
    };
    if (Platform.OS === 'web') return void doTurnOff();
    Alert.alert('Turn off AI previews?', 'All your AI previews will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Turn off', style: 'destructive', onPress: () => void doTurnOff() },
    ]);
  }

  if (photos.length === 0) {
    return (
      <Card>
        <Text variant="callout" color="textSecondary">
          Add a progress photo first, ideally front-on, in good light.
        </Text>
        <Button title="Add a progress photo" size="md" variant="secondary" onPress={() => router.push('/progress/photos')} />
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Text variant="label" color="textSecondary">
          Choose a photo
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {photos.slice(0, 12).map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => setSelectedId(photo.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: photo.id === selected }}>
              <PrivatePhoto
                url={urls[photo.storagePath]}
                label={`Photo from ${formatPhotoDate(photo.takenOn)}`}
                style={[styles.thumb, photo.id === selected && { borderColor: theme.accent, borderWidth: 3 }]}
              />
            </Pressable>
          ))}
        </ScrollView>
        {createVisual.isPending ? (
          <View style={styles.busy}>
            <ActivityIndicator color={theme.accent} />
            <Text variant="callout" color="textSecondary">
              Creating your preview. This can take up to a minute…
            </Text>
          </View>
        ) : (
          <Button title="Create AI preview" icon="sparkles" size="md" onPress={create} />
        )}
        {error && (
          <Text variant="callout" color="danger">
            {error}
          </Text>
        )}
      </Card>

      {visuals.map((visual) => (
        <PreviewCard
          key={visual.id}
          visual={visual}
          beforeUrl={urls[photos.find((p) => p.id === visual.sourcePhotoId)?.storagePath ?? '']}
          afterUrl={urls[visual.storagePath]}
        />
      ))}

      <Notice>
        AI previews are guesses made by an image AI, not predictions, and may be unrealistic. They
        can’t show your genetics, timeline or health.
      </Notice>
      <Button
        title={turningOff ? 'Turning off…' : 'Turn off AI previews'}
        variant="destructive"
        size="md"
        onPress={turnOff}
        disabled={turningOff}
      />
    </>
  );
}

function PreviewCard({ visual, beforeUrl, afterUrl }: { visual: BodyVisual; beforeUrl?: string; afterUrl?: string }) {
  const keepVisual = useKeepVisual();
  const removeVisual = useDeleteVisual();
  const remaining = daysLeft(visual);

  function remove() {
    const doDelete = () => removeVisual.mutate(visual);
    if (Platform.OS === 'web') return doDelete();
    Alert.alert('Delete this preview?', 'It will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  }

  return (
    <Card>
      <View style={styles.pair}>
        <View style={styles.flex}>
          <PrivatePhoto url={beforeUrl} label="Your photo" style={styles.compare} />
          <Text variant="label" color="textSecondary" align="center" style={styles.caption}>
            Your photo
          </Text>
        </View>
        <View style={styles.flex}>
          <PrivatePhoto url={afterUrl} label="AI preview" style={styles.compare} />
          <Text variant="label" color="accent" align="center" style={styles.caption}>
            AI preview{visual.goalWeightKg ? ` · ${visual.goalWeightKg} kg` : ''}
          </Text>
        </View>
      </View>
      <Text variant="caption" color="textSecondary">
        {remaining === null ? 'Kept until you delete it.' : `Deletes automatically in ${remaining} day${remaining === 1 ? '' : 's'}.`}
      </Text>
      <View style={styles.pair}>
        <View style={styles.flex}>
          <Button
            title={remaining === null ? 'Don’t keep' : 'Keep'}
            size="md"
            variant="secondary"
            onPress={() => keepVisual.mutate({ visual, keep: remaining !== null })}
          />
        </View>
        <View style={styles.flex}>
          <Button title="Delete" size="md" variant="destructive" onPress={remove} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  point: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'flex-start',
  },
  thumbRow: {
    gap: Spacing[2],
  },
  thumb: {
    width: 72,
    aspectRatio: 3 / 4,
    borderRadius: Radius.sm,
  },
  busy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
  },
  pair: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  compare: {
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
  },
  caption: {
    marginTop: Spacing[1],
  },
});
