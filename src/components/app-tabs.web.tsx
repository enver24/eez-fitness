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

import { Glass } from '@/components/ui/glass';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

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

function BottomBar({ children, ...props }: TabListProps) {
  return (
    <View {...props} style={styles.barWrap}>
      <Glass radius={Radius.pill} style={styles.bar}>
        {children}
      </Glass>
    </View>
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
  barWrap: {
    position: 'absolute',
    bottom: Spacing[4],
    left: Spacing[4],
    right: Spacing[4],
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    paddingVertical: Spacing[2],
  },
  button: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
