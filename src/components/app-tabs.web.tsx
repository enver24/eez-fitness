/**
 * Web-only tab bar, used when previewing the app in a browser.
 * The real iPhone/Android tab bar is in `app-tabs.tsx`.
 */

import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TABS: { name: string; href: '/' | '/log' | '/workouts' | '/progress' | '/profile'; label: string; icon: IconName }[] = [
  { name: 'index', href: '/', label: 'Today', icon: 'flame' },
  { name: 'log', href: '/log', label: 'Log', icon: 'snack' },
  { name: 'workouts', href: '/workouts', label: 'Workouts', icon: 'dumbbell' },
  { name: 'progress', href: '/progress', label: 'Progress', icon: 'chart' },
  { name: 'profile', href: '/profile', label: 'Profile', icon: 'person' },
];

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <BottomBar>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton icon={tab.icon}>{tab.label}</TabButton>
            </TabTrigger>
          ))}
        </BottomBar>
      </TabList>
    </Tabs>
  );
}

function BottomBar(props: TabListProps) {
  const theme = useTheme();
  return (
    <View
      {...props}
      style={[styles.bar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}
    />
  );
}

function TabButton({
  children,
  isFocused,
  icon,
  ...props
}: TabTriggerSlotProps & { icon: IconName }) {
  const color = isFocused ? 'accent' : 'textTertiary';
  return (
    <Pressable {...props} style={styles.button}>
      <Icon name={icon} size={22} color={color} />
      <Text variant="caption" color={color} style={styles.label}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing[2],
    paddingBottom: Spacing[5],
  },
  button: {
    flex: 1,
    maxWidth: MaxContentWidth / 5,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
