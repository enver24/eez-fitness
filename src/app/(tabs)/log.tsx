import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Glass } from '@/components/ui/glass';
import { Icon } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, Type } from '@/constants/theme';
import { sampleRecentFoods, type MealType } from '@/data/sample';
import { useTheme } from '@/hooks/use-theme';
import { comingSoon } from '@/lib/coming-soon';
import { formatNumber } from '@/lib/nutrition';

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export default function LogScreen() {
  const theme = useTheme();
  const [meal, setMeal] = useState<MealType>('lunch');

  return (
    <Screen title="Log food">
      {/* Meal picker */}
      <Glass radius={Radius.md} style={styles.segmented}>
        {MEAL_OPTIONS.map((option) => {
          const selected = option.value === meal;
          return (
            <Pressable
              key={option.value}
              onPress={() => setMeal(option.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[styles.segment, selected && { backgroundColor: theme.button }]}>
              <Text variant="caption" color={selected ? 'onButton' : 'textSecondary'} style={styles.segmentLabel}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </Glass>

      {/* Search */}
      <Glass radius={Radius.md} style={styles.search}>
        <Icon name="search" size={17} color="textTertiary" />
        <TextInput
          placeholder="Search foods, e.g. banana"
          placeholderTextColor={theme.textTertiary}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
          onSubmitEditing={() => comingSoon('Food search', 5)}
        />
      </Glass>

      {/* AI scanner */}
      <Card>
        <View style={styles.scanHeader}>
          <View style={[styles.scanIcon, { backgroundColor: theme.fill }]}>
            <Icon name="sparkles" size={20} color="accent" />
          </View>
          <View style={styles.scanText}>
            <Text variant="heading">Scan a meal</Text>
            <Text variant="callout" color="textSecondary">
              Take a photo and AI estimates the foods, portions and macros. You review everything
              before it’s saved.
            </Text>
          </View>
        </View>
        <Button title="Take a photo" icon="camera" onPress={() => comingSoon('AI food scanner', 6)} />
        <Notice>
          AI estimates from photos are approximate and can be wrong. Always check and adjust the
          results.
        </Notice>
      </Card>

      {/* Recent foods */}
      <SectionHeader title="Recent" actionLabel="Add manually" onAction={() => comingSoon('Manual entry', 5)} />
      <Card flush>
        {sampleRecentFoods.map((food, index) => (
          <ListRow
            key={food.name}
            title={food.name}
            subtitle={`${food.amount} · P ${food.protein} g · C ${food.carbs} g · F ${food.fat} g`}
            value={`${formatNumber(food.calories)} kcal`}
            onPress={() => comingSoon('Quick add', 5)}
            divider={index < sampleRecentFoods.length - 1}
          />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[2],
    borderRadius: Radius.sm,
    borderCurve: 'continuous',
  },
  segmentLabel: {
    fontWeight: '700',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    // Keeps the text above the glass blur layer in web browsers.
    position: 'relative',
    ...Type.body,
    paddingVertical: Spacing[3],
  },
  scanHeader: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  scanIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: {
    flex: 1,
    gap: Spacing[1],
  },
});
