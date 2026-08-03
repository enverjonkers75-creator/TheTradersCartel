-- Upgrade the original members database without replacing its existing
-- profiles, conversations, journals, or approvals.
create extension if not exists pgcrypto;

alter type public.member_status add value if not exists 'rejected';

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  symbol text not null check (char_length(symbol) between 2 and 20),
  side public.trade_side not null,
  pnl_amount numeric(18,2) not null,
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  traded_at timestamptz not null,
  notes text not null default '' check (char_length(notes) <= 2000),
  screenshot_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_entries_user_date_idx
on public.journal_entries(user_id, traded_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = check_user and role in ('owner', 'developer') and status = 'active'
  );
$$;

create or replace function public.is_active_member(check_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = check_user and status = 'active');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  assigned_role public.app_role := 'student';
  assigned_status public.member_status := 'pending';
begin
  if lower(new.email) = 'imaadjacobs123@gmail.com' then
    assigned_role := 'owner';
    assigned_status := 'active';
  elsif lower(new.email) = 'enverjonkers75@gmail.com' then
    assigned_role := 'developer';
    assigned_status := 'active';
  end if;

  insert into public.profiles(id, email, full_name, role, status, approved_at)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    assigned_role,
    assigned_status,
    case when assigned_status = 'active' then now() else null end
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.set_member_status(target_user uuid, next_status public.member_status)
returns void language plpgsql security definer set search_path = public as $$
declare
  old_status public.member_status;
  target_role public.app_role;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator access required';
  end if;
  if next_status = 'pending' then
    raise exception 'A reviewed account cannot be returned to pending';
  end if;

  select status, role into old_status, target_role
  from public.profiles where id = target_user for update;
  if not found then raise exception 'Member not found'; end if;
  if target_role <> 'student' then raise exception 'Administrator accounts cannot be changed here'; end if;

  update public.profiles
  set status = next_status,
      approved_at = case when next_status = 'active' then now() else approved_at end,
      approved_by = case when next_status = 'active' then auth.uid() else approved_by end
  where id = target_user;

  insert into public.admin_audit_log(actor_id, target_user, previous_status, next_status)
  values (auth.uid(), target_user, old_status, next_status);
end;
$$;

drop trigger if exists journal_touch_updated_at on public.journal_entries;
create trigger journal_touch_updated_at
before update on public.journal_entries
for each row execute procedure public.touch_updated_at();

alter table public.journal_entries enable row level security;

drop policy if exists "journal_read_own" on public.journal_entries;
drop policy if exists "journal_insert_own" on public.journal_entries;
drop policy if exists "journal_update_own" on public.journal_entries;
drop policy if exists "journal_delete_own" on public.journal_entries;
drop policy if exists "journal_read_admin" on public.journal_entries;

create policy "journal_read_own" on public.journal_entries for select to authenticated
using (user_id = auth.uid() and public.is_active_member());
create policy "journal_insert_own" on public.journal_entries for insert to authenticated
with check (user_id = auth.uid() and public.is_active_member());
create policy "journal_update_own" on public.journal_entries for update to authenticated
using (user_id = auth.uid() and public.is_active_member())
with check (user_id = auth.uid() and public.is_active_member());
create policy "journal_delete_own" on public.journal_entries for delete to authenticated
using (user_id = auth.uid() and public.is_active_member());
create policy "journal_read_admin" on public.journal_entries for select to authenticated
using (public.is_admin());

grant select, insert, update, delete on public.journal_entries to authenticated;
grant all on public.journal_entries to service_role;
grant execute on function public.set_member_status(uuid, public.member_status) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('journal-screenshots', 'journal-screenshots', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "journal_screenshots_read_own" on storage.objects;
drop policy if exists "journal_screenshots_insert_own" on storage.objects;
drop policy if exists "journal_screenshots_update_own" on storage.objects;
drop policy if exists "journal_screenshots_delete_own" on storage.objects;
drop policy if exists "journal_screenshots_read_admin" on storage.objects;

create policy "journal_screenshots_read_own" on storage.objects for select to authenticated
using (bucket_id = 'journal-screenshots' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_member());
create policy "journal_screenshots_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'journal-screenshots' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_member());
create policy "journal_screenshots_update_own" on storage.objects for update to authenticated
using (bucket_id = 'journal-screenshots' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_member())
with check (bucket_id = 'journal-screenshots' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_member());
create policy "journal_screenshots_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'journal-screenshots' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_member());
create policy "journal_screenshots_read_admin" on storage.objects for select to authenticated
using (bucket_id = 'journal-screenshots' and public.is_admin());
