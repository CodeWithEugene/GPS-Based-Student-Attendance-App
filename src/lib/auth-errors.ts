/**
 * Turn Supabase / fetch errors into short, user-visible strings (never raw JSON blobs).
 */
export function formatAuthErrorForDisplay(err: unknown): string {
  const raw =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message?: string }).message ?? '')
      : typeof err === 'string'
        ? err
        : '';

  const statusFromObject =
    err && typeof err === 'object' && 'status' in err
      ? Number((err as { status?: number }).status)
      : NaN;

  const lower = raw.toLowerCase();
  if (lower.includes('network request failed')) {
    return 'Cannot reach the server. Check your internet connection and try again.';
  }

  const tryParseStatus = (text: string): number | undefined => {
    const t = text.trim();
    if (!t.startsWith('{')) return undefined;
    try {
      const o = JSON.parse(t) as { status?: number; statusCode?: number };
      const s = o.status ?? o.statusCode;
      return typeof s === 'number' && !Number.isNaN(s) ? s : undefined;
    } catch {
      return undefined;
    }
  };

  const status = (!Number.isNaN(statusFromObject) && statusFromObject > 0
    ? statusFromObject
    : tryParseStatus(raw)) ?? undefined;

  if (status === 504 || status === 502 || status === 503) {
    return (
      'The sign-in service timed out. Wait a minute and try again. ' +
      'If this continues, check https://status.supabase.com and your project SMTP settings ' +
      '(slow email providers can cause gateway timeouts).'
    );
  }
  if (status === 429) {
    return 'Too many requests. Please wait a few minutes before requesting another code.';
  }
  if (status !== undefined && status >= 500) {
    return 'The sign-in service had a problem. Please try again shortly.';
  }

  if (raw.length > 200 && (raw.trim().startsWith('{') || raw.includes('"status"'))) {
    return 'Sign-in failed. Please try again in a moment.';
  }

  if (!raw) return 'Something went wrong. Please try again.';
  return raw.length > 400 ? `${raw.slice(0, 400)}…` : raw;
}

/**
 * Wrong-code lockout should not advance when the failure is network / server / rate limit.
 */
export function shouldCountOtpFailedAttempt(err: unknown): boolean {
  if (!err) return true;
  const status =
    err && typeof err === 'object' && 'status' in err
      ? Number((err as { status?: number }).status)
      : NaN;
  if (!Number.isNaN(status) && (status >= 500 || status === 429)) return false;

  const raw =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message?: string }).message ?? '')
      : '';
  if (raw.toLowerCase().includes('network request failed')) return false;
  const t = raw.trim();
  if (t.startsWith('{')) {
    try {
      const o = JSON.parse(t) as { status?: number };
      if (typeof o.status === 'number' && (o.status >= 500 || o.status === 429)) return false;
    } catch {
      /* ignore */
    }
  }
  return true;
}
