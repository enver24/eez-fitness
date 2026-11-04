import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';

/**
 * Shows a private progress photo from a signed link. Images are only cached
 * in memory, never saved to the phone's disk cache.
 */
export function PrivatePhoto({
  url,
  style,
  contentFit = 'cover',
  label,
}: {
  url?: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain';
  label: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.frame, { backgroundColor: theme.fill }, style]} accessibilityLabel={label} accessible>
      {url ? (
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit={contentFit} cachePolicy="memory" transition={150} />
      ) : (
        <Icon name="person" size={22} color="textTertiary" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
