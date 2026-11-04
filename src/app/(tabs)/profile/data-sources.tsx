import { Linking, Pressable } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

function Link({ url, children }: { url: string; children: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(url)} accessibilityRole="link">
      <Text variant="callout" color="accent" style={{ fontWeight: '700' }}>
        {children}
      </Text>
    </Pressable>
  );
}

/** Credits and licences for the food data, as the data providers require. */
export default function DataSourcesScreen() {
  return (
    <Screen title="Food data" showBack>
      <Card>
        <Text variant="heading">Australian Food Composition Database</Text>
        <Text variant="callout" color="textSecondary">
          Whole and generic foods are based on Australian data from the Australian Food Composition
          Database (AFCD), Release 3, © Food Standards Australia New Zealand (FSANZ). Licensed under
          Creative Commons Attribution-ShareAlike 3.0 Australia. EEZ Fitness converts energy from kJ
          to kcal and rounds values to one decimal place. EEZ Fitness is not endorsed by or connected
          with FSANZ.
        </Text>
        <Text variant="caption" color="textSecondary">
          Limitation of data: There are limitations associated with food composition databases.
          Food composition data used in the database or databases may represent an average of the
          nutrient content of a particular sample of foods and ingredients, determined at a
          particular time. The nutrient composition of foods and ingredients can vary substantially
          between batches and brands because of a number of factors, including changes in season,
          processing practices and ingredient source, and methods of calculation.
        </Text>
        <Link url="http://creativecommons.org/licenses/by-sa/3.0/au/deed.en">View the licence</Link>
        <Link url="https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd">
          About the AFCD
        </Link>
      </Card>

      <Card>
        <Text variant="heading">Open Food Facts</Text>
        <Text variant="callout" color="textSecondary">
          Packaged product data comes from Open Food Facts, a free, community-built database of food
          products. Data is available under the Open Database License (ODbL). Because it’s
          contributed by volunteers, check nutrition against the product label.
        </Text>
        <Link url="https://world.openfoodfacts.org">openfoodfacts.org</Link>
        <Link url="https://opendatacommons.org/licenses/odbl/1-0/">View the licence</Link>
      </Card>
    </Screen>
  );
}
