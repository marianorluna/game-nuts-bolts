-- Nuts & Bolts — migración Prompt 7 (push FCM)
-- Aplicar en: Supabase Dashboard → SQL Editor → Run
-- Prerequisito: schema.sql (Prompt 1) + schema-prompt6.sql ya aplicados

-- ---------------------------------------------------------------------------
-- nb_push_tokens — tokens FCM por dispositivo
-- ---------------------------------------------------------------------------
create table if not exists public.nb_push_tokens (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null check (char_length(game_id) between 1 and 64),
  fcm_token text not null check (char_length(fcm_token) between 1 and 512),
  platform text not null check (platform in ('android', 'ios', 'web')),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id, fcm_token)
);

comment on table public.nb_push_tokens is
  'Tokens FCM por usuario/juego/dispositivo (Prompt 7).';

create index if not exists nb_push_tokens_user_game_idx
  on public.nb_push_tokens (user_id, game_id);

-- ---------------------------------------------------------------------------
-- nb_notification_preferences — opt-out por categoría (on por defecto)
-- ---------------------------------------------------------------------------
create table if not exists public.nb_notification_preferences (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null check (char_length(game_id) between 1 and 64),
  push_enabled boolean not null default true,
  rank_overtaken boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

comment on table public.nb_notification_preferences is
  'Preferencias push (opt-out). push_enabled=master; rank_overtaken requiere también show_in_leaderboard.';

drop trigger if exists nb_notification_preferences_set_updated_at on public.nb_notification_preferences;
create trigger nb_notification_preferences_set_updated_at
  before update on public.nb_notification_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- nb_push_log — rate limit (máx. 3/día rank_overtaken)
-- ---------------------------------------------------------------------------
create table if not exists public.nb_push_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null check (char_length(game_id) between 1 and 64),
  type text not null check (char_length(type) between 1 and 64),
  created_at timestamptz not null default now()
);

comment on table public.nb_push_log is
  'Historial de envíos para rate limiting (Prompt 7–8).';

create index if not exists nb_push_log_rate_idx
  on public.nb_push_log (user_id, game_id, type, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.nb_push_tokens enable row level security;
alter table public.nb_notification_preferences enable row level security;
alter table public.nb_push_log enable row level security;

drop policy if exists "nb_push_tokens_select_own" on public.nb_push_tokens;
drop policy if exists "nb_push_tokens_insert_own" on public.nb_push_tokens;
drop policy if exists "nb_push_tokens_update_own" on public.nb_push_tokens;
drop policy if exists "nb_push_tokens_delete_own" on public.nb_push_tokens;
drop policy if exists "nb_notification_prefs_select_own" on public.nb_notification_preferences;
drop policy if exists "nb_notification_prefs_insert_own" on public.nb_notification_preferences;
drop policy if exists "nb_notification_prefs_update_own" on public.nb_notification_preferences;
drop policy if exists "nb_push_log_select_own" on public.nb_push_log;

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

-- push_log: solo service role escribe; usuario puede leer lo propio (opcional)
create policy "nb_push_log_select_own"
  on public.nb_push_log for select
  using (auth.uid() = user_id);
