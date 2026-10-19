import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { sampleTargets, sampleUser } from '@/data/sample';
import { useTheme } from '@/hooks/use-theme';
import { comingSoon } from '@/lib/coming-soon';
import { formatNumber } from '@/lib/nutrition';

export default function ProfileScreen() {
  const theme = useTheme();

  return (
    <Screen title="Profile">
      {/* Who is signed in */}
      <Card style={styles.userCard}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <Text variant="title" color="accent">
            {sampleUser.firstName.charAt(0)}
          </Text>
        </View>
        <View style={styles.userText}>
          <Text variant="headline">{sampleUser.firstName}</Text>
          <Text variant="callout" color="textSecondary">
            {sampleUser.email}
          </Text>
        </View>
      </Card>

      <SectionHeader title="Your plan" />
      <Card flush>
        <ListRow icon="target" title="Goal" subtitle={sampleUser.goal} onPress={() => comingSoon('Edit goal', 4)} divider />
        <ListRow
          icon="flame"
          title="Daily targets"
          subtitle={`${formatNumber(sampleTargets.calories)} kcal · P ${sampleTargets.protein} g · C ${sampleTargets.carbs} g · F ${sampleTargets.fat} g`}
          onPress={() => comingSoon('Edit targets', 4)}
          divider
        />
        <ListRow icon="ruler" title="Personal details" subtitle="Age, height, weight, activity" onPress={() => comingSoon('Edit details', 4)} divider />
        <ListRow icon="leaf" title="Diet and allergies" subtitle="Preferences and foods to avoid" onPress={() => comingSoon('Diet and allergies', 4)} />
      </Card>

      <SectionHeader title="Privacy and data" />
      <Card flush>
        <ListRow icon="lock" title="Privacy policy" onPress={() => comingSoon('Privacy policy', 9)} divider />
        <ListRow icon="download" title="Export my data" onPress={() => comingSoon('Data export', 9)} divider />
        <ListRow icon="logout" title="Sign out" onPress={() => comingSoon('Sign out', 3)} divider />
        <ListRow icon="trash" title="Delete account" destructive onPress={() => comingSoon('Account deletion', 4)} />
      </Card>

      <Notice>
        EEZ Fitness gives general information only. It is not medical or nutritional advice and is
        not a substitute for a doctor, dietitian or other qualified health professional.
      </Notice>

      <Text variant="caption" color="textTertiary" align="center">
        EEZ Fitness {Constants.expoConfig?.version} · Private beta
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userText: {
    flex: 1,
    gap: 2,
  },
});
