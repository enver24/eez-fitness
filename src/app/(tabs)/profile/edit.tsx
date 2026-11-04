import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { AboutYouFields, ActivityFields, DietFields, GoalFields } from '@/components/profile-fields';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { targetsFor, type Profile } from '@/lib/profile';
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

type Section = 'details' | 'goal' | 'diet';

const SECTIONS: Record<Section, { title: string; validate: (d: ProfileDraft) => DraftErrors }> = {
  details: {
    title: 'Your details',
    validate: (d) => ({ ...validateAboutYou(d), ...validateActivity(d) }),
  },
  goal: { title: 'Your goal', validate: validateGoal },
  diet: { title: 'Diet and allergies', validate: validateDiet },
};

/** Edit one part of the profile: /profile/edit?section=details|goal|diet */
export default function EditProfileScreen() {
  const { section = 'details' } = useLocalSearchParams<{ section?: Section }>();
  const { data: profile } = useProfile();
  if (!profile) return null;
  return <EditForm key={section} section={section} profile={profile} />;
}

function EditForm({ section, profile }: { section: Section; profile: Profile }) {
  const updateProfile = useUpdateProfile();
  const [draft, setDraft] = useState(() => draftFromProfile(profile));
  const [errors, setErrors] = useState<DraftErrors>({});
  const { title, validate } = SECTIONS[section];
  const onChange = (changes: Partial<ProfileDraft>) => setDraft({ ...draft, ...changes });

  function save() {
    const sectionErrors = validate(draft);
    setErrors(sectionErrors);
    if (Object.keys(sectionErrors).length > 0) return;

    const update = draftToUpdate(draft);
    // Details and goal affect calorie needs, so recalculate targets.
    updateProfile.mutate(
      { ...update, ...(targetsFor({ ...profile, ...update }) ?? {}) },
      { onSuccess: () => router.back() },
    );
  }

  return (
    <Screen title={title} showBack>
      {section === 'details' && (
        <>
          <AboutYouFields draft={draft} onChange={onChange} errors={errors} />
          <ActivityFields draft={draft} onChange={onChange} errors={errors} />
        </>
      )}
      {section === 'goal' && <GoalFields draft={draft} onChange={onChange} errors={errors} />}
      {section === 'diet' && <DietFields draft={draft} onChange={onChange} errors={errors} />}

      {section !== 'diet' && (
        <Text variant="caption" color="textSecondary">
          Saving updates your daily calorie and macro targets.
        </Text>
      )}
      {updateProfile.error && (
        <Text variant="callout" color="danger">
          Couldn’t save. Check your connection and try again.
        </Text>
      )}
      <Button title={updateProfile.isPending ? 'Saving…' : 'Save'} onPress={save} disabled={updateProfile.isPending} />
    </Screen>
  );
}
