-- Profile photos — run ONCE in Supabase SQL Editor.
-- 1) profiles.avatar_url column
-- 2) avatars Storage bucket (public)
-- 3) RLS so each user can upload/replace only their own photo; anyone can read

-- 1. Column
alter table profiles add column if not exists avatar_url text;

-- 2. Bucket (public read so <Image> can load without signed URLs)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. Storage RLS
-- Files are stored as:  <auth_user_id>/<filename>.jpg
drop policy if exists "avatars: public read"        on storage.objects;
drop policy if exists "avatars: authenticated write" on storage.objects;
drop policy if exists "avatars: insert own"         on storage.objects;
drop policy if exists "avatars: update own"         on storage.objects;
drop policy if exists "avatars: delete own"         on storage.objects;

create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: insert own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
