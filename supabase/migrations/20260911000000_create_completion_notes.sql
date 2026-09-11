-- Routine V2.0-1: optional notes attached to existing completion facts.
-- Completion rows remain immutable from the client perspective. Notes are
-- mutable metadata and are owned by the same user as their completion.

-- The primary key on habit_completions.id already guarantees completion
-- identity. This additional unique constraint makes (id, user_id) available
-- as a composite ownership target, matching the existing habit ownership FK
-- pattern and preventing note.user_id from diverging at the database layer.
alter table public.habit_completions
  add constraint habit_completions_id_user_id_key unique (id, user_id);

create table public.habit_completion_notes (
  completion_id uuid not null,
  user_id uuid not null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint habit_completion_notes_pkey primary key (completion_id),
  constraint habit_completion_notes_completion_owner_fkey
    foreign key (completion_id, user_id)
    references public.habit_completions (id, user_id)
    on update restrict on delete cascade,
  constraint habit_completion_notes_note_check check (
    char_length(note) between 1 and 1000
    and char_length(btrim(note)) > 0
  )
);

create index habit_completion_notes_user_id_idx
  on public.habit_completion_notes (user_id);

create function public.routine_set_completion_note_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.statement_timestamp();
  return new;
end;
$$;

revoke all on function public.routine_set_completion_note_updated_at()
  from public, anon, authenticated;

create trigger habit_completion_notes_set_updated_at
before update on public.habit_completion_notes
for each row execute function public.routine_set_completion_note_updated_at();

alter table public.habit_completion_notes enable row level security;

revoke all on table public.habit_completion_notes
  from public, anon, authenticated;
grant select on table public.habit_completion_notes to authenticated;
grant insert (completion_id, user_id, note) on table public.habit_completion_notes
  to authenticated;
grant update (note) on table public.habit_completion_notes to authenticated;
grant delete on table public.habit_completion_notes to authenticated;

create policy habit_completion_notes_select_own on public.habit_completion_notes
for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.habit_completions as completion
    where completion.id = habit_completion_notes.completion_id
      and completion.user_id = habit_completion_notes.user_id
  )
);

-- New notes may only be attached while the parent habit is active. This does
-- not affect existing notes: their SELECT/UPDATE/DELETE policies below do not
-- require the habit to remain active.
create policy habit_completion_notes_insert_own on public.habit_completion_notes
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.habit_completions as completion
    join public.habits as habit
      on habit.id = completion.habit_id
     and habit.user_id = completion.user_id
    where completion.id = habit_completion_notes.completion_id
      and completion.user_id = habit_completion_notes.user_id
      and habit.archived_at is null
  )
);

create policy habit_completion_notes_update_own on public.habit_completion_notes
for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.habit_completions as completion
    where completion.id = habit_completion_notes.completion_id
      and completion.user_id = habit_completion_notes.user_id
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.habit_completions as completion
    where completion.id = habit_completion_notes.completion_id
      and completion.user_id = habit_completion_notes.user_id
  )
);

create policy habit_completion_notes_delete_own on public.habit_completion_notes
for delete to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.habit_completions as completion
    where completion.id = habit_completion_notes.completion_id
      and completion.user_id = habit_completion_notes.user_id
  )
);
