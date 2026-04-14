import { Share } from 'react-native';
import { AttendanceRecord, ClassUnit, Session, User } from '../data/types';

function esc(v: unknown) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildSessionCsv(opts: {
  session: Session;
  unit: ClassUnit;
  records: AttendanceRecord[];
  users: User[];
}): string {
  const { session, unit, records, users } = opts;
  const header = ['Student ID', 'Student Name', 'Status', 'Signed At', 'Latitude', 'Longitude', 'Overridden'];
  const recordMap = new Map(records.map(r => [r.studentId, r]));
  const rosterIds =
    unit.enrolledStudentIds.length > 0
      ? unit.enrolledStudentIds
      : users.filter(u => u.role === 'student' && u.courseId === unit.courseId).map(u => u.id);
  const rows = rosterIds.map(sid => {
    const u = users.find(x => x.id === sid);
    const r = recordMap.get(sid);
    return [
      sid,
      u?.name ?? '',
      r ? r.status : 'absent',
      r ? r.signedAt : '',
      r ? r.coords.latitude : '',
      r ? r.coords.longitude : '',
      r?.overridden ? 'yes' : '',
    ];
  });
  const meta = [
    ['Unit', unit.code, unit.name],
    ['Room', unit.room],
    ['Lecturer', unit.lecturerName],
    ['Session', session.id],
    ['Started', session.startedAt],
    ['Ended', session.endedAt ?? ''],
    [],
    header,
    ...rows,
  ];
  return meta.map(r => r.map(esc).join(',')).join('\n');
}

export function buildOverviewCsv(opts: {
  units: ClassUnit[];
  sessions: Session[];
  records: AttendanceRecord[];
}): string {
  const { units, sessions, records } = opts;
  const header = ['Unit Code', 'Unit Name', 'Session ID', 'Started', 'Ended', 'Enrolled', 'Signed In'];
  const rows = sessions.map(s => {
    const u = units.find(x => x.id === s.unitId);
    const signed = records.filter(r => r.sessionId === s.id).length;
    return [s.unitCode, s.unitName, s.id, s.startedAt, s.endedAt ?? '', u?.enrolledStudentIds.length ?? 0, signed];
  });
  return [header, ...rows].map(r => r.map(esc).join(',')).join('\n');
}

export async function shareCsv(title: string, csv: string) {
  await Share.share({ title, message: csv });
}
