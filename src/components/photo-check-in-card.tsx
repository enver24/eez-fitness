import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useProgressPhotos } from '@/hooks/use-progress-photos';
import { isPhotoCheckInDue } from '@/lib/progress-photos';

/**
 * A reminder to take this week's progress photo. Only shown when the user
 * turned on the weekly check-in, it's their chosen day, and they haven't
 * taken a photo yet this week.
 */
export function PhotoCheckInCard() {
  const { data: profile } = useProfile();
  const reminder = profile?.progress_photo_reminder ?? 'off';
  const enabled = !!profile?.progress_photos_consent_at && reminder !== 'off';
  const photos = useProgressPhotos();
  if (!enabled || !photos.data || !isPhotoCheckInDue(reminder, photos.data)) return null;

  return (
    <Card>
      <View style={styles.header}>
        <Icon name="camera" size={18} color="accent" />
        <Text variant="bodyStrong" style={styles.flex}>
          {reminder === 'week_start' ? 'New week, new progress photo' : 'End-of-week progress photo'}
        </Text>
      </View>
      <Text variant="callout" color="textSecondary">
        Take your weekly photo to track changes over time. It’s private to you.
      </Text>
      <Button title="Take this week’s photo" icon="camera" size="md" onPress={() => router.push('/progress/photos')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  flex: {
    flex: 1,
  },
});
