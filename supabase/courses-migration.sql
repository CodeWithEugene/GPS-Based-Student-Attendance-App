-- Courses + degree linking (run once in Supabase SQL Editor after base schema.sql).
-- Students: profiles.course_id (mandatory in app for access to units).
-- Units: units.course_id (which degree this class belongs to).

create table if not exists courses (
  id          text primary key,
  name        text not null unique,
  sort_order  int not null default 0
);

alter table courses enable row level security;

drop policy if exists "courses: read authenticated" on courses;
create policy "courses: read authenticated"
  on courses for select to authenticated using (true);

-- Optional: allow anon read if you ever need courses before auth (not required for current app)
drop policy if exists "courses: read anon" on courses;
create policy "courses: read anon"
  on courses for select to anon using (true);

insert into courses (id, name, sort_order) values
  ('CRS01', 'BSc. Computer Science', 1),
  ('CRS02', 'BSc. Information Technology', 2),
  ('CRS03', 'BSc. Electrical and Electronic Engineering', 3),
  ('CRS04', 'BSc. Civil Engineering', 4),
  ('CRS05', 'BSc. Mechanical Engineering', 5),
  ('CRS06', 'BSc. Agriculture', 6),
  ('CRS07', 'BSc. Horticulture', 7),
  ('CRS08', 'BSc. Commerce', 8),
  ('CRS09', 'BSc. Mathematics', 9),
  ('CRS10', 'BSc. Biotechnology', 10)
on conflict (id) do nothing;

alter table profiles add column if not exists course_id text references courses(id);
alter table units add column if not exists course_id text references courses(id);

-- Backfill units (default degree for legacy rows without a course)
update units set course_id = 'CRS01' where course_id is null;

-- Link students when programme text matches a canonical course name
update profiles p
set course_id = c.id, programme = c.name
from courses c
where p.role = 'student'
  and p.course_id is null
  and lower(trim(p.programme)) = lower(trim(c.name));

-- Legacy seed strings from schema.sql (no period after BSc)
update profiles set course_id = 'CRS01', programme = (select name from courses where id = 'CRS01')
where role = 'student' and course_id is null and lower(trim(programme)) in ('bsc computer science');
update profiles set course_id = 'CRS02', programme = (select name from courses where id = 'CRS02')
where role = 'student' and course_id is null and lower(trim(programme)) like '%bsc it%';

-- Any student still without course_id must pick their degree in the app (mandatory modal).

update units set course_id = 'CRS01' where course_id is null;

alter table units alter column course_id set not null;

-- Attendance: student signs in if their profile.course_id matches the unit.course_id (session live)
drop policy if exists "attendance: student insert own" on attendance;
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
        and p.role = 'student'
        and s.status = 'live'
        and p.course_id is not null
        and u.course_id is not null
        and p.course_id = u.course_id
    )
  );
