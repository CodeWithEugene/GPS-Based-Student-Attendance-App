import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { AttendanceRecord, ClassUnit, Course, Session, User } from './types';

const CURRENT_USER = 'ae.currentUser';

// ---------- mappers (snake_case DB <-> camelCase app) ----------

type DbProfile = {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'lecturer';
  programme: string | null;
  department: string | null;
  course_id: string | null;
};
type DbUnit = {
  id: string; code: string; name: string; room: string;
  lecturer_id: string; lecturer_name: string;
  schedule: { start: string; end: string; day: string };
  enrolled_student_ids: string[];
  geofence: { latitude: number; longitude: number; radius: number };
  course_id: string | null;
};
type DbCourse = { id: string; name: string; sort_order: number };
type DbSession = {
  id: string; unit_id: string; unit_code: string; unit_name: string; room: string;
  lecturer_id: string;
  started_at: string; ends_at: string; ended_at: string | null;
  geofence: { latitude: number; longitude: number; radius: number };
  require_selfie: boolean; status: 'upcoming' | 'live' | 'ended';
};
type DbAttendance = {
  id: string; session_id: string; unit_id: string; unit_code: string;
  student_id: string; student_name: string;
  signed_at: string;
  coords: { latitude: number; longitude: number };
  status: 'present' | 'late' | 'absent'; overridden: boolean;
};

const toUser = (p: DbProfile): User => ({
  id: p.id, email: p.email, name: p.name, role: p.role,
  programme: p.programme ?? undefined, department: p.department ?? undefined,
  courseId: p.course_id ?? undefined,
});
const toCourse = (c: DbCourse): Course => ({
  id: c.id, name: c.name, sortOrder: c.sort_order,
});
const toUnit = (u: DbUnit): ClassUnit => ({
  id: u.id, code: u.code, name: u.name, room: u.room,
  lecturerId: u.lecturer_id, lecturerName: u.lecturer_name,
  schedule: u.schedule, enrolledStudentIds: u.enrolled_student_ids, geofence: u.geofence,
  courseId: u.course_id ?? 'CRS01',
});
const fromClassUnitRow = (u: ClassUnit) => ({
  id: u.id,
  code: u.code,
  name: u.name,
  room: u.room,
  lecturer_id: u.lecturerId,
  lecturer_name: u.lecturerName,
  schedule: u.schedule,
  enrolled_student_ids: u.enrolledStudentIds,
  geofence: u.geofence,
  course_id: u.courseId,
});
const toSession = (s: DbSession): Session => ({
  id: s.id, unitId: s.unit_id, unitCode: s.unit_code, unitName: s.unit_name, room: s.room,
  lecturerId: s.lecturer_id, startedAt: s.started_at, endsAt: s.ends_at,
  endedAt: s.ended_at ?? undefined, geofence: s.geofence,
  requireSelfie: s.require_selfie, status: s.status,
});
const fromSession = (s: Session): DbSession => ({
  id: s.id, unit_id: s.unitId, unit_code: s.unitCode, unit_name: s.unitName, room: s.room,
  lecturer_id: s.lecturerId, started_at: s.startedAt, ends_at: s.endsAt,
  ended_at: s.endedAt ?? null, geofence: s.geofence,
  require_selfie: s.requireSelfie, status: s.status,
});
const toAttendance = (a: DbAttendance): AttendanceRecord => ({
  id: a.id, sessionId: a.session_id, unitId: a.unit_id, unitCode: a.unit_code,
  studentId: a.student_id, studentName: a.student_name,
  signedAt: a.signed_at, coords: a.coords,
  status: a.status, overridden: a.overridden,
});
const fromAttendance = (a: AttendanceRecord): DbAttendance => ({
  id: a.id, session_id: a.sessionId, unit_id: a.unitId, unit_code: a.unitCode,
  student_id: a.studentId, student_name: a.studentName,
  signed_at: a.signedAt, coords: a.coords,
  status: a.status, overridden: a.overridden ?? false,
});

// ---------- repo ----------

export const repo = {
  // --- profiles ---
  async getUserById(id: string): Promise<User | undefined> {
    const { data } = await supabase
      .from('profiles')
      .select('id,email,name,role,programme,department,course_id')
      .eq('id', id)
      .maybeSingle();
    return data ? toUser(data as DbProfile) : undefined;
  },
  async fetchProfileById(id: string): Promise<User | null> {
    const u = await this.getUserById(id);
    return u ?? null;
  },
  async getUsers(): Promise<User[]> {
    const { data } = await supabase
      .from('profiles')
      .select('id,email,name,role,programme,department,course_id');
    return (data as DbProfile[] | null)?.map(toUser) ?? [];
  },

  async getCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('id,name,sort_order')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data as DbCourse[] | null)?.map(toCourse) ?? [];
  },

  /** Set degree programme (students + lecturers). Updates profiles.course_id and programme label. */
  async updateUserCourse(userId: string, courseId: string, courseName: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ course_id: courseId, programme: courseName })
      .eq('id', userId);
    if (error) throw error;
  },

  async getStudentsForCourse(courseId: string): Promise<User[]> {
    const { data } = await supabase
      .from('profiles')
      .select('id,email,name,role,programme,department,course_id')
      .eq('role', 'student')
      .eq('course_id', courseId);
    return (data as DbProfile[] | null)?.map(toUser) ?? [];
  },

  // --- units ---
  async getUnits(): Promise<ClassUnit[]> {
    const { data } = await supabase.from('units').select('*');
    return (data as DbUnit[] | null)?.map(toUnit) ?? [];
  },
  async getUnitsForStudent(sid: string): Promise<ClassUnit[]> {
    const profile = await this.getUserById(sid);
    if (!profile?.courseId) return [];
    const { data } = await supabase.from('units').select('*').eq('course_id', profile.courseId);
    return (data as DbUnit[] | null)?.map(toUnit) ?? [];
  },
  async createUnit(u: ClassUnit): Promise<ClassUnit> {
    const { data, error } = await supabase
      .from('units')
      .insert(fromClassUnitRow(u))
      .select()
      .single();
    if (error) throw error;
    return toUnit(data as DbUnit);
  },
  async getUnitsForLecturer(lid: string): Promise<ClassUnit[]> {
    const { data } = await supabase
      .from('units').select('*').eq('lecturer_id', lid);
    return (data as DbUnit[] | null)?.map(toUnit) ?? [];
  },

  // --- sessions ---
  async getSessions(): Promise<Session[]> {
    const { data } = await supabase.from('sessions').select('*');
    return (data as DbSession[] | null)?.map(toSession) ?? [];
  },
  async getLiveSessionsForStudent(sid: string): Promise<Session[]> {
    const units = await this.getUnitsForStudent(sid);
    const ids = units.map(u => u.id);
    if (ids.length === 0) return [];
    const { data } = await supabase
      .from('sessions').select('*')
      .in('unit_id', ids)
      .eq('status', 'live')
      .gt('ends_at', new Date().toISOString());
    return (data as DbSession[] | null)?.map(toSession) ?? [];
  },
  async createSession(s: Session): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions').insert(fromSession(s)).select().single();
    if (error) throw error;
    return toSession(data as DbSession);
  },
  async updateSession(id: string, patch: Partial<Session>) {
    const body: Partial<DbSession> = {};
    if (patch.status !== undefined) body.status = patch.status;
    if (patch.endedAt !== undefined) body.ended_at = patch.endedAt;
    if (patch.endsAt !== undefined) body.ends_at = patch.endsAt;
    if (patch.requireSelfie !== undefined) body.require_selfie = patch.requireSelfie;
    if (patch.geofence !== undefined) body.geofence = patch.geofence;
    const { error } = await supabase.from('sessions').update(body).eq('id', id);
    if (error) throw error;
  },

  // --- attendance ---
  async getAttendance(): Promise<AttendanceRecord[]> {
    const { data } = await supabase.from('attendance').select('*');
    return (data as DbAttendance[] | null)?.map(toAttendance) ?? [];
  },
  async getAttendanceForSession(sessionId: string): Promise<AttendanceRecord[]> {
    const { data } = await supabase
      .from('attendance').select('*').eq('session_id', sessionId);
    return (data as DbAttendance[] | null)?.map(toAttendance) ?? [];
  },
  async getAttendanceForStudent(studentId: string): Promise<AttendanceRecord[]> {
    const { data } = await supabase
      .from('attendance').select('*').eq('student_id', studentId);
    return (data as DbAttendance[] | null)?.map(toAttendance) ?? [];
  },
  async logAttendance(r: AttendanceRecord): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(fromAttendance(r), { onConflict: 'session_id,student_id', ignoreDuplicates: true })
      .select().maybeSingle();
    if (error) throw error;
    return data ? toAttendance(data as DbAttendance) : r;
  },
  async overrideAttendance(opts: {
    sessionId: string; unitId: string; unitCode: string;
    studentId: string; studentName: string;
    status: 'present' | 'absent';
    coords: { latitude: number; longitude: number };
  }): Promise<void> {
    if (opts.status === 'absent') {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('session_id', opts.sessionId)
        .eq('student_id', opts.studentId);
      if (error) throw error;
      return;
    }
    const rec: DbAttendance = {
      id: `A-${Date.now()}`,
      session_id: opts.sessionId,
      unit_id: opts.unitId,
      unit_code: opts.unitCode,
      student_id: opts.studentId,
      student_name: opts.studentName,
      signed_at: new Date().toISOString(),
      coords: opts.coords,
      status: 'present',
      overridden: true,
    };
    const { error } = await supabase
      .from('attendance')
      .upsert(rec, { onConflict: 'session_id,student_id' });
    if (error) throw error;
  },

  // --- auth session (cached profile) ---
  async setCurrentUser(u: User | null) {
    if (u) await AsyncStorage.setItem(CURRENT_USER, JSON.stringify(u));
    else await AsyncStorage.removeItem(CURRENT_USER);
  },
  async getCurrentUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  },
  async signOut() {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(CURRENT_USER);
  },
};
