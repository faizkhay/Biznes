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

grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;

-- Supabase grants everything on a new table, function or sequence in `public` to the API roles.
-- The stub does the same, so the tests prove the migrations take back what they should.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
