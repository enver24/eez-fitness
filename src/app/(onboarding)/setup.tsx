import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AboutYouFields,
  ActivityFields,
  DietFields,
  GoalFields,
} from '@/components/profile-fields';
import { TargetsSummary } from '@/components/targets-summary';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { targetsFor } from '@/lib/profile';
import {
  draftFromProfile,
  draftToUpdate,
  validateAboutYou,
  validateActivity,
  validateDiet,
  validateGoal,
  type DraftErrors,
  type ProfileDraft,
} from '@/lib/profile-draft';

const STEPS = [
  { title: 'About you', intro: 'A few details so we can estimate your daily needs.', validate: validateAboutYou, Fields: AboutYouFields },
  { title: 'Your goal', intro: 'What are you working towards?', validate: validateGoal, Fields: GoalFields },
  { title: 'Activity', intro: 'How active is a typical week?', validate: validateActivity, Fields: ActivityFields },
  { title: 'Food', intro: 'Your diet and anything you can’t eat.', validate: validateDiet, Fields: DietFields },
] as const;

/** Step-by-step profile setup shown once after sign-up. */
export default function OnboardingScreen() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  // The root layout only shows onboarding once the profile has loaded.
  const [draft, setDraft] = useState<ProfileDraft>(() => draftFromProfile(profile!));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<DraftErrors>({});

  const isSummary = step === STEPS.length;
  const update = draftToUpdate(draft);
  const targets = isSummary ? targetsFor(update) : null;

  function next() {
    const stepErrors = STEPS[step].validate(draft);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) setStep(step + 1);
  }

  function finish() {
    if (!targets) return;
    updateProfile.mutate({
      ...update,
      ...targets,
      onboarding_completed_at: new Date().toISOString(),
    });
    // Once saved, the app opens automatically.
  }

  const onBack = step > 0 ? () => setStep(step - 1) : undefined;

  if (isSummary) {
    return (
      <Screen eyebrow="All set" title="Your targets" onBack={onBack}>
        <Text variant="body" color="textSecondary">
          Based on your details, here’s a starting point for each day. You can change your details
          any time in Profile.
        </Text>
        {targets && (
          <TargetsSummary
            calories={targets.calorie_target!}
            proteinG={targets.protein_target_g!}
            carbsG={targets.carbs_target_g!}
            fatG={targets.fat_target_g!}
          />
        )}
        <Notice>
          These are estimates from a standard formula, not medical or nutritional advice. If you
          have a health condition, are pregnant, or have a history of disordered eating, talk to a
          doctor or dietitian before changing how you eat.
        </Notice>
        {updateProfile.error && (
          <Text variant="callout" color="danger">
            Couldn’t save your profile. Check your connection and try again.
          </Text>
        )}
        <Button
          title={updateProfile.isPending ? 'Saving…' : 'Start using EEZ'}
          onPress={finish}
          disabled={updateProfile.isPending}
        />
      </Screen>
    );
  }

  const { title, intro, Fields } = STEPS[step];
  return (
    <Screen eyebrow={`Step ${step + 1} of ${STEPS.length}`} title={title} onBack={onBack}>
      <StepDots current={step} total={STEPS.length + 1} />
      <Text variant="body" color="textSecondary">
        {intro}
      </Text>
      <Fields draft={draft} errors={errors} onChange={(changes) => setDraft({ ...draft, ...changes })} />
      <Button title="Continue" onPress={next} />
    </Screen>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  const theme = useTheme();
  return (
    <View style={styles.dots} accessibilityElementsHidden>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, { backgroundColor: index <= current ? theme.accent : theme.fill }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    gap: Spacing[1],
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
