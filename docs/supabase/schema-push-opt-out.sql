-- Nuts & Bolts — push preferences: opt-in → opt-out (defaults on)
-- Aplicar en: Supabase Dashboard → SQL Editor → Run
-- Prerequisito: schema-push.sql + schema-push-engagement.sql (o schema.sql)

-- ---------------------------------------------------------------------------
-- Column defaults for new rows
-- ---------------------------------------------------------------------------
alter table public.nb_notification_preferences
  alter column push_enabled set default true,
  alter column rank_overtaken set default true,
  alter column re_engagement set default true,
  alter column app_updates set default true,
  alter column new_content set default true,
  alter column daily_streak set default true,
  alter column weekly_summary set default true,
  alter column milestones set default true,
  alter column sync_reminder set default true;

comment on table public.nb_notification_preferences is
  'Preferencias push (opt-out). push_enabled=master; categorías on por defecto; desactivar en Ajustes.';

-- ---------------------------------------------------------------------------
-- Existing rows with master already on but categories still off (legacy):
-- enable categories. Does NOT touch users who turned the master off.
-- Users without a prefs row get defaults on first client sync (getPreferences).
-- ---------------------------------------------------------------------------
update public.nb_notification_preferences
set
  rank_overtaken = true,
  re_engagement = true,
  app_updates = true,
  new_content = true,
  daily_streak = true,
  weekly_summary = true,
  milestones = true,
  sync_reminder = true,
  updated_at = now()
where push_enabled = true
  and (
    rank_overtaken = false
    or re_engagement = false
    or app_updates = false
    or new_content = false
    or daily_streak = false
    or weekly_summary = false
    or milestones = false
    or sync_reminder = false
  );
