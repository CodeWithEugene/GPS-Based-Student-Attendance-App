-- AttendEase — Supabase schema
-- Run this in your Supabase project: SQL Editor → New Query → paste → Run.
-- It creates tables, RLS policies, and seeds demo users/units.

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id           text primary key,                         -- student/staff ID, e.g. 'S001'
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email        text not null unique,
  name         text not null,
  role         text not null check (role in ('student', 'lecturer')),
  programme    text,
  department   text,
  created_at   timestamptz not null default now()
);

create table if not exists units (
  id                    text primary key,
  code                  text not null,
  name                  text not null,
  room                  text not null,
  lecturer_id           text not null references profiles(id),
  lecturer_name         text not null,
  schedule              jsonb not null,                  -- { start, end, day }
  enrolled_student_ids  text[] not null default '{}',
  geofence              jsonb not null,                  -- { latitude, longitude, radius }
  created_at            timestamptz not null default now()
);

create table if not exists sessions (
  id              text primary key,
  unit_id         text not null references units(id) on delete cascade,
  unit_code       text not null,
  unit_name       text not null,
  room            text not null,
  lecturer_id     text not null references profiles(id),
  started_at      timestamptz not null,
  ends_at         timestamptz not null,
  ended_at        timestamptz,
  geofence        jsonb not null,
  require_selfie  boolean not null default false,
  status          text not null check (status in ('upcoming', 'live', 'ended')),
  created_at      timestamptz not null default now()
);

create table if not exists attendance (
  id            text primary key,
  session_id    text not null references sessions(id) on delete cascade,
  unit_id       text not null references units(id) on delete cascade,
  unit_code     text not null,
  student_id    text not null references profiles(id),
  student_name  text not null,
  signed_at     timestamptz not null default now(),
  coords        jsonb not null,                          -- { latitude, longitude }
  status        text not null default 'present' check (status in ('present', 'late', 'absent')),
  overridden    boolean not null default false,
  unique (session_id, student_id)                        -- prevents proxy / duplicate sign-ins
);

create index if not exists idx_sessions_lecturer   on sessions (lecturer_id);
create index if not exists idx_sessions_unit       on sessions (unit_id);
create index if not exists idx_sessions_status     on sessions (status);
create index if not exists idx_attendance_student  on attendance (student_id);
create index if not exists idx_attendance_session  on attendance (session_id);

-- ---------------------------------------------------------------------------
-- 2. Row-Level Security
-- ---------------------------------------------------------------------------

alter table profiles   enable row level security;
alter table units      enable row level security;
alter table sessions   enable row level security;
alter table attendance enable row level security;

-- Any authenticated user can read profiles (needed for name lookups in live monitor)
create policy "profiles: read auth" on profiles for select to authenticated using (true);
create policy "profiles: read anon for login lookup"
  on profiles for select to anon using (true);
create policy "profiles: upsert own" on profiles for insert to authenticated with check (auth_user_id = auth.uid());
create policy "profiles: update own" on profiles for update to authenticated using (auth_user_id = auth.uid());

-- Units readable by all authenticated users
create policy "units: read" on units for select to authenticated using (true);
create policy "units: lecturer write"
  on units for all to authenticated
  using (exists (select 1 from profiles p where p.auth_user_id = auth.uid() and p.id = units.lecturer_id))
  with check (exists (select 1 from profiles p where p.auth_user_id = auth.uid() and p.id = units.lecturer_id));

-- Sessions: anyone authenticated can read; lecturer owns write
create policy "sessions: read" on sessions for select to authenticated using (true);
create policy "sessions: lecturer write"
  on sessions for all to authenticated
  using (exists (select 1 from profiles p where p.auth_user_id = auth.uid() and p.id = sessions.lecturer_id))
  with check (exists (select 1 from profiles p where p.auth_user_id = auth.uid() and p.id = sessions.lecturer_id));

-- Attendance:
-- - Students may INSERT their own record only for a LIVE session of a unit they're enrolled in
-- - Lecturer of the session may read/update/delete
-- - Student may read their own
create policy "attendance: student insert own"
  on attendance for insert to authenticated
  with check (
    exists (
      select 1
      from profiles p
      join sessions s on s.id = attendance.session_id
      join units u on u.id = s.unit_id
      where p.auth_user_id = auth.uid()
        and p.id = attendance.student_id
        and s.status = 'live'
        and attendance.student_id = any (u.enrolled_student_ids)
    )
  );

create policy "attendance: student read own"
  on attendance for select to authenticated
  using (
    exists (select 1 from profiles p where p.auth_user_id = auth.uid() and p.id = attendance.student_id)
  );

create policy "attendance: lecturer read/write"
  on attendance for all to authenticated
  using (
    exists (
      select 1 from profiles p
      join sessions s on s.id = attendance.session_id
      where p.auth_user_id = auth.uid() and p.id = s.lecturer_id
    )
  )
  with check (true);

-- ---------------------------------------------------------------------------
-- 3. Seed demo data (safe to re-run — uses ON CONFLICT)
-- ---------------------------------------------------------------------------
-- NOTE: Replace the emails below with real addresses you can receive OTPs on.
--       Supabase auth.users rows will be created the first time each email
--       signs in with OTP — this seed only populates the profile records.

insert into profiles (id, email, name, role, programme) values
  ('S001', 's001@demo.local', 'Brian Otieno',  'student', 'BSc Computer Science'),
  ('S002', 's002@demo.local', 'Aisha Mohamed', 'student', 'BSc Computer Science'),
  ('S003', 's003@demo.local', 'Kevin Kamau',   'student', 'BSc Computer Science'),
  ('S004', 's004@demo.local', 'Faith Wanjiru', 'student', 'BSc IT')
on conflict (id) do nothing;

insert into profiles (id, email, name, role, department) values
  ('L001', 'l001@demo.local', 'Dr. Mwangi',     'lecturer', 'Computing'),
  ('L002', 'l002@demo.local', 'Prof. Njoroge',  'lecturer', 'Computing')
on conflict (id) do nothing;

-- JKUAT main campus coords as default geofence centre
insert into units (id, code, name, room, lecturer_id, lecturer_name, schedule, enrolled_student_ids, geofence) values
  ('U1', 'ECS 301', 'Database Systems',    'CS Lab 1',       'L001', 'Dr. Mwangi',
    '{"start":"08:00","end":"10:00","day":"Mon"}',
    array['S001','S002','S003','S004'],
    '{"latitude":-1.0954,"longitude":37.0146,"radius":30}'),
  ('U2', 'ECS 305', 'Operating Systems',    'Lecture Hall 4', 'L001', 'Dr. Mwangi',
    '{"start":"11:00","end":"13:00","day":"Mon"}',
    array['S001','S002','S003'],
    '{"latitude":-1.0954,"longitude":37.0146,"radius":40}'),
  ('U3', 'ECS 310', 'Software Engineering', 'CS Lab 2',       'L002', 'Prof. Njoroge',
    '{"start":"14:00","end":"16:00","day":"Mon"}',
    array['S001','S002','S004'],
    '{"latitude":-1.0954,"longitude":37.0146,"radius":25}')
on conflict (id) do nothing;
