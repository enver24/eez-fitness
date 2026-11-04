import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { INGREDIENTS, MEALS } from '@/data/meal-library';
import { usePlannedMeals } from '@/hooks/use-meal-plan';
import { useTheme } from '@/hooks/use-theme';
import { formatGrams, shoppingList } from '@/lib/meal-planner';
import { upcomingDates } from '@/lib/meal-plan-store';

const STORAGE_KEY = 'eez.shopping-ticks';

/** Everything needed for the next 7 days of planned meals, with tick boxes. */
export default function ShoppingListScreen() {
  const theme = useTheme();
  const dates = upcomingDates(7);
  const slots = usePlannedMeals(dates[0], dates[6]).data ?? [];
  const list = shoppingList(slots, MEALS, INGREDIENTS);
  const [ticked, setTicked] = useState<string[]>([]);

  // Ticks are remembered on this phone only.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => saved && setTicked(JSON.parse(saved) as string[]))
      .catch(() => {});
  }, []);

  function toggle(key: string) {
    const next = ticked.includes(key) ? ticked.filter((k) => k !== key) : [...ticked, key];
    setTicked(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }

  function clear() {
    setTicked([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }

  return (
    <Screen title="Shopping list" showBack>
      <Text variant="callout" color="textSecondary">
        For the {slots.length} meals planned over the next 7 days. Amounts are what the recipes use;
        buy the nearest pack size.
      </Text>
      {list.map(({ aisle, items }) => (
        <View key={aisle} style={styles.section}>
          <SectionHeader title={aisle} />
          <Card>
            {items.map((item) => {
              const done = ticked.includes(item.key);
              return (
                <Pressable
                  key={item.key}
                  onPress={() => toggle(item.key)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  style={styles.item}>
                  <View
                    style={[
                      styles.box,
                      done ? { backgroundColor: theme.button, borderColor: theme.button } : { borderColor: theme.textTertiary },
                    ]}>
                    {done && <Icon name="checkmark" size={12} color="onButton" />}
                  </View>
                  <Text
                    variant="callout"
                    color={done ? 'textTertiary' : 'text'}
                    style={[styles.flex, done && styles.done]}>
                    {item.label}
                  </Text>
                  <Text variant="callout" color="textSecondary" rounded>
                    {formatGrams(item.grams)}
                  </Text>
                </Pressable>
              );
            })}
          </Card>
        </View>
      ))}
      {ticked.length > 0 && <Button title="Untick everything" variant="secondary" size="md" onPress={clear} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing[3],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    minHeight: 32,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  done: {
    textDecorationLine: 'line-through',
  },
});
