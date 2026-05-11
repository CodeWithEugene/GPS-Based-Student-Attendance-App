-- Manual sign-in window — lecturers can pause/resume attendance sign-in mid-session.
-- Run once in Supabase SQL Editor.

alter table sessions
  add column if not exists sign_in_open boolean not null default true;

-- Students can only insert attendance when the session is live AND the lecturer
-- has the sign-in window open. Replaces the existing "attendance: student insert own".
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
        and s.status = 'live'
        and s.sign_in_open = true
        and attendance.student_id = any (u.enrolled_student_ids)
    )
  );
