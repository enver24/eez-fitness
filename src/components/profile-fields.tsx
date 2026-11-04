/**
 * The groups of questions used both in onboarding and in Profile → Edit.
 * Each takes the current draft and reports changes back.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChoiceCards, ChoiceChips } from '@/components/ui/choice';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import {
  ACTIVITY_OPTIONS,
  ALLERGY_OPTIONS,
  DIET_OPTIONS,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  SEX_OPTIONS,
} from '@/lib/profile';
import type { DraftErrors, ProfileDraft } from '@/lib/profile-draft';

type FieldsProps = {
  draft: ProfileDraft;
  onChange: (changes: Partial<ProfileDraft>) => void;
  errors: DraftErrors;
};

/** A label above a set of choices, with an optional error underneath. */
function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      {hint && (
        <Text variant="caption" color="textTertiary">
          {hint}
        </Text>
      )}
      {children}
      {error && (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      )}
    </View>
  );
}

export function AboutYouFields({ draft, onChange, errors }: FieldsProps) {
  return (
    <View style={styles.group}>
      <TextField
        label="First name"
        value={draft.firstName}
        onChangeText={(firstName) => onChange({ firstName })}
        autoComplete="given-name"
        error={errors.firstName}
      />
      <TextField
        label="Year of birth"
        value={draft.birthYear}
        onChangeText={(birthYear) => onChange({ birthYear })}
        placeholder="1998"
        keyboardType="number-pad"
        maxLength={4}
        error={errors.birthYear}
      />
      <Field label="Sex" hint="Used only to estimate your calorie needs." error={errors.sex}>
        <ChoiceChips
          options={SEX_OPTIONS}
          selected={draft.sex ? [draft.sex] : []}
          onChange={([sex]) => onChange({ sex })}
        />
      </Field>
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField
            label="Height (cm)"
            value={draft.heightCm}
            onChangeText={(heightCm) => onChange({ heightCm })}
            placeholder="178"
            keyboardType="decimal-pad"
            error={errors.heightCm}
          />
        </View>
        <View style={styles.flex}>
          <TextField
            label="Weight (kg)"
            value={draft.weightKg}
            onChangeText={(weightKg) => onChange({ weightKg })}
            placeholder="80.5"
            keyboardType="decimal-pad"
            error={errors.weightKg}
          />
        </View>
      </View>
      <TextField
        label="Body fat % (optional)"
        value={draft.bodyFatPercent}
        onChangeText={(bodyFatPercent) => onChange({ bodyFatPercent })}
        placeholder="Leave blank if unsure"
        keyboardType="decimal-pad"
        error={errors.bodyFatPercent}
      />
    </View>
  );
}

export function GoalFields({ draft, onChange, errors }: FieldsProps) {
  return (
    <View style={styles.group}>
      <Field label="Main goal" error={errors.goal}>
        <ChoiceCards options={GOAL_OPTIONS} selected={draft.goal} onChange={(goal) => onChange({ goal })} />
      </Field>
      <TextField
        label="Goal weight in kg (optional)"
        value={draft.goalWeightKg}
        onChangeText={(goalWeightKg) => onChange({ goalWeightKg })}
        placeholder="75"
        keyboardType="decimal-pad"
        error={errors.goalWeightKg}
      />
    </View>
  );
}

export function ActivityFields({ draft, onChange, errors }: FieldsProps) {
  return (
    <View style={styles.group}>
      <Field label="Daily activity" error={errors.activityLevel}>
        <ChoiceCards
          options={ACTIVITY_OPTIONS}
          selected={draft.activityLevel}
          onChange={(activityLevel) => onChange({ activityLevel })}
        />
      </Field>
      <Field label="Training experience" error={errors.experience}>
        <ChoiceChips
          options={EXPERIENCE_OPTIONS}
          selected={draft.experience ? [draft.experience] : []}
          onChange={([experience]) => onChange({ experience })}
        />
      </Field>
    </View>
  );
}

export function DietFields({ draft, onChange }: FieldsProps) {
  return (
    <View style={styles.group}>
      <Field label="Diet" hint="Choose any that apply.">
        <ChoiceChips
          options={DIET_OPTIONS}
          selected={draft.dietaryPreferences}
          multiple
          onChange={(dietaryPreferences) => {
            // "No preference" can't be combined with anything else.
            const last = dietaryPreferences[dietaryPreferences.length - 1];
            onChange({
              dietaryPreferences:
                last === 'No preference'
                  ? ['No preference']
                  : dietaryPreferences.filter((d) => d !== 'No preference'),
            });
          }}
        />
      </Field>
      <Field label="Allergies and intolerances" hint="Choose any that apply.">
        <ChoiceChips
          options={ALLERGY_OPTIONS}
          selected={draft.allergies}
          multiple
          onChange={(allergies) => onChange({ allergies })}
        />
      </Field>
      <TextField
        label="Other allergies (optional)"
        value={draft.otherAllergies}
        onChangeText={(otherAllergies) => onChange({ otherAllergies })}
        placeholder="Kiwi, mustard"
      />
      <Notice>
        EEZ Fitness uses this to tailor suggestions, but it can make mistakes. Always check food
        labels and ingredients yourself if you have an allergy.
      </Notice>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing[4],
  },
  field: {
    gap: Spacing[2],
  },
  row: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  flex: {
    flex: 1,
  },
});
