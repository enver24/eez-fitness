import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityRings } from '@/components/ui/activity-rings';
import { Glass } from '@/components/ui/glass';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { THEMES, type ThemeId } from '@/constants/themes';
import { useAppearance, type AppearanceMode } from '@/providers/appearance';

const MODES: { value: AppearanceMode; label: string; icon: IconName }[] = [
  { value: 'system', label: 'Automatic', icon: 'contrast' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
];

export default function AppearanceScreen() {
  const { mode, setMode } = useAppearance();

  return (
    <Screen title="Appearance" showBack>
      <SectionHeader title="Mode" />
      <Glass radius={Radius.md} style={styles.segmented}>
        {MODES.map((option) => (
          <ModeButton
            key={option.value}
            {...option}
            selected={mode === option.value}
            onPress={() => setMode(option.value)}
          />
        ))}
      </Glass>
      <Text variant="caption" color="textSecondary">
        Automatic follows your iPhone’s light and dark setting.
      </Text>

      <SectionHeader title="Theme" />
      <View style={styles.grid}>
        {THEMES.map((theme) => (
          <ThemeTile key={theme.id} id={theme.id} name={theme.name} />
        ))}
      </View>
    </Screen>
  );
}

function ModeButton({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppearance();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.segment, selected && { backgroundColor: colors.button }]}>
      <Icon name={icon} size={15} color={selected ? 'onButton' : 'textSecondary'} />
      <Text variant="caption" color={selected ? 'onButton' : 'textSecondary'} style={styles.segmentLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A preview of one theme: its three ring colours, shown in the current mode. */
function ThemeTile({ id, name }: { id: ThemeId; name: string }) {
  const { themeId, setThemeId, isDark } = useAppearance();
  const theme = THEMES.find((t) => t.id === id)!;
  const palette = isDark ? theme.dark : theme.light;
  const selected = themeId === id;

  return (
    <Pressable
      onPress={() => setThemeId(id)}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${name} theme`}
      style={({ pressed }) => [styles.tileWrap, pressed && styles.pressed]}>
      <Glass
        radius={Radius.md}
        style={[styles.tile, selected && { borderColor: palette.accent, borderWidth: 2 }]}>
        <ActivityRings
          size={64}
          strokeWidth={7}
          gap={2}
          rings={[
            { progress: 0.75, color: palette.accent },
            { progress: 0.55, color: palette.protein },
            { progress: 0.4, color: palette.carbs },
          ]}
        />
        <View style={styles.tileFooter}>
          <Text variant="caption" style={styles.tileName} numberOfLines={1}>
            {name}
          </Text>
          {selected && (
            <View style={[styles.check, { backgroundColor: palette.button }]}>
              <Icon name="checkmark" size={10} tint={palette.onButton} />
            </View>
          )}
        </View>
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    padding: 3,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
    paddingVertical: Spacing[2],
    borderRadius: Radius.sm,
    borderCurve: 'continuous',
  },
  segmentLabel: {
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  tileWrap: {
    width: '47%',
    flexGrow: 1,
  },
  tile: {
    alignItems: 'center',
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
    paddingHorizontal: Spacing[3],
    gap: Spacing[3],
  },
  tileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  tileName: {
    fontWeight: '700',
  },
  check: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});
