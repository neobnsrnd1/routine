-- Routine V1. Apply once through migration history; no remote application here.

-- CHECK cannot contain subqueries directly. This pure helper validates arrays
-- without depending on table data, session settings, or evaluation order.
create function public.routine_valid_weekdays(weekdays smallint[])
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select coalesce(
    pg_catalog.array_ndims(weekdays) = 1
    and pg_catalog.cardinality(weekdays) between 1 and 7
    and not exists (
      select 1
      from pg_catalog.unnest(weekdays) as days(day_number)
      where day_number is null or day_number not between 0 and 6
    )
    and pg_catalog.cardinality(weekdays) = (
      select count(distinct day_number)
      from pg_catalog.unnest(weekdays) as days(day_number)
    ),
    false
  );
$$;

revoke all on function public.routine_valid_weekdays(smallint[])
  from public, anon, authenticated;
grant execute on function public.routine_valid_weekdays(smallint[])
  to authenticated;

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  schedule_type text not null,
  days_of_week smallint[],
  target_per_week smallint,
  start_date date not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Account removal must explicitly delete completions, then habits, then
  -- auth.users using a trusted administrative transaction. No CASCADE in V1.
  constraint habits_user_id_fkey foreign key (user_id)
    references auth.users (id) on update restrict on delete restrict,
  -- Referenced by the completion's composite ownership foreign key.
  constraint habits_id_user_id_key unique (id, user_id),
  constraint habits_name_check check (
    char_length(btrim(name)) > 0 and char_length(name) <= 100
  ),
  constraint habits_schedule_type_check check (
    schedule_type in ('daily', 'specific_days', 'weekly_target')
  ),
  -- Explicit IS NOT NULL checks prevent SQL NULL from bypassing CHECK.
  constraint habits_schedule_values_check check (
    (schedule_type = 'daily'
      and days_of_week is null and target_per_week is null)
    or (schedule_type = 'specific_days'
      and days_of_week is not null
      and public.routine_valid_weekdays(days_of_week)
      and target_per_week is null)
    or (schedule_type = 'weekly_target'
      and days_of_week is null
      and target_per_week is not null
      and target_per_week between 1 and 7)
  )
);

create table public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null,
  user_id uuid not null,
  completed_date date not null,
  -- Unknown historical performance time remains NULL, never fabricated.
  completed_at timestamptz,
  completed_timezone text not null,
  created_at timestamptz not null default now(),

  -- A caller cannot attach their user_id to another user's habit.
  -- RESTRICT also prevents accidental deletion of a habit with history.
  constraint habit_completions_habit_owner_fkey
    foreign key (habit_id, user_id)
    references public.habits (id, user_id)
    on update restrict on delete restrict,
  constraint habit_completions_habit_date_key
    unique (habit_id, completed_date),
  constraint habit_completions_timezone_nonempty_check check (
    char_length(btrim(completed_timezone)) > 0
  )
);

-- RLS/user list filtering. PK/UNIQUE indexes already cover id and habit_id.
create index habits_user_id_idx on public.habits (user_id);
-- Calendar and period queries for one user.
create index habit_completions_user_date_idx
  on public.habit_completions (user_id, completed_date);

-- Use a trigger rather than relying on every client to maintain updated_at.
create function public.routine_set_habit_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.name is distinct from old.name
    or new.schedule_type is distinct from old.schedule_type
    or new.days_of_week is distinct from old.days_of_week
    or new.target_per_week is distinct from old.target_per_week
    or new.start_date is distinct from old.start_date
    or new.archived_at is distinct from old.archived_at
  then
    new.updated_at := pg_catalog.statement_timestamp();
  else
    new.updated_at := old.updated_at;
  end if;
  -- Always return NEW: skipping the physical UPDATE would weaken the
  -- completion serialization mechanism even when all values are unchanged.
  return new;
end;
$$;

revoke all on function public.routine_set_habit_updated_at()
  from public, anon, authenticated;

create trigger habits_set_updated_at
before update on public.habits
for each row execute function public.routine_set_habit_updated_at();

-- Conditional mutability cannot be expressed with column grants alone.
-- The UPDATE already locks its habit row. Completion INSERT also writes that
-- row below, so its existence cannot race past this check.
create function public.routine_guard_habit_schedule()
returns trigger
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if (
    new.schedule_type is distinct from old.schedule_type
    or new.days_of_week is distinct from old.days_of_week
    or new.target_per_week is distinct from old.target_per_week
    or new.start_date is distinct from old.start_date
  ) and exists (
    select 1 from public.habit_completions as completion
    where completion.habit_id = old.id
      and completion.user_id = old.user_id
  ) then
    raise exception 'Cannot change the schedule of a habit with completions; archive it and create a new habit'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.routine_guard_habit_schedule()
  from public, anon, authenticated;

create trigger habits_guard_schedule
before update on public.habits
for each row execute function public.routine_guard_habit_schedule();

-- A plain EXISTS check or FK lock alone does not serialize first completion
-- creation with schedule edits. Write the parent row before inserting or
-- updating a completion date, and read start_date from that same UPDATE.
-- A real UPDATE (rather than only SELECT FOR UPDATE) also produces a
-- serialization failure for conflicting stale REPEATABLE READ snapshots.
-- This uses the caller's existing name UPDATE privilege and both tables' RLS;
-- it grants no elevated privileges and does not change the habit's name.
-- The updated_at trigger preserves the timestamp for this no-op UPDATE;
-- PostgreSQL still writes/locks the row, preserving concurrency protection.
-- Completion undo does not touch the parent; after all completions have been
-- removed, schedule edits are allowed again (current existence, not history).
create function public.routine_guard_completion_date()
returns trigger
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  habit_start_date date;
begin
  update public.habits as habit
  set name = habit.name
  where habit.id = new.habit_id and habit.user_id = new.user_id
  returning habit.start_date into habit_start_date;

  if not found then
    raise exception 'Habit is missing or inaccessible to the completion owner'
      using errcode = '23503';
  end if;

  if new.completed_date < habit_start_date then
    raise exception 'Completion date must be on or after the habit start date'
      using errcode = '23514';
  end if;
  -- NULL dates remain prohibited by NOT NULL. No archived_at boundary in V1.
  return new;
end;
$$;

revoke all on function public.routine_guard_completion_date()
  from public, anon, authenticated;

create trigger habit_completions_serialize_insert
before insert or update of completed_date on public.habit_completions
for each row execute function public.routine_guard_completion_date();

-- timezone names come from PostgreSQL's installed timezone database.
-- Use a trigger, not an IMMUTABLE CHECK against a changing catalog/view.
-- Names such as Asia/Seoul and UTC are accepted; raw numeric offsets are not.
create function public.routine_validate_completion_timezone()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from pg_catalog.pg_timezone_names as zones
    where zones.name = new.completed_timezone
  ) then
    raise exception 'Unsupported completed_timezone: %', new.completed_timezone
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.routine_validate_completion_timezone()
  from public, anon, authenticated;

create trigger habit_completions_validate_timezone
before insert or update of completed_timezone on public.habit_completions
for each row execute function public.routine_validate_completion_timezone();

alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;

-- Replace inherited/default API grants with the exact V1 client privileges.
-- No TRUNCATE, REFERENCES, TRIGGER or habit DELETE grants for clients.
revoke all on table public.habits, public.habit_completions
  from public, anon, authenticated;
grant select, insert on table public.habits to authenticated;
grant select, insert, delete on table public.habit_completions
  to authenticated;

-- Do not grant table-level UPDATE: it would override these column limits.
-- Client-immutable after INSERT: habits(id, user_id, created_at) and
-- habit_completions(id, habit_id, user_id, created_at).
-- updated_at is also not client-editable; the BEFORE UPDATE trigger owns it.
-- PostgREST PATCH/upsert updates must send only the permitted columns, not an
-- entire fetched row. These limits apply to authenticated, not DB admins.
grant update (name, archived_at, schedule_type, days_of_week,
  target_per_week, start_date) on table public.habits to authenticated;
grant update (completed_date, completed_at, completed_timezone)
  on table public.habit_completions to authenticated;

create policy habits_select_own on public.habits
for select to authenticated
using ((select auth.uid()) = user_id);

create policy habits_insert_own on public.habits
for insert to authenticated
with check ((select auth.uid()) = user_id);

-- Validate ownership both before and after UPDATE.
create policy habits_update_own on public.habits
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Intentionally no habits DELETE policy: archive by updating archived_at.
-- Archive does not hide or delete any historical completion rows.

create policy habit_completions_select_own on public.habit_completions
for select to authenticated
using ((select auth.uid()) = user_id);

create policy habit_completions_insert_own on public.habit_completions
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy habit_completions_update_own on public.habit_completions
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Removing a completion is the V1 undo operation.
create policy habit_completions_delete_own on public.habit_completions
for delete to authenticated
using ((select auth.uid()) = user_id);
