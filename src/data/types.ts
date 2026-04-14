export type Role = 'student' | 'lecturer';

export type User = {
  id: string;
  name: string;
  role: Role;
  email: string;
  programme?: string;
  department?: string;
  /** Degree programme (FK to courses.id). Required for students to see classes and sign in. */
  courseId?: string;
};

export type Course = {
  id: string;
  name: string;
  sortOrder: number;
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
  /** Degree this class is offered under (students on this degree see the unit). */
  courseId: string;
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
