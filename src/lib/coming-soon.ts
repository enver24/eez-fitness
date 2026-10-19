import { Alert } from 'react-native';

/** Temporary handler for buttons whose feature is built in a later stage. */
export function comingSoon(feature: string, stage: number) {
  Alert.alert(feature, `This arrives in Stage ${stage}.`);
}
