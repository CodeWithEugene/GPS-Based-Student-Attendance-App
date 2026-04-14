import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  console.warn(
    '[AttendEase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example → .env and paste your Supabase keys.',
  );
}

export const supabase = createClient(url ?? 'http://invalid.local', anonKey ?? 'missing', {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
