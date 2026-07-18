-- Nuts & Bolts — nicknames únicos en ranking (v1.5.2)
-- Aplicar en: Supabase Dashboard → SQL Editor → Run
-- Prerequisito: schema.sql (nb_player_profiles)

-- ---------------------------------------------------------------------------
-- Backfill: perfiles sin nombre → Player_XXXXX (5 hex del user_id)
-- ---------------------------------------------------------------------------

update public.nb_player_profiles
set display_name = 'Player_' || upper(substr(replace(user_id::text, '-', ''), 1, 5))
where display_name is null
   or btrim(display_name) = '';

-- Resolver colisiones residuales del backfill (mismo fragmento en otro user)
do $$
declare
  r record;
  candidate text;
  n int;
begin
  for r in
    select p.user_id, p.game_id, p.display_name
    from public.nb_player_profiles p
    where exists (
      select 1
      from public.nb_player_profiles o
      where o.game_id = p.game_id
        and o.user_id <> p.user_id
        and lower(o.display_name) = lower(p.display_name)
    )
    order by p.created_at, p.user_id
  loop
    n := 0;
    loop
      n := n + 1;
      candidate := left(r.display_name, 14) || '_' || n::text;
      exit when not exists (
        select 1
        from public.nb_player_profiles o
        where o.game_id = r.game_id
          and lower(o.display_name) = lower(candidate)
      );
    end loop;
    update public.nb_player_profiles
    set display_name = candidate
    where user_id = r.user_id
      and game_id = r.game_id;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Unicidad case-insensitive por juego
-- ---------------------------------------------------------------------------

create unique index if not exists nb_player_profiles_display_name_unique
  on public.nb_player_profiles (game_id, lower(display_name))
  where display_name is not null;

comment on index public.nb_player_profiles_display_name_unique is
  'Nick único por game_id (case-insensitive). v1.5.2';

-- ---------------------------------------------------------------------------
-- Trigger: default Player_XXXXX si no hay nombre OAuth
-- ---------------------------------------------------------------------------

create or replace function public.nb_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_game_id constant text := 'nuts-and-bolts';
  resolved_name text;
begin
  resolved_name := nullif(
    btrim(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name'
      )
    ),
    ''
  );

  if resolved_name is null then
    resolved_name :=
      'Player_' || upper(substr(replace(new.id::text, '-', ''), 1, 5));
  end if;

  insert into public.nb_player_profiles (user_id, game_id, display_name, avatar_url)
  values (
    new.id,
    default_game_id,
    resolved_name,
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.nb_player_progress (user_id, game_id)
  values (new.id, default_game_id);

  return new;
end;
$$;
