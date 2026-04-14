import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

type SupabaseExtra = { supabaseUrl?: string; supabaseAnonKey?: string };

function fromExpoExtra(): { url: string; anonKey: string } {
  const extra = Constants.expoConfig?.extra as SupabaseExtra | undefined;
  return {
    url: String(extra?.supabaseUrl ?? '').trim(),
    anonKey: String(extra?.supabaseAnonKey ?? '').trim(),
  };
}

const extra = fromExpoExtra();
const envUrl = String(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const envKey = String(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
// Prefer Metro-inlined EXPO_PUBLIC_* when set; otherwise use values baked into app.config → extra.
const url = envUrl || extra.url;
const anonKey = envKey || extra.anonKey;

const missingConfig =
  !url ||
  !anonKey ||
  url.includes('YOUR-PROJECT-REF') ||
  anonKey.includes('YOUR-ANON-PUBLIC-KEY') ||
  url === 'http://invalid.local';

if (missingConfig) {
  console.warn(
    '[AttendEase] Supabase config missing or invalid. Set EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env, then rebuild the APK.',
  );
}

const INVALID_CONFIG_MESSAGE =
  'App setup is incomplete: Supabase keys were not bundled in this build. ' +
  'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env and rebuild the APK.';

export function getSupabaseConfigError(): string | null {
  return missingConfig ? INVALID_CONFIG_MESSAGE : null;
}

// Never crash app startup on missing config. Use safe placeholders so screens can
// render and show actionable setup errors instead of hard-crashing on launch.
const clientUrl = url || 'http://invalid.local';
const clientKey = anonKey || 'missing';

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * User id for database writes. Refreshes the session first so the access token matches auth.users,
 * then falls back to the stored session. Avoids auth.getUser(), which hits the Auth API and often
 * surfaces "User from sub claim in JWT does not exist" for recoverable stale tokens.
 */
export async function getSessionUserIdForWrite(): Promise<string> {
  const { data: refreshed, error: refErr } = await supabase.auth.refreshSession();
  if (!refErr && refreshed.session?.user?.id) {
    return refreshed.session.user.id;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;
  throw new Error(refErr?.message ?? 'Not signed in. Please sign out and sign in again.');
}
