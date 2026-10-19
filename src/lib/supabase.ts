/**
 * The app's connection to Supabase (accounts and database).
 *
 * Security notes:
 * - Only the PUBLIC publishable key is used here. Every table is protected
 *   by Row Level Security, so this key alone can't read anyone's data.
 * - The login session is encrypted before it's stored on the phone. The
 *   encryption key lives in the iPhone Keychain (expo-secure-store).
 *   This follows Supabase's official Expo guide ("LargeSecureStore"),
 *   needed because the Keychain only holds small values.
 */

import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as aesjs from 'aes-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured =
  !!supabaseUrl?.startsWith('https://') && !!supabasePublishableKey?.startsWith('sb_publishable_');

/** Stores the session encrypted in AsyncStorage, with the key in the Keychain. */
class LargeSecureStore {
  private async encrypt(key: string, value: string) {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async decrypt(key: string, value: string) {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return encryptionKeyHex;
    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string) {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return encrypted;
    return await this.decrypt(key, encrypted);
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }

  async setItem(key: string, value: string) {
    const encrypted = await this.encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }
}

export const supabase = createClient(
  // Placeholders keep the app from crashing before .env is filled in;
  // isSupabaseConfigured is false in that case and the app shows a warning.
  isSupabaseConfigured ? supabaseUrl! : 'https://not-configured.supabase.co',
  isSupabaseConfigured ? supabasePublishableKey! : 'not-configured',
  {
    auth: {
      // The web preview has no Keychain, so it uses the browser's storage.
      storage: Platform.OS === 'web' ? AsyncStorage : new LargeSecureStore(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Keep the login fresh only while the app is open, as Supabase recommends.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
