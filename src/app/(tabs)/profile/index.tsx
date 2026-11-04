import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { getTheme, withAlpha } from '@/constants/themes';
import { useProfile } from '@/hooks/use-profile';
import { comingSoon } from '@/lib/coming-soon';
import { formatNumber } from '@/lib/nutrition';
import { ACTIVITY_OPTIONS, GOAL_OPTIONS, labelFor } from '@/lib/profile';
import { ageFromBirthYear } from '@/lib/targets';
import { supabase } from '@/lib/supabase';
import { useAppearance } from '@/providers/appearance';
import { useAuth } from '@/providers/auth';

const MODE_LABELS = { system: 'Automatic', light: 'Light', dark: 'Dark' } as const;

function confirmSignOut() {
  const signOut = () => supabase.auth.signOut();
  // Alert buttons don't work in web browsers, so the web preview signs out directly.
  if (Platform.OS === 'web') {
    signOut();
    return;
  }
  Alert.alert('Sign out?', 'You can log back in any time.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: signOut },
  ]);
}

export default function ProfileScreen() {
  const { colors, themeId, mode } = useAppearance();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  if (!profile) return null;

  const name = profile.first_name || 'You';
  const details = [
    profile.birth_year && `${ageFromBirthYear(profile.birth_year)} yrs`,
    profile.height_cm && `${profile.height_cm} cm`,
    profile.weight_kg && `${profile.weight_kg} kg`,
    labelFor(ACTIVITY_OPTIONS, profile.activity_level),
  ]
    .filter(Boolean)
    .join(' · ');
  const goal =
    labelFor(GOAL_OPTIONS, profile.goal) +
    (profile.goal_weight_kg ? ` · ${profile.goal_weight_kg} kg` : '');
  const food = [...profile.dietary_preferences, ...profile.allergies.map((a) => `no ${a.toLowerCase()}`)];

  return (
    <Screen title="Profile">
      {/* Who is signed in */}
      <Card style={styles.userCard}>
        <View style={[styles.avatar, { backgroundColor: withAlpha(colors.accent, 0.2) }]}>
          <Text variant="hero" color="accent" style={styles.avatarLetter}>
            {name.charAt(0)}
          </Text>
        </View>
        <View style={styles.userText}>
          <Text variant="heading">{name}</Text>
          <Text variant="callout" color="textSecondary" numberOfLines={1}>
            {session?.user.email}
          </Text>
        </View>
      </Card>

      <SectionHeader title="Your plan" />
      <Card flush>
        <ListRow
          icon="flame"
          title="Daily targets"
          subtitle={
            profile.calorie_target
              ? `${formatNumber(profile.calorie_target)} kcal · P ${profile.protein_target_g} g · C ${profile.carbs_target_g} g · F ${profile.fat_target_g} g`
              : 'Add your details to calculate'
          }
          divider
        />
        <ListRow icon="target" title="Goal" subtitle={goal} onPress={() => router.push('/profile/edit?section=goal')} divider />
        <ListRow icon="ruler" title="Your details" subtitle={details} onPress={() => router.push('/profile/edit?section=details')} divider />
        <ListRow
          icon="leaf"
          title="Diet and allergies"
          subtitle={food.length ? food.join(', ') : 'No preferences set'}
          onPress={() => router.push('/profile/edit?section=diet')}
        />
      </Card>

      <SectionHeader title="App" />
      <Card flush>
        <ListRow
          icon="palette"
          title="Appearance"
          subtitle={`${getTheme(themeId).name} · ${MODE_LABELS[mode]}`}
          onPress={() => router.push('/profile/appearance')}
        />
      </Card>

      <SectionHeader title="Privacy and data" />
      <Card flush>
        <ListRow icon="lock" title="Privacy policy" onPress={() => comingSoon('Privacy policy', 9)} divider />
        <ListRow icon="download" title="Export my data" onPress={() => comingSoon('Data export', 9)} divider />
        <ListRow icon="logout" title="Sign out" onPress={confirmSignOut} divider />
        <ListRow icon="trash" title="Delete account" destructive onPress={() => router.push('/profile/delete-account')} />
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
  avatarLetter: {
    fontSize: 26,
    lineHeight: 30,
  },
  userText: {
    flex: 1,
    gap: 2,
  },
});
