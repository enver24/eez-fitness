import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { mealForNow } from '@/components/meal-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MealType } from '@/lib/diary';
import {
  SAMPLE_SCAN_RESULT,
  SCAN_ERROR_MESSAGES,
  ScanError,
  analyseMeal,
  preparePhoto,
  type ScanResult,
} from '@/lib/meal-scan';

type Photo = { uri: string; width: number; height: number };

/** Step 1 of scanning: take or choose a photo, then send it for analysis. */
export default function ScanScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ meal?: MealType }>();
  const meal = params.meal ?? mealForNow();
  const [photo, setPhoto] = useState<Photo>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notConfigured, setNotConfigured] = useState(false);

  async function pick(source: 'camera' | 'library') {
    setError(undefined);
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(
        source === 'camera'
          ? 'EEZ Fitness needs camera access to scan meals. You can turn it on in Settings.'
          : 'EEZ Fitness needs photo access to scan a saved photo. You can turn it on in Settings.',
      );
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.8 };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets[0]) return;
    const { uri, width, height } = result.assets[0];
    setPhoto({ uri, width, height });
  }

  function openReview(result: ScanResult, sample = false) {
    router.replace({
      pathname: '/log/scan-review',
      params: { result: JSON.stringify(result), meal, sample: sample ? '1' : undefined },
    });
  }

  async function analyse() {
    if (!photo) return;
    setBusy(true);
    setError(undefined);
    try {
      const image = await preparePhoto(photo.uri, photo.width, photo.height);
      const result = await analyseMeal(image);
      if (!result.isFood || result.items.length === 0) {
        setError('No food found in this photo. Try a clearer photo of your meal.');
      } else {
        openReview(result);
      }
    } catch (caught) {
      const code = caught instanceof ScanError ? caught.code : 'unknown';
      setNotConfigured(code === 'ai_not_configured');
      setError(SCAN_ERROR_MESSAGES[code]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Scan a meal" showBack>
      {photo ? (
        <Image source={{ uri: photo.uri }} style={[styles.preview, { backgroundColor: theme.fill }]} contentFit="cover" />
      ) : (
        <Card>
          <Text variant="body" color="textSecondary">
            Take a photo of your meal from above, with the whole plate in view. The AI estimates
            each food and its portion, and you check everything before it’s saved.
          </Text>
        </Card>
      )}

      {!busy && (
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button title={photo ? 'Retake' : 'Take photo'} icon="camera" size="md" variant={photo ? 'secondary' : 'primary'} onPress={() => pick('camera')} />
          </View>
          <View style={styles.flex}>
            <Button title="Choose photo" size="md" variant="secondary" onPress={() => pick('library')} />
          </View>
        </View>
      )}

      {photo && !busy && <Button title="Analyse with AI" icon="sparkles" onPress={analyse} />}
      {busy && (
        <View style={styles.busy}>
          <ActivityIndicator color={theme.accent} />
          <Text variant="callout" color="textSecondary">
            Analysing your meal…
          </Text>
        </View>
      )}

      {error && (
        <Text variant="callout" color="danger">
          {error}
        </Text>
      )}
      {notConfigured && (
        <>
          <Button title="Search foods instead" variant="secondary" size="md" onPress={() => router.back()} />
          {__DEV__ && (
            <Button
              title="Try the review screen with a sample"
              variant="secondary"
              size="md"
              onPress={() => openReview(SAMPLE_SCAN_RESULT, true)}
            />
          )}
        </>
      )}

      <Notice>
        Your photo is sent securely to an AI service, which may be outside Australia, to estimate
        nutrition. It isn’t stored by EEZ Fitness. Estimates from photos are approximate and can be
        wrong, so always check them.
      </Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  flex: {
    flex: 1,
  },
  busy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
  },
});
