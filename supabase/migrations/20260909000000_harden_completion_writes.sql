-- Harden completion writes without changing existing history.

-- Completion rows are inserted and removed by the V1 application flow.
-- The application does not use completion UPDATE; revoke the existing
-- column-level privilege so clients cannot rewrite history directly.
revoke update (completed_date, completed_at, completed_timezone)
  on table public.habit_completions
  from authenticated;

-- Keep the existing parent-row write/lock serialization while enforcing the
-- completeHabit business rules at the database boundary. This function is
-- also used by the existing UPDATE OF completed_date trigger for trusted
-- internal/administrative writes; existing rows are never backfilled here.
create or replace function public.routine_guard_completion_date()
returns trigger
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  habit_start_date date;
  habit_archived_at timestamptz;
  habit_schedule_type text;
  habit_days_of_week smallint[];
begin
  if not exists (
    select 1
    from pg_catalog.pg_timezone_names as zones
    where zones.name = new.completed_timezone
  ) then
    raise exception 'Unsupported completed_timezone: %', new.completed_timezone
      using errcode = '23514';
  end if;

  -- A real UPDATE locks the parent and preserves the existing serialization
  -- against concurrent habit schedule changes.
  update public.habits as habit
  set name = habit.name
  where habit.id = new.habit_id and habit.user_id = new.user_id
  returning habit.start_date, habit.archived_at, habit.schedule_type,
    habit.days_of_week
  into habit_start_date, habit_archived_at, habit_schedule_type,
    habit_days_of_week;

  if not found then
    raise exception 'Habit is missing or inaccessible to the completion owner'
      using errcode = '23503';
  end if;

  if habit_archived_at is not null then
    raise exception 'Archived habits cannot receive completions'
      using errcode = '23514';
  end if;

  if new.completed_date < habit_start_date then
    raise exception 'Completion date must be on or after the habit start date'
      using errcode = '23514';
  end if;

  if new.completed_date <>
    (pg_catalog.now() at time zone new.completed_timezone)::date then
    raise exception 'Completion date must be today in completed_timezone'
      using errcode = '23514';
  end if;

  if habit_schedule_type = 'specific_days'
    and not (
      extract(dow from new.completed_date)::smallint
        = any(habit_days_of_week)
    ) then
    raise exception 'Completion date is not scheduled for this habit'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

-- V1 undo semantics allow deleting only the completion for today in the
-- timezone recorded on that row. Do not inspect the parent habit here:
-- archive state must not prevent undoing an existing today's row.
create function public.routine_guard_completion_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if OLD.completed_date <>
    (pg_catalog.now() at time zone OLD.completed_timezone)::date then
    raise exception 'Only today''s completion can be removed'
      using errcode = '23514';
  end if;
  return OLD;
end;
$$;

revoke all on function public.routine_guard_completion_delete()
  from public, anon, authenticated;

create trigger habit_completions_guard_delete
before delete on public.habit_completions
for each row execute function public.routine_guard_completion_delete();
