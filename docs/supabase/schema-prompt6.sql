-- Nuts & Bolts — migración Prompt 6 (ranking realtime)
-- Aplicar en: Supabase Dashboard → SQL Editor → Run
-- Prerequisito: schema.sql (Prompt 1) ya aplicado

-- ---------------------------------------------------------------------------
-- last_played_at — re-engagement (Prompt 8)
-- ---------------------------------------------------------------------------
alter table public.nb_player_progress
  add column if not exists last_played_at timestamptz;

comment on column public.nb_player_progress.last_played_at is
  'Última sync exitosa de progreso. Alimenta push re-engagement (Prompt 8).';

create index if not exists nb_player_progress_last_played_idx
  on public.nb_player_progress (game_id, last_played_at asc nulls last);

-- ---------------------------------------------------------------------------
-- Realtime — leaderboard en vivo
-- ---------------------------------------------------------------------------
-- Idempotente: ignora si la tabla ya está en la publication
do $$
begin
  alter publication supabase_realtime add table public.nb_player_progress;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.nb_leaderboard_events;
exception
  when duplicate_object then null;
end $$;
