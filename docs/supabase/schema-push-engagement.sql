-- Nuts & Bolts — migración Prompt 8 (push engagement)
-- Aplicar en: Supabase Dashboard → SQL Editor → Run
-- Prerequisito: schema-push.sql (Prompt 7) ya aplicado

-- ---------------------------------------------------------------------------
-- Preferencias granulares (default true = opt-out)
-- ---------------------------------------------------------------------------
alter table public.nb_notification_preferences
  add column if not exists re_engagement boolean not null default true,
  add column if not exists app_updates boolean not null default true,
  add column if not exists new_content boolean not null default true,
  add column if not exists daily_streak boolean not null default true,
  add column if not exists weekly_summary boolean not null default true,
  add column if not exists milestones boolean not null default true,
  add column if not exists sync_reminder boolean not null default true;

comment on table public.nb_notification_preferences is
  'Preferencias push (opt-out). push_enabled=master; categorías on por defecto (Prompt 7–8).';

-- ---------------------------------------------------------------------------
-- Racha diaria en progreso (cron-daily-streak)
-- ---------------------------------------------------------------------------
alter table public.nb_player_progress
  add column if not exists current_streak integer not null default 0
    check (current_streak >= 0),
  add column if not exists last_streak_date date;

comment on column public.nb_player_progress.current_streak is
  'Días consecutivos con sync exitosa (Prompt 8 daily_streak).';
comment on column public.nb_player_progress.last_streak_date is
  'Fecha UTC del último día contado en la racha.';

-- ---------------------------------------------------------------------------
-- Anuncios de contenido (new_content / eventos estacionales)
-- ---------------------------------------------------------------------------
create table if not exists public.nb_content_announcements (
  id uuid primary key default gen_random_uuid(),
  game_id text not null check (char_length(game_id) between 1 and 64),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 500),
  kind text not null check (kind in ('levels', 'seasonal', 'changelog')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

comment on table public.nb_content_announcements is
  'Anuncios para push new_content (Prompt 8). Service role escribe; cron marca notified_at.';

create index if not exists nb_content_announcements_pending_idx
  on public.nb_content_announcements (game_id, created_at desc)
  where active = true and notified_at is null;

alter table public.nb_content_announcements enable row level security;

-- Lectura pública de anuncios activos (opcional UI futura); escritura solo service role
drop policy if exists "nb_content_announcements_select_active" on public.nb_content_announcements;
create policy "nb_content_announcements_select_active"
  on public.nb_content_announcements for select
  using (active = true);
