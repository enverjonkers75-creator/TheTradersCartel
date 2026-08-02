create table if not exists public.course_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_key text not null check (char_length(lesson_key) between 2 and 80),
  watched_seconds integer not null default 0 check (watched_seconds >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_key)
);

create index if not exists course_progress_user_idx on public.course_lesson_progress(user_id, created_at);

drop trigger if exists course_progress_touch_updated_at on public.course_lesson_progress;
create trigger course_progress_touch_updated_at
before update on public.course_lesson_progress
for each row execute procedure public.touch_updated_at();

alter table public.course_lesson_progress enable row level security;

create policy "course_progress_read_own" on public.course_lesson_progress for select to authenticated
using (user_id = auth.uid() and public.is_active_member());
create policy "course_progress_insert_own" on public.course_lesson_progress for insert to authenticated
with check (user_id = auth.uid() and public.is_active_member());
create policy "course_progress_update_own" on public.course_lesson_progress for update to authenticated
using (user_id = auth.uid() and public.is_active_member())
with check (user_id = auth.uid() and public.is_active_member());

grant select, insert, update on public.course_lesson_progress to authenticated;
grant all on public.course_lesson_progress to service_role;
