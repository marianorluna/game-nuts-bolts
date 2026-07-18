-- Nuts & Bolts — catálogo público versionCode → semver (modal in-app update)
-- Aplicar en: Supabase Dashboard → SQL Editor → Run
-- Lectura anónima; escritura solo service role (notify-app-update / manual)

create table if not exists public.nb_app_releases (
  game_id text not null check (char_length(game_id) between 1 and 64),
  version_code integer not null check (version_code > 0),
  version text not null check (char_length(version) between 1 and 32),
  created_at timestamptz not null default now(),
  primary key (game_id, version_code)
);

comment on table public.nb_app_releases is
  'Mapeo versionCode (Play) → semver para UI de actualización. Público de lectura.';

create index if not exists nb_app_releases_game_version_idx
  on public.nb_app_releases (game_id, version);

alter table public.nb_app_releases enable row level security;

drop policy if exists "nb_app_releases_select_public" on public.nb_app_releases;
create policy "nb_app_releases_select_public"
  on public.nb_app_releases for select
  using (true);

-- Semilla de releases ya publicados (idempotente)
insert into public.nb_app_releases (game_id, version_code, version) values
  ('nuts-and-bolts', 1, '1.0.0'),
  ('nuts-and-bolts', 2, '1.1.0'),
  ('nuts-and-bolts', 3, '1.2.0'),
  ('nuts-and-bolts', 4, '1.2.1'),
  ('nuts-and-bolts', 5, '1.3.0'),
  ('nuts-and-bolts', 6, '1.4.0'),
  ('nuts-and-bolts', 7, '1.5.0'),
  ('nuts-and-bolts', 8, '1.5.1'),
  ('nuts-and-bolts', 9, '1.5.2')
on conflict (game_id, version_code) do update
  set version = excluded.version;
