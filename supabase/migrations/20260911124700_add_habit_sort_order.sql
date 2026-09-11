-- Routine V2.1-1: stable ordering for active habits.

-- Add nullable first so existing rows can be seeded safely.
alter table public.habits add column sort_order integer;

with seeded as (
  select
    id,
    row_number() over (partition by user_id order by created_at asc, id asc)::integer as position
  from public.habits
)
update public.habits as habit
set sort_order = seeded.position
from seeded
where habit.id = seeded.id;

alter table public.habits
  alter column sort_order set not null;

create function public.routine_assign_habit_sort_order()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_position integer;
begin
  -- Serialize inserts for one user so concurrent creates do not choose the
  -- same next position. Advisory locks do not alter habit ownership/RLS.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  select coalesce(max(habit.sort_order), 0) + 1
    into next_position
  from public.habits as habit
  where habit.user_id = new.user_id
    and habit.archived_at is null;

  new.sort_order := next_position;
  return new;
end;
$$;

revoke all on function public.routine_assign_habit_sort_order() from public, anon, authenticated;

create trigger habits_assign_sort_order
before insert on public.habits
for each row execute function public.routine_assign_habit_sort_order();

create function public.reorder_habits(habit_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  current_user_id uuid := auth.uid();
  active_count integer;
  payload_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if habit_ids is null or pg_catalog.array_position(habit_ids, null) is not null then
    raise exception 'Invalid habit order payload' using errcode = '22023';
  end if;

  select count(*)::integer into active_count
  from public.habits
  where user_id = current_user_id and archived_at is null;

  select count(distinct value)::integer into payload_count
  from pg_catalog.unnest(habit_ids) as payload(value);

  if pg_catalog.cardinality(habit_ids) <> payload_count then
    raise exception 'Duplicate habit id in order payload' using errcode = '22023';
  end if;

  if active_count <> pg_catalog.cardinality(habit_ids)
     or exists (
       select 1 from public.habits as habit
       where habit.user_id = current_user_id
         and habit.archived_at is null
         and not (habit.id = any(habit_ids))
     )
     or exists (
       select 1 from pg_catalog.unnest(habit_ids) as payload(value)
       where not exists (
         select 1 from public.habits as habit
         where habit.id = payload.value
           and habit.user_id = current_user_id
           and habit.archived_at is null
       )
     ) then
    raise exception 'Habit order payload must contain all active habits' using errcode = '22023';
  end if;

  update public.habits as habit
  set sort_order = payload.position::integer
  from pg_catalog.unnest(habit_ids) with ordinality as payload(id, position)
  where habit.id = payload.id
    and habit.user_id = current_user_id
    and habit.archived_at is null;
end;
$$;

revoke all on function public.reorder_habits(uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_habits(uuid[]) to authenticated;

-- sort_order is assigned by the insert trigger or reorder_habits RPC. Existing
-- habit edit clients must not gain direct ordering UPDATE access.
revoke update (sort_order) on table public.habits from public, anon, authenticated;
