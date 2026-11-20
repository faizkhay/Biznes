-- biznes.mu accounts, part 4: the one row of settings the superadmin edits.
--
-- The site picks the picture behind the page and its greeting by the calendar (src/lib/theme.ts).
-- A superadmin may set either by hand here; null means "leave it to the calendar".

create table public.site_settings (
  -- One row, and only ever one.
  id boolean primary key default true check (id),
  -- One of the picture ids in src/data/themes.ts. The website checks it against that list.
  picture text check (picture is null or picture ~ '^[a-z0-9-]{1,40}$'),
  greeting text check (greeting is null or char_length(btrim(greeting)) between 1 and 60),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
comment on table public.site_settings is 'A single row: the picture and greeting the superadmin has chosen, or null for the calendar''s.';
insert into public.site_settings (id) values (true);

create function private.site_settings_before_update() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.id := true;
  new.greeting := nullif(btrim(new.greeting), '');
  new.picture := nullif(btrim(new.picture), '');
  new.updated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.site_settings_before_update() from public;

create trigger site_settings_10_before_update
  before update on public.site_settings
  for each row execute function private.site_settings_before_update();

create function private.site_settings_audit() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.picture is distinct from old.picture or new.greeting is distinct from old.greeting then
    perform private.record('settings.look', 'site_settings', jsonb_build_object('picture', new.picture, 'greeting', new.greeting));
  end if;
  return null;
end;
$$;
revoke all on function private.site_settings_audit() from public;

create trigger site_settings_90_audit
  after update on public.site_settings
  for each row execute function private.site_settings_audit();

alter table public.site_settings enable row level security;

revoke all on table public.site_settings from anon, authenticated;
grant select (id, picture, greeting, updated_at) on table public.site_settings to anon;
grant select on table public.site_settings to authenticated;
grant update (picture, greeting) on table public.site_settings to authenticated;

-- The look of the site is public. Changing it is the superadmin's alone.
create policy site_settings_read on public.site_settings
  for select to anon, authenticated
  using (true);

create policy site_settings_update on public.site_settings
  for update to authenticated
  using ((select private.is_superadmin()))
  with check ((select private.is_superadmin()));
