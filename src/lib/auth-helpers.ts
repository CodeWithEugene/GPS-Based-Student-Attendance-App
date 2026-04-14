import { supabase } from './supabase';
import { User } from '../data/types';

/** Student accounts — student app: sign attendance only (geofence enforced). */
const STUDENT_DOMAIN = '@students.jkuat.ac.ke';
/** Staff/lecturer accounts — lecturer app: units, live sessions, reports, attendance. */
const STAFF_DOMAIN = '@jkuat.ac.ke';

/**
 * Single allowed non-JKUAT Google / OTP address with lecturer role (all other lecturers must use @jkuat.ac.ke).
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
  return 'lecturer';
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

  // 1. Existing profile by email?
  let { data: existing } = await supabase
    .from('profiles')
    .select('id,email,name,role,programme,department,course_id')
    .ilike('email', normEmail)
    .maybeSingle();

  if (existing) {
    // Link this auth user to the profile
    await supabase.from('profiles').update({ auth_user_id: authUserId }).eq('id', existing.id);
    if (normEmail === LECTURER_GMAIL_EXCEPTION && existing.role !== 'lecturer') {
      const { data: upgraded } = await supabase
        .from('profiles')
        .update({
          role: 'lecturer',
          department: existing.department ?? 'Computing',
          programme: null,
        })
        .eq('id', existing.id)
        .select('id,email,name,role,programme,department,course_id')
        .single();
      if (upgraded) existing = upgraded as typeof existing;
    }
  } else {
    // 2. Auto-create a profile from the email domain
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
      .select('id,email,name,role,programme,department,course_id')
      .single();
    if (error) throw error;
    existing = created;
  }

  const row = existing!;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as 'student' | 'lecturer',
    programme: row.programme ?? undefined,
    department: row.department ?? undefined,
    courseId: row.course_id ?? undefined,
  };
}
