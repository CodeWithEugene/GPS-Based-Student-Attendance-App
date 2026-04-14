/**
 * Parse Supabase OAuth redirect URLs (query + fragment) from in-app browser or deep links.
 */
export function parseOAuthRedirectUrl(redirectUrl: string): {
  error: string | null;
  errorDescription: string | null;
  access_token: string | null;
  refresh_token: string | null;
} {
  const hashIdx = redirectUrl.indexOf('#');
  const qIdx = redirectUrl.indexOf('?');
  const queryString =
    qIdx >= 0 ? redirectUrl.slice(qIdx + 1, hashIdx >= 0 ? hashIdx : redirectUrl.length) : '';
  const fragment = hashIdx >= 0 ? redirectUrl.slice(hashIdx + 1) : '';

  const q = new URLSearchParams(queryString);
  const f = new URLSearchParams(fragment);

  let errorDescription = q.get('error_description') || f.get('error_description');
  if (errorDescription) {
    try {
      errorDescription = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
    } catch {
      /* use raw */
    }
  }

  return {
    error: q.get('error') || f.get('error'),
    errorDescription,
    access_token: f.get('access_token') || q.get('access_token'),
    refresh_token: f.get('refresh_token') || q.get('refresh_token'),
  };
}

/** Heuristics: Supabase / provider errors that mean “wrong or disallowed account” for this app. */
export function oauthErrorLooksLikeUnsupportedEmail(error: string, description: string): boolean {
  const blob = `${error} ${description}`.toLowerCase();
  return (
    /database error saving|saving new user|unexpected_failure|server_error/.test(blob) ||
    /email.*not|not.*allowed|signup|unauthorized|forbidden/.test(blob)
  );
}
