create table if not exists public.member_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.member_presence enable row level security;

create policy "presence_read_self_or_admin" on public.member_presence for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create or replace function public.touch_member_activity()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  seen_at timestamptz := now();
begin
  if not public.is_active_member(auth.uid()) then
    raise exception 'Active membership required';
  end if;

  insert into public.member_presence(user_id, last_seen_at)
  values (auth.uid(), seen_at)
  on conflict (user_id) do update set last_seen_at = excluded.last_seen_at;

  return seen_at;
end;
$$;

create or replace function public.mark_member_offline()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.member_presence where user_id = auth.uid();
end;
$$;

grant select on public.member_presence to authenticated;
grant all on public.member_presence to service_role;
grant execute on function public.touch_member_activity() to authenticated;
grant execute on function public.mark_member_offline() to authenticated;
