import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MealPicker, mealForNow } from '@/components/meal-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Glass } from '@/components/ui/glass';
import { Icon } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useDayEntries, useFoodSearch, useRecentFoods } from '@/hooks/use-diary';
import { useTheme } from '@/hooks/use-theme';
import { MEALS, entryToFoodItem, localDate, type FoodEntry, type MealType } from '@/lib/diary';
import type { FoodItem } from '@/lib/food';
import { formatNumber } from '@/lib/nutrition';

function openAddScreen(item: FoodItem, meal: MealType) {
  router.push({ pathname: '/log/add', params: { item: JSON.stringify(item), meal } });
}

function openEntry(entry: FoodEntry) {
  router.push({
    pathname: entry.amountG ? '/log/add' : '/log/manual',
    params: { entryId: entry.id },
  });
}

function entrySubtitle(entry: FoodEntry) {
  const amount = entry.amountLabel ?? (entry.amountG ? `${entry.amountG} g` : '');
  return [entry.brand, amount].filter(Boolean).join(' · ');
}

export default function LogScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ meal?: MealType }>();
  const [meal, setMeal] = useState<MealType>(params.meal ?? mealForNow());
  const [text, setText] = useState('');
  const search = useFoodSearch(text);
  const today = localDate();
  const entries = useDayEntries(today);
  const recent = useRecentFoods();

  // Opening Log from a meal on the Today screen selects that meal.
  const [lastMealParam, setLastMealParam] = useState(params.meal);
  if (params.meal !== lastMealParam) {
    setLastMealParam(params.meal);
    if (params.meal) setMeal(params.meal);
  }

  const mealLabel = MEALS.find((m) => m.value === meal)!.label;
  const mealEntries = (entries.data ?? []).filter((e) => e.meal === meal);
  const searching = text.trim().length >= 2;

  return (
    <Screen title="Log food">
      <MealPicker value={meal} onChange={setMeal} />

      <Glass radius={Radius.md} style={styles.search}>
        <Icon name="search" size={17} color="textTertiary" />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Search foods, e.g. banana"
          placeholderTextColor={theme.textTertiary}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {(search.isTyping || search.australian.isFetching || search.packaged.isFetching) && searching && (
          <ActivityIndicator color={theme.textTertiary} />
        )}
      </Glass>

      {searching ? (
        <SearchResults search={search} meal={meal} />
      ) : (
        <>
          <Pressable
            onPress={() => router.push({ pathname: '/log/scan', params: { meal } })}
            accessibilityRole="button">
            <Card style={styles.scanCard}>
              <View style={[styles.scanIcon, { backgroundColor: theme.fill }]}>
                <Icon name="sparkles" size={20} color="accent" />
              </View>
              <View style={styles.flex}>
                <Text variant="bodyStrong">Scan a meal with AI</Text>
                <Text variant="caption" color="textSecondary">
                  Snap a photo and check the estimate
                </Text>
              </View>
              <Icon name="camera" size={18} color="textTertiary" />
            </Card>
          </Pressable>

          <Pressable onPress={() => router.push('/log/plan')} accessibilityRole="button">
            <Card style={styles.scanCard}>
              <View style={[styles.scanIcon, { backgroundColor: theme.fill }]}>
                <Icon name="calendar" size={20} color="accent" />
              </View>
              <View style={styles.flex}>
                <Text variant="bodyStrong">Meal plan</Text>
                <Text variant="caption" color="textSecondary">
                  A week of meals that fit your targets, plus a shopping list
                </Text>
              </View>
              <Icon name="chevronRight" size={13} color="textTertiary" />
            </Card>
          </Pressable>

          <SectionHeader title={`${mealLabel} today`} />
          {mealEntries.length > 0 ? (
            <Card flush>
              {mealEntries.map((entry, index) => (
                <ListRow
                  key={entry.id}
                  title={entry.name}
                  subtitle={entrySubtitle(entry)}
                  value={`${formatNumber(Math.round(entry.calories))} kcal`}
                  onPress={() => openEntry(entry)}
                  divider={index < mealEntries.length - 1}
                />
              ))}
            </Card>
          ) : (
            <Text variant="callout" color="textSecondary">
              Nothing logged for {mealLabel.toLowerCase()} yet. Search above to add food.
            </Text>
          )}

          {(recent.data?.length ?? 0) > 0 && (
            <>
              <SectionHeader title="Recent" />
              <Card flush>
                {(recent.data ?? []).slice(0, 8).map((entry, index, list) => {
                  const item = entryToFoodItem(entry);
                  return (
                    <ListRow
                      key={entry.id}
                      title={entry.name}
                      subtitle={entrySubtitle(entry)}
                      value={`${formatNumber(Math.round(entry.calories))} kcal`}
                      onPress={() =>
                        item
                          ? openAddScreen(item, meal)
                          : router.push({ pathname: '/log/manual', params: { copyFrom: entry.id, meal } })
                      }
                      divider={index < list.length - 1}
                    />
                  );
                })}
              </Card>
            </>
          )}

          <Button
            title="Add food manually"
            icon="plus"
            variant="secondary"
            onPress={() => router.push({ pathname: '/log/manual', params: { meal } })}
          />
        </>
      )}
    </Screen>
  );
}

function SearchResults({ search, meal }: { search: ReturnType<typeof useFoodSearch>; meal: MealType }) {
  const { australian, packaged } = search;
  const nothingFound =
    !search.isTyping &&
    australian.isSuccess &&
    (australian.data?.length ?? 0) === 0 &&
    !packaged.isFetching &&
    (packaged.data?.length ?? 0) === 0;

  return (
    <>
      <ResultSection title="Australian foods" query={australian} meal={meal} />
      <ResultSection title="Packaged products" query={packaged} meal={meal} packaged />
      {nothingFound && (
        <Text variant="callout" color="textSecondary">
          No matches. Try a simpler word, like “yoghurt” instead of “Greek yoghurt pot”.
        </Text>
      )}
      <Button
        title="Can’t find it? Add manually"
        icon="plus"
        variant="secondary"
        onPress={() => router.push({ pathname: '/log/manual', params: { meal } })}
      />
    </>
  );
}

function ResultSection({
  title,
  query,
  meal,
  packaged,
}: {
  title: string;
  query: { data?: FoodItem[]; isError: boolean; isFetching: boolean };
  meal: MealType;
  packaged?: boolean;
}) {
  if (query.isError) {
    return (
      <Text variant="caption" color="textSecondary">
        {packaged
          ? 'Packaged product search is busy right now. Try again in a minute.'
          : 'Couldn’t search foods. Check your connection.'}
      </Text>
    );
  }
  const items = query.data ?? [];
  if (items.length === 0) return null;
  return (
    <>
      <SectionHeader title={title} />
      <Card flush>
        {items.map((item, index) => (
          <ListRow
            key={`${item.source}-${item.sourceId}`}
            title={item.name}
            subtitle={[item.brand, `${formatNumber(Math.round(item.per100g.calories))} kcal per 100 g`]
              .filter(Boolean)
              .join(' · ')}
            onPress={() => openAddScreen(item, meal)}
            divider={index < items.length - 1}
          />
        ))}
      </Card>
      {packaged && (
        <Text variant="caption" color="textTertiary">
          Product data from Open Food Facts, a community database. Check it against the label.
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    ...Type.body,
    paddingVertical: Spacing[3],
    // Keeps the text above the glass blur layer in web browsers.
    position: 'relative',
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  scanIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
});
