export type Role = 'student' | 'lecturer';

export type User = {
  id: string;
  name: string;
  role: Role;
  email: string;
  programme?: string;
  department?: string;
};

export type ClassUnit = {
  id: string;
  code: string;
  name: string;
  room: string;
  lecturerId: string;
  lecturerName: string;
  schedule: { start: string; end: string; day: string };
  enrolledStudentIds: string[];
  geofence: { latitude: number; longitude: number; radius: number };
};

export type Session = {
  id: string;
  unitId: string;
  unitCode: string;
  unitName: string;
  room: string;
  lecturerId: string;
  startedAt: string;
  endsAt: string;
  endedAt?: string;
  geofence: { latitude: number; longitude: number; radius: number };
  requireSelfie: boolean;
  status: 'upcoming' | 'live' | 'ended';
};

export type AttendanceRecord = {
  id: string;
  sessionId: string;
  unitId: string;
  unitCode: string;
  studentId: string;
  studentName: string;
  signedAt: string;
  coords: { latitude: number; longitude: number };
  status: 'present' | 'late' | 'absent';
  overridden?: boolean;
};
