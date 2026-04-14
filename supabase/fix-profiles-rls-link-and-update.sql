-- Fix: students/lecturers could not save course_id or link auth_user_id to a seeded profile.
-- The old policy only allowed UPDATE when auth_user_id = auth.uid(), so rows with
-- auth_user_id IS NULL (demo seeds or manual inserts) could never be claimed or updated.
--
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Safe to re-run (drops and recreates one policy).

drop policy if exists "profiles: update own" on profiles;

-- Allow update if already linked to this user, OR claim an unlinked row whose email matches the JWT.
-- with check ensures the row ends up owned by the current user (after link, auth_user_id must be set).
create policy "profiles: update own" on profiles
  for update
  to authenticated
  using (
    auth_user_id = auth.uid()
    or (
      auth_user_id is null
      and lower(trim(email)) = lower(trim(coalesce(
        nullif(btrim(auth.jwt() ->> 'email'), ''),
        nullif(btrim(auth.jwt() #>> '{user_metadata,email}'), '')
      )))
    )
  )
  with check (auth_user_id = auth.uid());

-- If Google / OTP shows "Database error saving new user" before the app loads:
-- Authentication → Hooks — turn off custom hooks that INSERT into public tables until they match your schema.
-- Or fix triggers on auth.users so they do not fail (e.g. ON CONFLICT DO NOTHING on profiles).
-- Authentication → Providers → Google — ensure signup is not restricted to a domain that blocks Gmail.
