import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';

const UPDATED = '4 November 2026';
const CONTACT = process.env.EXPO_PUBLIC_PRIVACY_CONTACT_EMAIL;

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: 'Who we are',
    paragraphs: [
      'EEZ Fitness is a personal project in private beta, built and run by Enver Balabanel in Australia. This policy explains what the app collects, why, and the choices you have.',
    ],
  },
  {
    title: 'What we collect',
    paragraphs: [
      'Account details: your first name, email address and password. Your password is stored only as a secure hash, so nobody can read it.',
      'Health and fitness information you enter: year of birth, sex, height, weight, body fat, body measurements, goals, activity level, training experience, diet and allergies, your food diary, and your workouts. This is sensitive information, and we only collect it with the consent you gave when you signed up.',
      'Meal photos: if you use the AI scanner, the photo is sent to analyse it and is then discarded. EEZ Fitness does not store meal photos.',
      'Progress photos: only if you choose to turn them on. They’re stored privately so only you can see them, with any notes you add, and are never sent to AI. You can delete them at any time.',
      'Settings such as your colour theme are stored only on your phone.',
    ],
  },
  {
    title: 'Why we use it',
    paragraphs: [
      'To run the app: to calculate your targets, show your diary and progress, and keep your account secure. We don’t sell your information, show ads, or use it for marketing.',
    ],
  },
  {
    title: 'Where it’s stored and who processes it',
    paragraphs: [
      'Your account and data are stored with Supabase, our database provider, on servers in Singapore during the beta. Data is encrypted in transit and access is restricted so that each user can only see their own information.',
      'If AI meal scanning is switched on, meal photos are sent to Anthropic (based in the United States) to estimate nutrition. Anthropic does not use this data to train its models by default.',
      'Food searches are sent to Open Food Facts to find packaged products. Only the search words are sent, never your identity.',
    ],
  },
  {
    title: 'How long we keep it',
    paragraphs: [
      'We keep your information while your account exists. When you delete your account in Profile → Delete account, your account and all of its data, including progress photos, are permanently deleted straight away. You can also delete any progress photo, or all of them, at any time.',
    ],
  },
  {
    title: 'Your choices and rights',
    paragraphs: [
      'You can view and correct your details in the app, download a copy of all your data with Profile → Export my data, and delete your account at any time.',
      'Under the Australian Privacy Principles you can ask us for access to or correction of your information, or make a complaint. If you’re not satisfied with our response, you can contact the Office of the Australian Information Commissioner (oaic.gov.au).',
    ],
  },
  {
    title: 'Not medical advice',
    paragraphs: [
      'EEZ Fitness gives general information only. It is not medical or nutritional advice and is not a substitute for a qualified health professional.',
    ],
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <Screen eyebrow={`Updated ${UPDATED}`} title="Privacy" showBack>
      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <Text variant="heading">{section.title}</Text>
          <View style={styles.paragraphs}>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph.slice(0, 30)} variant="callout" color="textSecondary">
                {paragraph}
              </Text>
            ))}
          </View>
        </Card>
      ))}
      <Card>
        <Text variant="heading">Contact</Text>
        <Text variant="callout" color="textSecondary">
          {CONTACT
            ? `For privacy questions or requests, email ${CONTACT}.`
            : 'For privacy questions or requests, contact the developer through your beta invitation.'}
        </Text>
      </Card>
      <Notice>
        This policy is for the private beta and will be updated before EEZ Fitness is released publicly.
      </Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  paragraphs: {
    gap: Spacing[2],
  },
});
