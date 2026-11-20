-- biznes.mu accounts, part 1: people, their roles, and the record of what admins do.
--
-- Every privilege on the site is decided here, in the database. The website talks to it with the
-- publishable (anon) key only: a visitor is the role `anon`, a signed-in person is `authenticated`,
-- and what either may read or change is set by the grants and the row level security below. There
-- is no service-role key anywhere in the site.
--
-- Two rules run through all four migrations:
--   1. The API roles are granted only the columns they may touch. Supabase grants everything on a
--      new table in `public` to `anon` and `authenticated` by default, so each table revokes that
--      first and grants back by name.
--   2. A guard trigger repeats the rule, so a careless grant later cannot open a door. It looks at
--      `current_user`: a statement sent through the API runs as `anon` or `authenticated`; a
--      statement inside one of the functions below runs as the function's owner.

-- Helpers the policies call. They live outside `public`, so the API cannot call them directly.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text not null default '' check (char_length(name) <= 120),
  phone text not null default '' check (phone = '' or phone ~ '^\+?[0-9 ().-]{7,20}$'),
  role text not null default 'user' check (role in ('user', 'admin', 'superadmin')),
  created_at timestamptz not null default now()
);
comment on table public.profiles is 'One row a person, made when they sign up. The first person ever to sign up is the superadmin.';

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid references public.profiles (id) on delete set null,
  action text not null,
  subject text not null default '',
  detail jsonb not null default '{}'::jsonb
);
comment on table public.audit_log is 'What admins did, who did it and when. Written by triggers only; read by admins.';
create index audit_log_at on public.audit_log (at desc);

-- The role of whoever is asking. Security definer, so a policy on profiles can call it without
-- reading profiles through itself.
create function private.my_role() returns text
language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(private.my_role() in ('admin', 'superadmin'), false);
$$;

create function private.is_superadmin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(private.my_role() = 'superadmin', false);
$$;

revoke all on function private.my_role() from public;
revoke all on function private.is_admin() from public;
revoke all on function private.is_superadmin() from public;
grant execute on function private.my_role() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_superadmin() to authenticated;

-- One line in the record. Called by the triggers below, never by the API.
create function private.record(action text, subject text, detail jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = ''
as $$
  insert into public.audit_log (actor, action, subject, detail)
  values ((select id from public.profiles where id = (select auth.uid())), action, subject, coalesce(detail, '{}'::jsonb));
$$;
revoke all on function private.record(text, text, jsonb) from public;

-- A profile for each new person. The first one ever made is the superadmin: the owner registers
-- before the site is launched. Everyone after is a regular user.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  first boolean;
begin
  -- One at a time, so two people signing up together cannot both be first.
  perform pg_advisory_xact_lock(hashtext('biznes.profiles.first'));
  select not exists (select 1 from public.profiles) into first;
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, left(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), 120), case when first then 'superadmin' else 'user' end);
  if first then
    insert into public.audit_log (actor, action, subject, detail)
    values (new.id, 'role.first_superadmin', 'profile:' || new.id, jsonb_build_object('email', new.email));
  end if;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- A changed email address follows the person to their profile.
create function private.handle_user_email() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;
revoke all on function private.handle_user_email() from public;

create trigger on_auth_user_email
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function private.handle_user_email();

-- The guard on profiles. Through the API a person changes their own name and telephone number and
-- nothing else. A role changes only through set_role() below.
create function private.profiles_guard() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'UPDATE' and (new.id <> old.id or new.role <> old.role or new.email is distinct from old.email or new.created_at <> old.created_at) then
      raise exception 'Only a superadmin can change that.' using errcode = '42501', hint = 'forbidden';
    end if;
    if tg_op in ('INSERT', 'DELETE') then
      raise exception 'A profile is made and removed with its account.' using errcode = '42501', hint = 'forbidden';
    end if;
  end if;
  if tg_op = 'UPDATE' then
    new.name := left(btrim(new.name), 120);
    new.phone := btrim(new.phone);
  end if;
  return coalesce(new, old);
end;
$$;
revoke all on function private.profiles_guard() from public;

create trigger profiles_10_guard
  before insert or update or delete on public.profiles
  for each row execute function private.profiles_guard();

-- There is always a superadmin. The last one cannot be demoted, and their account cannot be
-- removed, by anyone and by any route, the SQL editor included.
create function private.keep_a_superadmin() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.role = 'superadmin' and (tg_op = 'DELETE' or new.role <> 'superadmin') then
    perform pg_advisory_xact_lock(hashtext('biznes.profiles.roles'));
    if (select count(*) from public.profiles where role = 'superadmin' and id <> old.id) = 0 then
      raise exception 'The last superadmin cannot be demoted or removed. Make someone else a superadmin first.' using errcode = 'P0001', hint = 'last_superadmin';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;
revoke all on function private.keep_a_superadmin() from public;

create trigger profiles_20_keep_a_superadmin
  before update of role or delete on public.profiles
  for each row execute function private.keep_a_superadmin();

-- Promote or demote someone. Superadmins only.
create function public.set_role(target uuid, new_role text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  was text;
begin
  if not private.is_superadmin() then
    raise exception 'Only a superadmin can change roles.' using errcode = '42501', hint = 'forbidden';
  end if;
  if new_role is null or new_role not in ('user', 'admin', 'superadmin') then
    raise exception 'That is not a role.' using errcode = '22023', hint = 'invalid';
  end if;
  select role into was from public.profiles where id = target for update;
  if not found then
    raise exception 'Nobody has that account.' using errcode = 'P0002', hint = 'missing';
  end if;
  if was = new_role then
    return;
  end if;
  update public.profiles set role = new_role where id = target;
  perform private.record('role.set', 'profile:' || target, jsonb_build_object('from', was, 'to', new_role));
end;
$$;
revoke all on function public.set_role(uuid, text) from public, anon;
grant execute on function public.set_role(uuid, text) to authenticated;

-- Who may read and change what.
alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.audit_log from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (name, phone) on table public.profiles to authenticated;
grant select on table public.audit_log to authenticated;

create policy profiles_read on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy audit_log_read on public.audit_log
  for select to authenticated
  using ((select private.is_admin()));
