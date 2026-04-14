import { supabase } from './supabase';
import { User } from '../data/types';

/** Student accounts — student app: sign attendance only (geofence enforced). */
const STUDENT_DOMAIN = '@students.jkuat.ac.ke';
/** Staff/lecturer accounts — lecturer app: units, live sessions, reports, attendance. */
const STAFF_DOMAIN = '@jkuat.ac.ke';

export function isJkuatEmail(email: string) {
  const e = email.trim().toLowerCase();
  return e.endsWith(STUDENT_DOMAIN) || e.endsWith(STAFF_DOMAIN);
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
  return email.trim().toLowerCase().endsWith(STUDENT_DOMAIN) ? 'student' : 'lecturer';
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
  const normEmail = email.trim().toLowerCase();

  // 1. Existing profile by email?
  let { data: existing } = await supabase
    .from('profiles')
    .select('id,email,name,role,programme,department')
    .ilike('email', normEmail)
    .maybeSingle();

  if (existing) {
    // Link this auth user to the profile
    await supabase.from('profiles').update({ auth_user_id: authUserId }).eq('id', existing.id);
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
        programme: role === 'student' ? 'BSc Computer Science' : null,
        department: role === 'lecturer' ? 'Computing' : null,
        auth_user_id: authUserId,
      })
      .select('id,email,name,role,programme,department')
      .single();
    if (error) throw error;
    existing = created;
  }

  return {
    id: existing!.id,
    email: existing!.email,
    name: existing!.name,
    role: existing!.role as 'student' | 'lecturer',
    programme: existing!.programme ?? undefined,
    department: existing!.department ?? undefined,
  };
}
