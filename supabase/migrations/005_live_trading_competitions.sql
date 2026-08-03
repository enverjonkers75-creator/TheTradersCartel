do $$ begin
  create type public.competition_account_type as enum ('demo', 'real');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.trading_platform as enum ('mt4', 'mt5');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.trading_connection_status as enum ('awaiting_credentials', 'connecting', 'live', 'error');
exception when duplicate_object then null;
end $$;

create table if not exists public.competition_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider_account_id text not null unique,
  provider_region text,
  daily_tracker_id text,
  overall_tracker_id text,
  account_type public.competition_account_type not null,
  platform public.trading_platform not null,
  server text not null check (char_length(server) between 2 and 120),
  login_last4 text check (login_last4 is null or login_last4 ~ '^[0-9]{1,4}$'),
  account_name text,
  broker text,
  currency char(3) check (currency is null or currency ~ '^[A-Z]{3}$'),
  connection_status public.trading_connection_status not null default 'awaiting_credentials',
  is_read_only boolean not null default false,
  starting_balance numeric(20,2),
  current_balance numeric(20,2),
  current_equity numeric(20,2),
  return_percent numeric(12,6) not null default 0,
  maximum_daily_drawdown_percent numeric(12,6) not null default 0,
  maximum_overall_drawdown_percent numeric(12,6) not null default 0,
  maximum_risk_per_trade_percent numeric(12,6) not null default 0,
  education_points integer not null default 0 check (education_points >= 0),
  seminar_points integer not null default 0 check (seminar_points >= 0),
  rule_breaches text[] not null default '{}',
  connected_at timestamptz,
  last_synced_at timestamptz,
  sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, account_type)
);

create index if not exists competition_accounts_ranking_idx
on public.competition_accounts(account_type, connection_status, return_percent desc);

create table if not exists public.seminar_attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  seminar_key text not null check (char_length(seminar_key) between 2 and 100),
  points integer not null default 10 check (points between 0 and 1000),
  attended_at timestamptz not null default now(),
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (user_id, seminar_key)
);

drop trigger if exists competition_accounts_touch_updated_at on public.competition_accounts;
create trigger competition_accounts_touch_updated_at
before update on public.competition_accounts
for each row execute procedure public.touch_updated_at();

alter table public.competition_accounts enable row level security;
alter table public.seminar_attendance enable row level security;

create policy "competition_accounts_read_self_or_admin"
on public.competition_accounts for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "seminar_attendance_read_self_or_admin"
on public.seminar_attendance for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create or replace function public.set_seminar_attendance(
  target_user uuid,
  target_seminar_key text,
  target_points integer default 10
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator access required';
  end if;
  if char_length(trim(target_seminar_key)) < 2 or target_points < 0 or target_points > 1000 then
    raise exception 'Invalid attendance information';
  end if;

  insert into public.seminar_attendance(user_id, seminar_key, points, recorded_by)
  values (target_user, trim(target_seminar_key), target_points, auth.uid())
  on conflict (user_id, seminar_key)
  do update set points = excluded.points, attended_at = now(), recorded_by = auth.uid();
end;
$$;

grant select on public.competition_accounts, public.seminar_attendance to authenticated;
grant all on public.competition_accounts, public.seminar_attendance to service_role;
grant execute on function public.set_seminar_attendance(uuid, text, integer) to authenticated;
