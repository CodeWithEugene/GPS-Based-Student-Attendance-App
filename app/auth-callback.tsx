import * as Linking from 'expo-linking';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  oauthErrorLooksLikeUnsupportedEmail,
  parseOAuthRedirectUrl,
} from '../src/lib/oauth-parse';
import { colors } from '../src/theme';

function firstParam(v: string | string[] | undefined): string {
  if (v == null) return '';
  return Array.isArray(v) ? String(v[0] ?? '') : String(v);
}

function decodeDesc(raw: string): string {
  if (!raw) return '';
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '));
  } catch {
    return raw;
  }
}

/**
 * Handles `gpsattendance://auth-callback?...` when Supabase returns OAuth errors in the query string.
 * Without this route, Expo Router shows “Unmatched Route”.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams<{
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const handled = useRef(false);
  const linkingSub = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let alive = true;
    const go = (p: ReturnType<typeof parseOAuthRedirectUrl>) => {
      if (handled.current) return;
      handled.current = true;

      if (p.error) {
        const desc = p.errorDescription || '';
        if (oauthErrorLooksLikeUnsupportedEmail(p.error, desc)) {
          router.replace({
            pathname: '/(auth)/google-unsupported',
            params: desc ? { hint: desc } : {},
          });
        } else {
          router.replace({
            pathname: '/(auth)/login',
            params: { oauthError: encodeURIComponent(desc || p.error) },
          });
        }
        return;
      }

      router.replace('/(auth)/login');
    };

    const err = firstParam(params.error);
    if (err) {
      go({
        error: err,
        errorDescription: decodeDesc(firstParam(params.error_description)),
        access_token: null,
        refresh_token: null,
      });
      return;
    }

    (async () => {
      const initial = await Linking.getInitialURL();
      if (!alive) return;
      if (initial?.includes('auth-callback')) {
        go(parseOAuthRedirectUrl(initial));
        return;
      }
      linkingSub.current = Linking.addEventListener('url', ({ url }) => {
        if (url?.includes('auth-callback')) go(parseOAuthRedirectUrl(url));
      });
    })();

    const fallback = setTimeout(() => {
      if (!handled.current) go({ error: null, errorDescription: null, access_token: null, refresh_token: null });
    }, 2000);

    return () => {
      alive = false;
      clearTimeout(fallback);
      linkingSub.current?.remove();
      linkingSub.current = null;
    };
  }, [router, params.error, params.error_description]);

  return (
    <View style={styles.box}>
      <ActivityIndicator color={colors.green} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgCanvas },
});
