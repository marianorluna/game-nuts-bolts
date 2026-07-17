-- Nuts & Bolts — esquema Supabase (Prompt 1)
-- Proyecto multi-juego: tablas compartidas con prefijo nb_ + columna game_id
-- Aplicar en: Supabase Dashboard → SQL Editor → Run (proyecto nuevo o limpio)
-- Reglas de ranking: docs/RANKING_RULES.md
-- game_id de este juego: nuts-and-bolts (VITE_GAME_ID en .env.local)

-- ---------------------------------------------------------------------------
-- Limpieza opcional (solo si aplicaste una versión anterior sin nb_/game_id)
-- ---------------------------------------------------------------------------
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user();
-- drop table if exists public.leaderboard_events cascade;
-- drop table if exists public.player_progress cascade;
-- drop table if exists public.player_profiles cascade;

-- ---------------------------------------------------------------------------
-- Extensiones
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tablas (prefijo nb_, PK compuesta user_id + game_id)
-- ---------------------------------------------------------------------------

create table public.nb_player_profiles (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null check (char_length(game_id) between 1 and 64),
  display_name text,
  avatar_url text,
  show_in_leaderboard boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

comment on table public.nb_player_profiles is
  'Perfil por juego. Mismo auth.users puede tener filas distintas por game_id.';
comment on column public.nb_player_profiles.game_id is
  'Identificador del juego, ej. nuts-and-bolts. Filtrar siempre en queries.';

create table public.nb_player_progress (
  user_id uuid not null,
  game_id text not null,
  unlocked_level integer not null default 1 check (unlocked_level >= 1),
  levels jsonb not null default '{}'::jsonb,
  -- Columnas denormalizadas para ORDER BY en leaderboard (criterios 1–6)
  completed_levels integer not null default 0 check (completed_levels >= 0),
  total_stars integer not null default 0 check (total_stars >= 0),
  weighted_tier_points integer not null default 0 check (weighted_tier_points >= 0),
  moves_tiebreak_key text not null default '' check (char_length(moves_tiebreak_key) <= 4096),
  total_best_moves integer not null default 0 check (total_best_moves >= 0),
  rank_snapshot_at timestamptz,
  last_played_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id),
  foreign key (user_id, game_id)
    references public.nb_player_profiles (user_id, game_id)
    on delete cascade
);

comment on column public.nb_player_progress.last_played_at is
  'Última sync exitosa de progreso. Alimenta push re-engagement (Prompt 8).';

comment on column public.nb_player_progress.levels is
  'Record<number, LevelProgress> — stars, bestMoves, completed por nivel.';
comment on column public.nb_player_progress.moves_tiebreak_key is
  'Clave lexicográfica criterio 4: bestMoves por nivel (id alto→bajo), zero-padded. Menor = mejor.';

create table public.nb_leaderboard_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null check (char_length(game_id) between 1 and 64),
  event_type text not null check (event_type in ('level_completed', 'rank_up', 'opt_in')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.nb_leaderboard_events is
  'Feed de eventos por juego (Prompt 6). Solo usuarios con opt-in en ese game_id.';

-- ---------------------------------------------------------------------------
-- Índices (leaderboard + feed; siempre filtrar por game_id)
-- ---------------------------------------------------------------------------

create index nb_player_progress_leaderboard_idx on public.nb_player_progress (
  game_id,
  completed_levels desc,
  total_stars desc,
  weighted_tier_points desc,
  moves_tiebreak_key asc,
  total_best_moves asc,
  rank_snapshot_at asc nulls last
);

create index nb_player_profiles_leaderboard_opt_in_idx
  on public.nb_player_profiles (game_id, show_in_leaderboard)
  where show_in_leaderboard = true;

create index nb_leaderboard_events_game_created_idx
  on public.nb_leaderboard_events (game_id, created_at desc);

create index nb_leaderboard_events_user_game_idx
  on public.nb_leaderboard_events (user_id, game_id);

create index nb_player_progress_last_played_idx
  on public.nb_player_progress (game_id, last_played_at asc nulls last);

-- ---------------------------------------------------------------------------
-- Push FCM (Prompt 7)
-- ---------------------------------------------------------------------------

create table public.nb_push_tokens (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null check (char_length(game_id) between 1 and 64),
  fcm_token text not null check (char_length(fcm_token) between 1 and 512),
  platform text not null check (platform in ('android', 'ios', 'web')),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id, fcm_token)
);

comment on table public.nb_push_tokens is
  'Tokens FCM por usuario/juego/dispositivo (Prompt 7).';

create index nb_push_tokens_user_game_idx
  on public.nb_push_tokens (user_id, game_id);

create table public.nb_notification_preferences (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null check (char_length(game_id) between 1 and 64),
  push_enabled boolean not null default false,
  rank_overtaken boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

comment on table public.nb_notification_preferences is
  'Preferencias push. push_enabled=master; rank_overtaken requiere también show_in_leaderboard.';

create table public.nb_push_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null check (char_length(game_id) between 1 and 64),
  type text not null check (char_length(type) between 1 and 64),
  created_at timestamptz not null default now()
);

comment on table public.nb_push_log is
  'Historial de envíos para rate limiting (Prompt 7–8).';

create index nb_push_log_rate_idx
  on public.nb_push_log (user_id, game_id, type, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger nb_player_profiles_set_updated_at
  before update on public.nb_player_profiles
  for each row execute function public.set_updated_at();

create trigger nb_player_progress_set_updated_at
  before update on public.nb_player_progress
  for each row execute function public.set_updated_at();

create trigger nb_notification_preferences_set_updated_at
  before update on public.nb_notification_preferences
  for each row execute function public.set_updated_at();

-- Perfil + progreso inicial al registrarse (solo este juego; Prompt 4 auth)
create or replace function public.nb_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_game_id constant text := 'nuts-and-bolts';
begin
  insert into public.nb_player_profiles (user_id, game_id, display_name, avatar_url)
  values (
    new.id,
    default_game_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.nb_player_progress (user_id, game_id)
  values (new.id, default_game_id);

  return new;
end;
$$;

create trigger nb_on_auth_user_created
  after insert on auth.users
  for each row execute function public.nb_handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.nb_player_profiles enable row level security;
alter table public.nb_player_progress enable row level security;
alter table public.nb_leaderboard_events enable row level security;

-- nb_player_profiles: propio CRUD; lectura pública solo opt-in (mismo game_id)
create policy "nb_profiles_select_own"
  on public.nb_player_profiles for select
  using (auth.uid() = user_id);

create policy "nb_profiles_select_public_leaderboard"
  on public.nb_player_profiles for select
  using (show_in_leaderboard = true);

create policy "nb_profiles_insert_own"
  on public.nb_player_profiles for insert
  with check (auth.uid() = user_id);

create policy "nb_profiles_update_own"
  on public.nb_player_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- nb_player_progress: propio CRUD; lectura pública si perfil opt-in en mismo game_id
create policy "nb_progress_select_own"
  on public.nb_player_progress for select
  using (auth.uid() = user_id);

create policy "nb_progress_select_public_leaderboard"
  on public.nb_player_progress for select
  using (
    exists (
      select 1
      from public.nb_player_profiles p
      where p.user_id = nb_player_progress.user_id
        and p.game_id = nb_player_progress.game_id
        and p.show_in_leaderboard = true
    )
  );

create policy "nb_progress_insert_own"
  on public.nb_player_progress for insert
  with check (auth.uid() = user_id);

create policy "nb_progress_update_own"
  on public.nb_player_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- nb_leaderboard_events: insert propio; lectura pública si autor opt-in en mismo game_id
create policy "nb_events_insert_own"
  on public.nb_leaderboard_events for insert
  with check (auth.uid() = user_id);

create policy "nb_events_select_own"
  on public.nb_leaderboard_events for select
  using (auth.uid() = user_id);

create policy "nb_events_select_public_opt_in"
  on public.nb_leaderboard_events for select
  using (
    exists (
      select 1
      from public.nb_player_profiles p
      where p.user_id = nb_leaderboard_events.user_id
        and p.game_id = nb_leaderboard_events.game_id
        and p.show_in_leaderboard = true
    )
  );

-- nb_push_tokens: solo propio CRUD
alter table public.nb_push_tokens enable row level security;
alter table public.nb_notification_preferences enable row level security;
alter table public.nb_push_log enable row level security;

create policy "nb_push_tokens_select_own"
  on public.nb_push_tokens for select
  using (auth.uid() = user_id);

create policy "nb_push_tokens_insert_own"
  on public.nb_push_tokens for insert
  with check (auth.uid() = user_id);

create policy "nb_push_tokens_update_own"
  on public.nb_push_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "nb_push_tokens_delete_own"
  on public.nb_push_tokens for delete
  using (auth.uid() = user_id);

create policy "nb_notification_prefs_select_own"
  on public.nb_notification_preferences for select
  using (auth.uid() = user_id);

create policy "nb_notification_prefs_insert_own"
  on public.nb_notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "nb_notification_prefs_update_own"
  on public.nb_notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "nb_push_log_select_own"
  on public.nb_push_log for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Realtime (Prompt 6) — leaderboard en vivo
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.nb_player_progress;
alter publication supabase_realtime add table public.nb_leaderboard_events;
