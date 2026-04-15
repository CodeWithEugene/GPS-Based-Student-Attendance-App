import { supabase } from './supabase';
import { User } from '../data/types';

/** Student accounts — student app: sign attendance only (geofence enforced). */
const STUDENT_DOMAIN = '@students.jkuat.ac.ke';
/** Staff/lecturer accounts — lecturer app: units, live sessions, reports, attendance. */
const STAFF_DOMAIN = '@jkuat.ac.ke';

/**
 * The only non-@jkuat.ac.ke address that may sign in as a lecturer (Google or OTP).
 * All other lecturers must use @jkuat.ac.ke. Do not add more values here without an explicit product decision.
 */
export const LECTURER_GMAIL_EXCEPTION = 'eugenegabriel.ke@gmail.com';

function norm(email: string) {
  return email.trim().toLowerCase();
}

/** True for @students.jkuat.ac.ke or @jkuat.ac.ke only (not the Gmail exception). */
export function isJkuatEmail(email: string) {
  const e = norm(email);
  return e.endsWith(STUDENT_DOMAIN) || e.endsWith(STAFF_DOMAIN);
}

/** Email may sign in with OTP or Google: JKUAT student, JKUAT staff, or the one lecturer Gmail exception. */
export function isAllowedSignInEmail(email: string) {
  const e = norm(email);
  if (e.endsWith(STUDENT_DOMAIN)) return true;
  if (e.endsWith(STAFF_DOMAIN)) return true;
  if (e === LECTURER_GMAIL_EXCEPTION) return true;
  return false;
}

/** Partially hide an address for on-screen display (e.g. after OAuth). */
export function maskEmailForDisplay(email: string) {
  const [u, d] = email.trim().toLowerCase().split('@');
  if (!d) return '••••';
  const safeLocal = u ?? '';
  const stars = Math.max(safeLocal.length - 2, 3);
  return `${safeLocal.slice(0, 2)}${'*'.repeat(stars)}@${d}`;
}

export function roleFromEmail(email: string): 'student' | 'lecturer' {
  const e = norm(email);
  if (e.endsWith(STUDENT_DOMAIN)) return 'student';
  if (e.endsWith(STAFF_DOMAIN)) return 'lecturer';
  if (e === LECTURER_GMAIL_EXCEPTION) return 'lecturer';
  throw new Error('This email is not authorized for the app.');
}

export function nameFromEmail(email: string) {
  const local = email.split('@')[0] ?? '';
  return local
    .split(/[._+-]/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'New User';
}

function genId(role: 'student' | 'lecturer') {
  const prefix = role === 'student' ? 'S' : 'L';
  const n = Math.floor(100 + Math.random() * 899);
  return `${prefix}${n}${Date.now().toString().slice(-4)}`;
}

/**
 * Ensure a profile row exists for the currently signed-in auth user.
 * Returns the profile as a User.
 */
export async function ensureProfileForSession(email: string, authUserId: string): Promise<User> {
  const normEmail = norm(email);
  if (!isAllowedSignInEmail(normEmail)) {
    throw new Error('This email is not authorized to use the app.');
  }

  // 1. Existing profile by email?
  let { data: existing } = await supabase
    .from('profiles')
    .select('id,email,name,role,programme,department,course_id,avatar_url')
    .ilike('email', normEmail)
    .maybeSingle();

  if (existing) {
    const { error: linkErr } = await supabase
      .from('profiles')
      .update({ auth_user_id: authUserId })
      .eq('id', existing.id)
      .or(`auth_user_id.is.null,auth_user_id.eq.${authUserId}`);
    if (linkErr) {
      throw new Error(
        linkErr.message ||
          'Could not link your account to your profile. Run fix-profiles-rls-link-and-update.sql in Supabase (see supabase/).',
      );
    }
    const { data: relinked } = await supabase
      .from('profiles')
      .select('id,email,name,role,programme,department,course_id,auth_user_id')
      .eq('id', existing.id)
      .maybeSingle();
    if (relinked && (relinked as { auth_user_id?: string }).auth_user_id !== authUserId) {
      throw new Error(
        'Account link did not complete. In Supabase SQL Editor, run supabase/fix-profiles-rls-link-and-update.sql then try again.',
      );
    }
  } else {
    const role = roleFromEmail(normEmail);
    const name = nameFromEmail(normEmail);
    const id = genId(role);
    const { data: created, error } = await supabase
      .from('profiles')
      .insert({
        id,
        email: normEmail,
        name,
        role,
        programme: null,
        course_id: null,
        department: role === 'lecturer' ? 'Computing' : null,
        auth_user_id: authUserId,
      })
      .select('id,email,name,role,programme,department,course_id,avatar_url')
      .single();
    if (error) {
      const code = (error as { code?: string }).code;
      if (code === '23505') {
        const { data: raced } = await supabase
          .from('profiles')
          .select('id,email,name,role,programme,department,course_id,avatar_url')
          .ilike('email', normEmail)
          .maybeSingle();
        if (raced) {
          existing = raced;
          const { error: linkErr2 } = await supabase
            .from('profiles')
            .update({ auth_user_id: authUserId })
            .eq('id', existing.id)
            .or(`auth_user_id.is.null,auth_user_id.eq.${authUserId}`);
          if (linkErr2) throw linkErr2;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    } else {
      existing = created;
    }
  }

  let row = existing!;

  if (normEmail === LECTURER_GMAIL_EXCEPTION && row.role !== 'lecturer') {
    const { data: upgraded, error: upErr } = await supabase
      .from('profiles')
      .update({
        role: 'lecturer',
        department: row.department ?? 'Computing',
        programme: row.programme,
      })
      .eq('id', row.id)
      .select('id,email,name,role,programme,department,course_id,avatar_url')
      .single();
    if (upErr) throw new Error(upErr.message || 'Could not set lecturer role for this account.');
    if (upgraded) row = upgraded as typeof row;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as 'student' | 'lecturer',
    programme: row.programme ?? undefined,
    department: row.department ?? undefined,
    courseId: row.course_id ?? undefined,
    avatarUrl: (row as { avatar_url?: string | null }).avatar_url ?? undefined,
  };
}
