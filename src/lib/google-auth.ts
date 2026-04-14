import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { getSupabaseConfigError, supabase } from './supabase';
import { repo } from '../data/repo';
import { User } from '../data/types';
import { ensureProfileForSession, isJkuatEmail } from './auth-helpers';

WebBrowser.maybeCompleteAuthSession();

/**
 * Sign in with Google via Supabase OAuth.
 *
 * Flow:
 * 1. Ask Supabase for the OAuth URL (skipBrowserRedirect so we handle it).
 * 2. Open it in an in-app browser; wait for the redirect back to our scheme.
 * 3. Parse the tokens from the redirect URL, hand them to supabase.auth.setSession.
 * 4. Look up the matching JKUAT profile by email and link it to the auth user.
 */
export async function signInWithGoogle(): Promise<
  | { ok: true; user: User }
  | { ok: false; error: string }
> {
  const configError = getSupabaseConfigError();
  if (configError) return { ok: false, error: configError };

  const redirectTo = Linking.createURL('auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return {
      ok: false,
      error: error?.message ?? 'Could not start Google sign-in. Check Supabase OAuth redirect settings.',
    };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    return { ok: false, error: 'Google sign-in was cancelled.' };
  }

  // Supabase returns tokens in the URL fragment (#access_token=...&refresh_token=...)
  const fragment = result.url.split('#')[1] ?? result.url.split('?')[1] ?? '';
  const params = new URLSearchParams(fragment);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) {
    return { ok: false, error: 'Google did not return valid tokens.' };
  }

  const { data: sessionData, error: setErr } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (setErr || !sessionData.user?.email) {
    return { ok: false, error: setErr?.message ?? 'Could not establish session.' };
  }

  const email = sessionData.user.email.toLowerCase();
  if (!isJkuatEmail(email)) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: `Access restricted — ${email} is not a JKUAT address. Use @students.jkuat.ac.ke or @jkuat.ac.ke.`,
    };
  }

  try {
    const user = await ensureProfileForSession(email, sessionData.user.id);
    await repo.setCurrentUser(user);
    return { ok: true, user };
  } catch (e: any) {
    await supabase.auth.signOut();
    return { ok: false, error: e?.message ?? 'Could not set up your profile.' };
  }
}
