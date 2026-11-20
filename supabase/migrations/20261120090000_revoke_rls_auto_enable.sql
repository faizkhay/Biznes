-- biznes.mu accounts: close a function that is not ours.
--
-- A new Supabase project comes with `public.rls_auto_enable()`, which the project itself runs when
-- a table is made, to switch row level security on. Being in `public`, it can be called through
-- the API by a visitor (`anon`) and by anyone signed in (`authenticated`), and the project's
-- security adviser says so. Nothing of ours calls it, so nobody outside needs the right to.
--
-- Where the function is not there (a plain Postgres, the local test database, an older project)
-- this does nothing. The project goes on running it for itself: a trigger does not ask for the
-- right to execute when it fires.
do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  loop
    begin
      execute format('revoke all on function %s from public, anon, authenticated', fn);
    exception when insufficient_privilege then
      raise notice 'public.rls_auto_enable() belongs to another role: revoke execute on it from the project''s SQL editor.';
    end;
  end loop;
end;
$$;
