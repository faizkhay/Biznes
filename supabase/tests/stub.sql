-- The parts of a Supabase project the migrations lean on, for a plain Postgres to stand in for one
-- while the policies are tested (scripts/test-rls.sh). Never run this on a Supabase project: the
-- real thing has all of it already.

-- The two API roles. Roles belong to the whole server, so they may be there from an earlier run.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end;
$$;

create schema auth;

-- Supabase Auth's table of accounts, with the columns the migrations read.
create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb,
  created_at timestamptz default now()
);

-- Who is asking: the subject of the request's token, as PostgREST sets it.
create function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- Supabase Storage's two tables, with the columns the migrations and their policies read. The real
-- ones have more. Row level security is on, and the API roles hold every privilege, as on a project:
-- the policies are what decide.
create schema storage;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now()
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid,
  metadata jsonb,
  created_at timestamptz default now(),
  unique (bucket_id, name)
);
alter table storage.objects enable row level security;

grant usage on schema storage to anon, authenticated;
grant all on storage.objects, storage.buckets to anon, authenticated;

grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;

-- Supabase grants everything on a new table, function or sequence in `public` to the API roles.
-- The stub does the same, so the tests prove the migrations take back what they should.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;

-- A new Supabase project has this function, open to both API roles: it switches row level security
-- on for each new table. The stand-in does nothing; it is here so the tests can prove that the
-- migration which closes it to the API roles does so.
create function public.rls_auto_enable() returns event_trigger
language plpgsql security definer set search_path = ''
as $$
begin
  null;
end;
$$;
