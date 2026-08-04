-- Keep the existing access rules, but evaluate auth helpers once per statement.
-- This removes Supabase's Auth RLS Initialization Plan warnings and avoids
-- evaluating separate permissive policies for the same operation.

drop policy if exists "profiles_read_self_or_admin" on public.profiles;
create policy "profiles_read_self_or_admin" on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or (select public.is_admin())
);

drop policy if exists "journal_read_own" on public.journal_entries;
drop policy if exists "journal_read_admin" on public.journal_entries;
create policy "journal_read_own_or_admin" on public.journal_entries
for select to authenticated
using (
  (user_id = (select auth.uid()) and (select public.is_active_member()))
  or (select public.is_admin())
);

drop policy if exists "journal_insert_own" on public.journal_entries;
create policy "journal_insert_own" on public.journal_entries
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select public.is_active_member())
);

drop policy if exists "journal_update_own" on public.journal_entries;
create policy "journal_update_own" on public.journal_entries
for update to authenticated
using (
  user_id = (select auth.uid())
  and (select public.is_active_member())
)
with check (
  user_id = (select auth.uid())
  and (select public.is_active_member())
);

drop policy if exists "journal_delete_own" on public.journal_entries;
create policy "journal_delete_own" on public.journal_entries
for delete to authenticated
using (
  user_id = (select auth.uid())
  and (select public.is_active_member())
);

drop policy if exists "audit_read_admin" on public.admin_audit_log;
create policy "audit_read_admin" on public.admin_audit_log
for select to authenticated
using ((select public.is_admin()));

drop policy if exists "course_progress_read_own" on public.course_lesson_progress;
create policy "course_progress_read_own" on public.course_lesson_progress
for select to authenticated
using (
  user_id = (select auth.uid())
  and (select public.is_active_member())
);

drop policy if exists "course_progress_insert_own" on public.course_lesson_progress;
create policy "course_progress_insert_own" on public.course_lesson_progress
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select public.is_active_member())
);

drop policy if exists "course_progress_update_own" on public.course_lesson_progress;
create policy "course_progress_update_own" on public.course_lesson_progress
for update to authenticated
using (
  user_id = (select auth.uid())
  and (select public.is_active_member())
)
with check (
  user_id = (select auth.uid())
  and (select public.is_active_member())
);

drop policy if exists "presence_read_self_or_admin" on public.member_presence;
create policy "presence_read_self_or_admin" on public.member_presence
for select to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_admin())
);

drop policy if exists "journal_screenshots_read_own" on storage.objects;
drop policy if exists "journal_screenshots_read_admin" on storage.objects;
create policy "journal_screenshots_read_own_or_admin" on storage.objects
for select to authenticated
using (
  bucket_id = 'journal-screenshots'
  and (
    ((storage.foldername(name))[1] = (select auth.uid())::text
      and (select public.is_active_member()))
    or (select public.is_admin())
  )
);

drop policy if exists "journal_screenshots_insert_own" on storage.objects;
create policy "journal_screenshots_insert_own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'journal-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.is_active_member())
);

drop policy if exists "journal_screenshots_update_own" on storage.objects;
create policy "journal_screenshots_update_own" on storage.objects
for update to authenticated
using (
  bucket_id = 'journal-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.is_active_member())
)
with check (
  bucket_id = 'journal-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.is_active_member())
);

drop policy if exists "journal_screenshots_delete_own" on storage.objects;
create policy "journal_screenshots_delete_own" on storage.objects
for delete to authenticated
using (
  bucket_id = 'journal-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.is_active_member())
);
