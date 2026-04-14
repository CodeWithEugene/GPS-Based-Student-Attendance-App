import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { getSupabaseConfigError, supabase } from './supabase';
import { repo } from '../data/repo';
import { User } from '../data/types';
import { ensureProfileForSession, isAllowedSignInEmail } from './auth-helpers';
import { markPermissionOnboardingComplete } from './onboarding-keys';
import { oauthErrorLooksLikeUnsupportedEmail, parseOAuthRedirectUrl } from './oauth-parse';

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
export type SignInWithGoogleResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'unsupported_email'; email: string }
  | { ok: false; reason: 'other'; message: string };

export async function signInWithGoogle(): Promise<SignInWithGoogleResult> {
  const configError = getSupabaseConfigError();
  if (configError) return { ok: false, reason: 'other', message: configError };

  const redirectTo = Linking.createURL('auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return {
      ok: false,
      reason: 'other',
      message: error?.message ?? 'Could not start Google sign-in. Check Supabase OAuth redirect settings.',
    };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    return { ok: false, reason: 'other', message: 'Google sign-in was cancelled.' };
  }

  const parsed = parseOAuthRedirectUrl(result.url);
  if (parsed.error) {
    const desc = parsed.errorDescription || '';
    if (oauthErrorLooksLikeUnsupportedEmail(parsed.error, desc)) {
      return { ok: false, reason: 'unsupported_email', email: '' };
    }
    return {
      ok: false,
      reason: 'other',
      message: desc || `Google sign-in failed (${parsed.error}).`,
    };
  }

  const access_token = parsed.access_token;
  const refresh_token = parsed.refresh_token;
  if (!access_token || !refresh_token) {
    return { ok: false, reason: 'other', message: 'Google did not return valid tokens.' };
  }

  const { data: sessionData, error: setErr } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (setErr || !sessionData.user?.email) {
    return { ok: false, reason: 'other', message: setErr?.message ?? 'Could not establish session.' };
  }

  const email = sessionData.user.email.toLowerCase();
  if (!isAllowedSignInEmail(email)) {
    await supabase.auth.signOut();
    return { ok: false, reason: 'unsupported_email', email };
  }

  try {
    const user = await ensureProfileForSession(email, sessionData.user.id);
    await repo.setCurrentUser(user);
    await markPermissionOnboardingComplete();
    return { ok: true, user };
  } catch (e: any) {
    await supabase.auth.signOut();
    return { ok: false, reason: 'other', message: e?.message ?? 'Could not set up your profile.' };
  }
}
