-- Owners and developers may review member journals, but cannot change them.
create policy "journal_read_admin" on public.journal_entries for select to authenticated
using (public.is_admin());

create policy "journal_screenshots_read_admin" on storage.objects for select to authenticated
using (bucket_id = 'journal-screenshots' and public.is_admin());
