-- The proof of the policies: who can read and change what, tried as each kind of person.
--
-- Run by scripts/test-rls.sh on a scratch database: the stub (stub.sql), then the migrations, then
-- this. Each line of output is one claim, "ok" or "not ok". A person is played the way PostgREST
-- plays them: the role is set to `anon` or `authenticated`, and the token's subject to their id.
-- Everything runs in one transaction that is rolled back at the end.

\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on

\set owner '00000000-0000-4000-8000-000000000001'
\set admin '00000000-0000-4000-8000-000000000002'
\set alice '00000000-0000-4000-8000-00000000000a'
\set bob '00000000-0000-4000-8000-00000000000b'
\set carol '00000000-0000-4000-8000-00000000000c'

-- The test's own tools. Counters are sequences, so they keep counting through a rollback.
create schema t;
create sequence t.n;
create sequence t.failed;

create function t.report(pass boolean, what text, more text default '') returns text
language plpgsql as $$
begin
  if pass then
    return format('ok %s - %s%s', nextval('t.n'), what, case when more <> '' then ' [' || more || ']' else '' end);
  end if;
  perform nextval('t.failed');
  return format('not ok %s - %s%s', nextval('t.n'), what, case when more <> '' then E'\n    # ' || more else '' end);
end;
$$;

-- Passes when the statement is refused. `state` is the SQLSTATE expected, `says` a part of the message.
create function t.throws(statement text, what text, state text default null, says text default null) returns text
language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    return t.report((state is null or sqlstate = state) and (says is null or sqlerrm ilike '%' || says || '%'), what, sqlstate || ': ' || sqlerrm);
  end;
  return t.report(false, what, 'it was allowed');
end;
$$;

-- Passes when the statement runs.
create function t.lives(statement text, what text) returns text
language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    return t.report(false, what, sqlstate || ': ' || sqlerrm);
  end;
  return t.report(true, what);
end;
$$;

-- Passes when the query's one value, as text, is the one wanted.
create function t.is(query text, want text, what text) returns text
language plpgsql as $$
declare
  got text;
begin
  begin
    execute query into got;
  exception when others then
    return t.report(false, what, sqlstate || ': ' || sqlerrm);
  end;
  return t.report(got is not distinct from want, what, case when got is not distinct from want then '' else format('got %s, wanted %s', coalesce(got, 'null'), coalesce(want, 'null')) end);
end;
$$;

-- Become someone for the statements that follow, as PostgREST would.
create function t.be(who text, sub text default '', label text default '') returns text
language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(sub, ''), true);
  perform set_config('role', who, true);
  return E'\n# ' || coalesce(nullif(label, ''), who);
end;
$$;

-- A month, counted from this one in Mauritius: 0 is this month, 1 the next, -1 the last.
create function t.month(away integer) returns text
language sql stable as $$
  select to_char(date_trunc('month', now() at time zone 'Indian/Mauritius') + make_interval(months => away), 'YYYY-MM');
$$;

grant usage on schema t to public;
grant usage on all sequences in schema t to public;
grant execute on all functions in schema t to public;

begin;

select E'# Signing up';
insert into auth.users (id, email, raw_user_meta_data) values (:'owner', 'owner@test.mu', '{"name": "  The Owner "}');
insert into auth.users (id, email, raw_user_meta_data) values (:'admin', 'admin@test.mu', '{"name": "An Admin"}');
insert into auth.users (id, email, raw_user_meta_data) values (:'alice', 'alice@test.mu', '{"name": "Alice"}');
insert into auth.users (id, email, raw_user_meta_data) values (:'bob', 'bob@test.mu', '{"name": "Bob"}');
insert into auth.users (id, email) values (:'carol', 'carol@test.mu');

select t.is($$ select role from public.profiles where email = 'owner@test.mu' $$, 'superadmin', 'the first person to sign up is the superadmin');
select t.is($$ select string_agg(distinct role, ',') from public.profiles where email <> 'owner@test.mu' $$, 'user', 'everyone after is a regular user');
select t.is($$ select name from public.profiles where email = 'owner@test.mu' $$, 'The Owner', 'the name given at sign up is on the profile, trimmed');
select t.is($$ select count(*) from public.audit_log where action = 'role.first_superadmin' $$, '1', 'the first superadmin is on the record');
update auth.users set email = 'carol@new.mu' where id = :'carol';
select t.is($$ select email from public.profiles where name = '' $$, 'carol@new.mu', 'a changed email address follows to the profile');

-- A business of each kind, put in as the owner of the database so each has a known id.
insert into public.businesses (id, owner_id, name, category, town, phone, plan, plan_until, verified, status, listing_id) values
  ('b0000000-0000-4000-8000-0000000000a1', :'alice', 'Alice Bakery', 'bakeries', 'curepipe', '+230 5111 1111', 'free', null, false, 'live', null),
  ('b0000000-0000-4000-8000-0000000000a2', :'alice', 'Alice Salon', 'hairdressers', 'curepipe', '+230 5222 2222', 'grow', current_date + 30, true, 'live', null),
  ('b0000000-0000-4000-8000-0000000000a3', :'alice', 'Alice Garage', 'car-repair', 'vacoas-phoenix', '', 'free', null, false, 'pending', 'n200'),
  ('b0000000-0000-4000-8000-0000000000b1', :'bob', 'Bob Books', 'bookshops', 'port-louis', '+230 5333 3333', 'go', current_date + 30, true, 'live', 'n100'),
  ('b0000000-0000-4000-8000-0000000000b2', :'bob', 'Bob Spa', 'spas', 'grand-baie', '', 'grow', current_date - 1, true, 'live', null),
  ('b0000000-0000-4000-8000-0000000000a4', :'alice', 'Alice Second Claim', 'bookshops', 'port-louis', '', 'free', null, false, 'pending', 'n100');
insert into public.services (id, business_id, name, price_mur, minutes, active) values
  ('c0000000-0000-4000-8000-0000000000a1', 'b0000000-0000-4000-8000-0000000000a2', 'Cut and blow dry', 600, 45, true),
  ('c0000000-0000-4000-8000-0000000000a2', 'b0000000-0000-4000-8000-0000000000a2', 'Old offer', 100, 30, false),
  ('c0000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-0000000000b2', 'Massage', 1500, 60, true);
insert into public.pay_details (business_id, juice_number, juice_name) values
  ('b0000000-0000-4000-8000-0000000000a2', '5222 2222', 'Alice Salon Ltd'),
  ('b0000000-0000-4000-8000-0000000000b1', '5333 3333', 'Bob Books'),
  ('b0000000-0000-4000-8000-0000000000b2', '5444 4444', 'Bob Spa');
select t.is($$ select slug from public.businesses where name = 'Alice Bakery' $$, 'alice-bakery-b0000000', 'a business gets its address from its name');
select t.is($$ select public.plan_now('grow', current_date - 1) || ',' || public.plan_now('grow', current_date + 1) || ',' || public.plan_now('go', null) $$, 'free,grow,go', 'a paid plan past its last day counts as free');

------------------------------------------------------------------------------------------------
select t.be('anon', '', 'A visitor who is not signed in');
select t.is($$ select count(*) from public.businesses $$, '4', 'sees the four live businesses and no other');
select t.is($$ select count(*) from public.businesses where status <> 'live' $$, '0', 'sees no pending business');
select t.throws($$ select owner_id from public.businesses $$, 'cannot read who owns a business', '42501');
select t.throws($$ select status_note from public.businesses $$, 'cannot read an admin''s note on a business', '42501');
select t.is($$ select string_agg(name, ',') from public.services $$, 'Cut and blow dry', 'sees the active services of a live business on Grow: not an inactive one, not one whose plan has lapsed');
select t.is($$ select string_agg(juice_number || ' ' || juice_name, ',') from public.pay_details $$, '5222 2222 Alice Salon Ltd', 'sees how to pay a live business on Grow by MCB Juice: not one on Go, not one whose plan has lapsed');
select t.throws($$ insert into public.pay_details (business_id, juice_number, juice_name) values ('b0000000-0000-4000-8000-0000000000a1', '5000 0000', 'A Stranger') $$, 'cannot write how a business is paid', '42501');
select t.throws($$ update public.pay_details set juice_number = '5000 0000' $$, 'cannot change how a business is paid', '42501');
select t.is($$ select count(*) from public.site_settings $$, '1', 'reads the site''s look');
select t.throws($$ select * from public.profiles $$, 'cannot read profiles', '42501');
select t.throws($$ select * from public.bookings $$, 'cannot read bookings', '42501');
select t.throws($$ select * from public.plan_requests $$, 'cannot read requests for a plan', '42501');
select t.throws($$ select * from public.audit_log $$, 'cannot read the record of admin actions', '42501');
select t.throws($$ insert into public.businesses (name, category) values ('Ghost', 'bakeries') $$, 'cannot list a business', '42501');
select t.throws($$ update public.businesses set name = 'Hacked' $$, 'cannot change a business', '42501');
select t.throws($$ delete from public.businesses $$, 'cannot remove a business', '42501');
select t.throws($$ update public.site_settings set greeting = 'Hacked' $$, 'cannot change the site''s look', '42501');
select t.throws($$ select public.set_role('00000000-0000-4000-8000-00000000000a', 'superadmin') $$, 'cannot call set_role', '42501');
select t.throws($$ select public.admin_set_status('b0000000-0000-4000-8000-0000000000a3', 'live') $$, 'cannot call admin_set_status', '42501');
select t.throws($$ select public.admin_set_plan('b0000000-0000-4000-8000-0000000000a1', 'grow') $$, 'cannot call admin_set_plan', '42501');
select t.throws($$ select public.admin_set_verified('b0000000-0000-4000-8000-0000000000a1', true) $$, 'cannot call admin_set_verified', '42501');
select t.throws($$ select private.is_admin() $$, 'cannot call the policies'' own helpers', '42501');

select E'\n# A visitor asks for a booking';
select t.lives($$ insert into public.bookings (business_id, service_id, name, phone, wanted_at, note) values ('b0000000-0000-4000-8000-0000000000a2', 'c0000000-0000-4000-8000-0000000000a1', 'Dev', '+230 5999 0001', now() + interval '2 days', 'After work') $$, 'can ask a live business on Grow for a booking');
select t.throws($$ insert into public.bookings (business_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000a1', 'Dev', '+230 5999 0001', now() + interval '2 days') $$, 'cannot ask a business on the free plan', '42501', 'row-level security');
select t.throws($$ insert into public.bookings (business_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000b1', 'Dev', '+230 5999 0001', now() + interval '2 days') $$, 'cannot ask a business on Go', '42501', 'row-level security');
select t.throws($$ insert into public.bookings (business_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000b2', 'Dev', '+230 5999 0001', now() + interval '2 days') $$, 'cannot ask a business whose Grow plan has lapsed', '42501', 'row-level security');
select t.throws($$ insert into public.bookings (business_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000a3', 'Dev', '+230 5999 0001', now() + interval '2 days') $$, 'cannot ask a business that is not live', '42501', 'row-level security');
select t.throws($$ insert into public.bookings (business_id, name, phone, wanted_at, status) values ('b0000000-0000-4000-8000-0000000000a2', 'Dev', '+230 5999 0001', now() + interval '2 days', 'confirmed') $$, 'cannot send a booking already confirmed', '42501');
select t.throws($$ insert into public.bookings (business_id, name, phone, wanted_at, customer_id) values ('b0000000-0000-4000-8000-0000000000a2', 'Dev', '+230 5999 0001', now() + interval '2 days', '00000000-0000-4000-8000-00000000000c') $$, 'cannot send a booking in someone else''s name', '42501');
select t.throws($$ insert into public.bookings (business_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000a2', 'Dev', '+230 5999 0002', now() - interval '1 hour') $$, 'cannot ask for a time that has passed', '23514');
select t.throws($$ insert into public.bookings (business_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000a2', 'Dev', '+230 5999 0002', now() + interval '2 years') $$, 'cannot ask for a time more than a year away', '23514');
select t.throws($$ insert into public.bookings (business_id, service_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000a2', 'c0000000-0000-4000-8000-0000000000b1', 'Dev', '+230 5999 0002', now() + interval '2 days') $$, 'cannot ask for another business''s service', '23514');
select t.throws($$ insert into public.bookings (business_id, service_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000a2', 'c0000000-0000-4000-8000-0000000000a2', 'Dev', '+230 5999 0002', now() + interval '2 days') $$, 'cannot ask for a service that is switched off', '23514');
select t.throws($$ insert into public.bookings (business_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000a2', 'D', 'not a number', now() + interval '2 days') $$, 'cannot ask without a real name and telephone number', '23514');
select t.lives($$ insert into public.bookings (business_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000a2', 'Dev', '+230 5999 0001', now() + interval '3 days') $$, 'a second request from one number is taken');
select t.lives($$ insert into public.bookings (business_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000a2', 'Dev', '+230 59 99 00 01', now() + interval '4 days') $$, 'and a third');
select t.throws($$ insert into public.bookings (business_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000a2', 'Dev', '(+230) 5999-0001', now() + interval '5 days') $$, 'the fourth in an hour from one number is refused, however the number is written', 'P0001', 'last hour');

------------------------------------------------------------------------------------------------
select t.be('authenticated', :'alice', 'Alice, a regular user who owns four businesses');
select t.is($$ select count(*) from public.profiles $$, '1', 'reads her own profile and nobody else''s');
select t.lives($$ update public.profiles set name = 'Alice A', phone = '+230 5111 0000' where id = auth.uid() $$, 'changes her own name and telephone number');
select t.throws($$ update public.profiles set role = 'superadmin' where id = auth.uid() $$, 'cannot change her own role', '42501');
select t.throws($$ update public.profiles set role = 'admin' where id = auth.uid() $$, 'cannot make herself an admin', '42501');
select t.throws($$ update public.profiles set email = 'someone@else.mu' where id = auth.uid() $$, 'cannot change the email on her profile', '42501');
select t.is($$ with done as (update public.profiles set name = 'Hacked' where id <> auth.uid() returning 1) select count(*) from done $$, '0', 'cannot change anyone else''s profile');
select t.throws($$ select public.set_role(auth.uid(), 'superadmin') $$, 'cannot promote herself with set_role', '42501', 'Only a superadmin');
select t.throws($$ select public.set_role('00000000-0000-4000-8000-000000000001', 'user') $$, 'cannot demote the superadmin', '42501', 'Only a superadmin');
select t.throws($$ delete from public.profiles where id = auth.uid() $$, 'cannot remove a profile', '42501');

select E'\n# Alice and her businesses';
select t.is($$ select count(*) from public.businesses $$, '4', 'sees her own four businesses, the pending ones too');
select t.is($$ select count(*) from public.businesses where owner_id <> auth.uid() $$, '0', 'sees nobody else''s through her account');
select t.lives($$ insert into public.businesses (name, category, town, phone, about) values ('  Alice Flowers ', 'florists', 'curepipe', '+230 5444 4444', 'Flowers for every day.') $$, 'lists a new business');
select t.is($$ select status || ',' || plan || ',' || verified || ',' || (owner_id = auth.uid()) || ',' || name from public.businesses where name = 'Alice Flowers' $$, 'pending,free,false,true,Alice Flowers', 'which starts pending, free, unverified and hers');
select t.throws($$ insert into public.businesses (name, category, status) values ('Alice Live', 'florists', 'live') $$, 'cannot list a business as live', '42501');
select t.throws($$ insert into public.businesses (name, category, plan) values ('Alice Grow', 'florists', 'grow') $$, 'cannot list a business on a paid plan', '42501');
select t.throws($$ insert into public.businesses (name, category, verified) values ('Alice Verified', 'florists', true) $$, 'cannot list a business as verified', '42501');
select t.throws($$ insert into public.businesses (name, category, owner_id) values ('Alice For Bob', 'florists', '00000000-0000-4000-8000-00000000000b') $$, 'cannot list a business in someone else''s name', '42501');
select t.lives($$ update public.businesses set about = 'Bread and cakes, baked each morning.', phone = '+230 5111 2222' where id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'changes the details of her own business');
select t.throws($$ update public.businesses set status = 'live' where id = 'b0000000-0000-4000-8000-0000000000a3' $$, 'cannot make her pending business live', '42501');
select t.throws($$ update public.businesses set plan = 'grow' where id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'cannot change her own plan', '42501');
select t.throws($$ update public.businesses set plan_until = current_date + 3650 where id = 'b0000000-0000-4000-8000-0000000000a2' $$, 'cannot move the last day of her plan', '42501');
select t.throws($$ update public.businesses set verified = true where id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'cannot verify her own business', '42501');
select t.throws($$ update public.businesses set owner_id = '00000000-0000-4000-8000-00000000000b' where id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'cannot hand a business to someone else', '42501');
select t.throws($$ update public.businesses set listing_id = 'n100' where id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'cannot attach her business to a listing after the fact', '42501');
select t.throws($$ update public.businesses set name = 'Alice Salon and Bank' where id = 'b0000000-0000-4000-8000-0000000000a2' $$, 'cannot rename a business that is verified', 'P0001', 'verified business');
select t.is($$ with done as (update public.businesses set name = 'Hacked' where id = 'b0000000-0000-4000-8000-0000000000b1' returning 1) select count(*) from done $$, '0', 'cannot change another owner''s business');
select t.is($$ with done as (delete from public.businesses where id = 'b0000000-0000-4000-8000-0000000000b1' returning 1) select count(*) from done $$, '0', 'cannot remove another owner''s business');
select t.throws($$ select public.admin_set_status('b0000000-0000-4000-8000-0000000000a3', 'live') $$, 'cannot approve her own business with admin_set_status', '42501', 'Only an admin');
select t.throws($$ select public.admin_set_plan('b0000000-0000-4000-8000-0000000000a1', 'grow', current_date + 365) $$, 'cannot give herself a plan with admin_set_plan', '42501', 'Only an admin');
select t.throws($$ select public.admin_set_verified('b0000000-0000-4000-8000-0000000000a1', true) $$, 'cannot verify herself with admin_set_verified', '42501', 'Only an admin');
select t.is($$ select count(*) from public.audit_log $$, '0', 'cannot read the record of admin actions');
select t.is($$ with done as (update public.site_settings set greeting = 'Hacked' returning 1) select count(*) from done $$, '0', 'cannot change the site''s look');

select E'\n# Alice asks for a plan';
select t.lives($$ insert into public.plan_requests (business_id, plan, note) values ('b0000000-0000-4000-8000-0000000000a1', 'go', 'Please call after 5.') $$, 'asks for Biznes Go for her bakery');
select t.is($$ select status || ',' || (requested_by = auth.uid()) from public.plan_requests where business_id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'open,true', 'the request is open and hers');
select t.throws($$ insert into public.plan_requests (business_id, plan) values ('b0000000-0000-4000-8000-0000000000a1', 'grow') $$, 'cannot have two requests open for one business', '23505');
select t.throws($$ insert into public.plan_requests (business_id, plan) values ('b0000000-0000-4000-8000-0000000000b1', 'grow') $$, 'cannot ask for a plan for another owner''s business', '42501', 'row-level security');
select t.throws($$ insert into public.plan_requests (business_id, plan, status) values ('b0000000-0000-4000-8000-0000000000a3', 'go', 'done') $$, 'cannot send a request already marked done', '42501');
select t.throws($$ update public.plan_requests set status = 'done' $$, 'cannot answer her own request', '42501');
select t.throws($$ select public.admin_handle_plan_request((select id from public.plan_requests limit 1), true, current_date + 365) $$, 'cannot switch her own plan on with admin_handle_plan_request', '42501', 'Only an admin');

select E'\n# Alice, Biznes Grow and her bookings';
select t.lives($$ insert into public.services (business_id, name, price_mur, minutes) values ('b0000000-0000-4000-8000-0000000000a2', 'Colour', 1800, 90) $$, 'adds a service to her business on Grow');
select t.throws($$ insert into public.services (business_id, name) values ('b0000000-0000-4000-8000-0000000000a1', 'Cake to order') $$, 'cannot add a service to her business on the free plan', '42501', 'row-level security');
select t.throws($$ insert into public.services (business_id, name) values ('b0000000-0000-4000-8000-0000000000b2', 'Hacked') $$, 'cannot add a service to another owner''s business', '42501', 'row-level security');
select t.is($$ select count(*) from public.services $$, '3', 'sees her own services, the inactive one too, and nobody else''s');
select t.lives($$ update public.pay_details set juice_number = ' 5222 0000 ', juice_name = 'Alice Lallah' where business_id = 'b0000000-0000-4000-8000-0000000000a2' $$, 'changes how her business on Grow is paid by MCB Juice');
select t.lives($$ insert into public.pay_details (business_id, juice_number, juice_name) values ('b0000000-0000-4000-8000-0000000000a1', '5111 0000', 'Alice Lallah') $$, 'writes it for her free business too, where it waits unseen');
select t.throws($$ insert into public.pay_details (business_id, juice_number, juice_name) values ('b0000000-0000-4000-8000-0000000000a3', '51110000', 'Alice Lallah') $$, 'cannot give a number that is not eight digits as 5XXX XXXX', '23514');
select t.throws($$ insert into public.pay_details (business_id, juice_number, juice_name) values ('b0000000-0000-4000-8000-0000000000b1', '5000 0000', 'Alice Lallah') $$, 'cannot write how another owner''s business is paid', '42501', 'row-level security');
select t.is($$ with done as (update public.pay_details set juice_number = '5000 0000' where business_id = 'b0000000-0000-4000-8000-0000000000b1' returning 1) select count(*) from done $$, '0', 'cannot redirect another owner''s payments to her own number');
select t.throws($$ update public.pay_details set business_id = 'b0000000-0000-4000-8000-0000000000b1' where business_id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'cannot move her payment details onto another owner''s business');
select t.is($$ select count(*) from public.pay_details $$, '2', 'reads her own payment details and nobody else''s');
select t.is($$ select count(*) from public.bookings $$, '3', 'sees the three requests made to her business');
select t.lives($$ update public.bookings set status = 'confirmed' where phone = '+230 5999 0001' and note = 'After work' $$, 'confirms a request');
select t.lives($$ update public.bookings set status = 'done' where note = 'After work' $$, 'marks a confirmed booking done');
select t.throws($$ update public.bookings set status = 'requested' where note = 'After work' $$, 'cannot put a finished booking back', '42501', 'cannot be changed that way');
select t.throws($$ update public.bookings set status = 'done' where status = 'requested' $$, 'cannot mark a request done before confirming it', '42501', 'cannot be changed that way');
select t.throws($$ update public.bookings set phone = '+230 5000 0000' $$, 'cannot change the customer''s number on a booking', '42501');
select t.throws($$ delete from public.bookings $$, 'cannot delete a booking', '42501');
select t.lives($$ update public.bookings set status = 'declined' where status = 'requested' and wanted_at > now() + interval '3 days 12 hours' $$, 'declines a request');

------------------------------------------------------------------------------------------------
select t.be('authenticated', :'bob', 'Bob, another owner');
select t.is($$ select count(*) from public.businesses $$, '2', 'sees his own two businesses');
select t.is($$ select count(*) from public.plan_requests $$, '0', 'cannot see Alice''s request for a plan');
select t.is($$ select count(*) from public.bookings $$, '0', 'cannot see the bookings of Alice''s business');
select t.is($$ with done as (update public.bookings set status = 'confirmed' where status = 'requested' returning 1) select count(*) from done $$, '0', 'cannot confirm a booking of Alice''s business');
select t.is($$ select count(*) from public.services where business_id = 'b0000000-0000-4000-8000-0000000000a2' $$, '0', 'cannot see Alice''s services through his account');
select t.is($$ with done as (update public.services set price_mur = 1 where business_id = 'b0000000-0000-4000-8000-0000000000a2' returning 1) select count(*) from done $$, '0', 'cannot change Alice''s services');
select t.is($$ with done as (delete from public.services where business_id = 'b0000000-0000-4000-8000-0000000000a2' returning 1) select count(*) from done $$, '0', 'cannot remove Alice''s services');
select t.throws($$ insert into public.services (business_id, name) values ('b0000000-0000-4000-8000-0000000000b2', 'Facial') $$, 'cannot add a service once his Grow plan has lapsed', '42501', 'row-level security');
select t.throws($$ update public.services set price_mur = 1700 where id = 'c0000000-0000-4000-8000-0000000000b1' $$, 'cannot edit a service once his Grow plan has lapsed', '42501', 'row-level security');
select t.lives($$ delete from public.services where id = 'c0000000-0000-4000-8000-0000000000b1' $$, 'can still remove his own service');
select t.lives($$ insert into public.plan_requests (business_id, plan) values ('b0000000-0000-4000-8000-0000000000b2', 'grow') $$, 'asks for Biznes Grow again');
select t.throws($$ insert into public.businesses (name, category, listing_id) values ('Bob Books Again', 'bookshops', 'n100') $$, 'cannot claim the same listing twice', '23505');
select t.lives($$ insert into public.businesses (name, category, listing_id) values ('Bob Cafe', 'cafes', 'w300') $$, 'claims another listing, which waits for an admin');

------------------------------------------------------------------------------------------------
select t.be('authenticated', :'carol', 'Carol, a regular user who is a customer');
select t.lives($$ insert into public.bookings (business_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000a2', 'Carol', '+230 5777 0001', now() + interval '6 days') $$, 'asks for a booking while signed in');
select t.is($$ select count(*) || ',' || bool_and(customer_id = auth.uid()) || ',' || string_agg(status, ',') from public.bookings $$, '1,true,requested', 'sees her own booking and no other, and it carries her account');
select t.throws($$ update public.bookings set status = 'confirmed' $$, 'cannot confirm her own booking', '42501', 'cannot be changed that way');
select t.lives($$ update public.bookings set status = 'cancelled' $$, 'cancels her own booking');
select t.throws($$ update public.bookings set status = 'requested' $$, 'cannot bring a cancelled booking back', '42501', 'cannot be changed that way');
select t.is($$ select count(*) from public.businesses $$, '0', 'owns no business, and reads none through her account');

select E'\n# One account lists twenty businesses at most';
select t.lives($$ insert into public.businesses (name, category) select 'Carol Shop ' || n, 'other-shops' from generate_series(1, 20) n $$, 'lists twenty');
select t.throws($$ insert into public.businesses (name, category) values ('Carol Shop 21', 'other-shops') $$, 'and is refused the twenty-first', 'P0001', 'twenty businesses');

------------------------------------------------------------------------------------------------
select t.be('authenticated', :'owner', 'The superadmin');
select t.lives($$ select public.set_role('00000000-0000-4000-8000-000000000002', 'admin') $$, 'makes someone an admin');
select t.is($$ select role from public.profiles where id = '00000000-0000-4000-8000-000000000002' $$, 'admin', 'who is then an admin');
select t.throws($$ select public.set_role('00000000-0000-4000-8000-000000000002', 'owner') $$, 'cannot give a role that does not exist', '22023');
select t.throws($$ select public.set_role(auth.uid(), 'user') $$, 'cannot demote themself while they are the last superadmin', 'P0001', 'last superadmin');
select t.throws($$ update public.profiles set role = 'user' where id = auth.uid() $$, 'cannot change a role by writing to the table, even their own', '42501');
select t.lives($$ update public.site_settings set picture = 'lights', greeting = '  Happy Divali ' $$, 'sets the picture and the greeting');
select t.is($$ select picture || ',' || greeting || ',' || (updated_by = auth.uid()) from public.site_settings $$, 'lights,Happy Divali,true', 'and the row says who did');
select t.throws($$ insert into public.site_settings (id) values (false) $$, 'cannot add a second row of settings', '42501');
select t.is($$ select count(*) from public.profiles $$, '5', 'reads everyone''s profile');

------------------------------------------------------------------------------------------------
select t.be('authenticated', :'admin', 'An admin');
select t.is($$ select count(*) from public.businesses $$, '28', 'sees every business, whatever its status');
select t.is($$ select count(*) from public.bookings $$, '4', 'sees every booking');
select t.is($$ select count(*) from public.plan_requests where status = 'open' $$, '2', 'sees the open requests for a plan');
select t.throws($$ update public.businesses set status = 'live' where id = 'b0000000-0000-4000-8000-0000000000a3' $$, 'cannot write a status straight to the table: it goes through the function, which records it', '42501');
select t.lives($$ select public.admin_set_status('b0000000-0000-4000-8000-0000000000a3', 'live') $$, 'approves a pending business');
select t.is($$ select status from public.businesses where id = 'b0000000-0000-4000-8000-0000000000a3' $$, 'live', 'which is then live');
select t.throws($$ select public.admin_set_status('b0000000-0000-4000-8000-0000000000a4', 'live') $$, 'cannot make a second business live on a listing that has a live owner', 'P0001', 'already claimed');
select t.lives($$ select public.admin_set_status('b0000000-0000-4000-8000-0000000000a4', 'rejected', 'This listing already has an owner.') $$, 'rejects a business, with a word why');
select t.is($$ select status || ': ' || status_note from public.businesses where id = 'b0000000-0000-4000-8000-0000000000a4' $$, 'rejected: This listing already has an owner.', 'and the owner can be told why');
select t.lives($$ select public.admin_set_status('b0000000-0000-4000-8000-0000000000b2', 'suspended', 'Reported as closed.') $$, 'suspends a live business');
select t.lives($$ select public.admin_set_verified('b0000000-0000-4000-8000-0000000000a1', true) $$, 'verifies a business');
select t.lives($$ select public.admin_set_verified('b0000000-0000-4000-8000-0000000000a1', false) $$, 'and takes the mark away again');
select t.lives($$ select public.admin_handle_plan_request((select id from public.plan_requests where business_id = 'b0000000-0000-4000-8000-0000000000a1'), true, current_date + 365) $$, 'switches on the plan Alice asked for, with its last day');
select t.is($$ select plan || ',' || verified || ',' || (plan_until = current_date + 365) from public.businesses where id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'go,true,true', 'her bakery is then on Go, verified, until that day');
select t.is($$ select status || ',' || (handled_by = auth.uid()) || ',' || (handled_at is not null) from public.plan_requests where business_id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'done,true,true', 'and the request says who answered it and when');
select t.throws($$ select public.admin_handle_plan_request((select id from public.plan_requests where business_id = 'b0000000-0000-4000-8000-0000000000a1'), true, current_date + 365) $$, 'cannot answer a request twice', 'P0002');
select t.lives($$ select public.admin_handle_plan_request((select id from public.plan_requests where business_id = 'b0000000-0000-4000-8000-0000000000b2'), false) $$, 'declines Bob''s request');
select t.is($$ select plan || ',' || (select status from public.plan_requests where business_id = b.id) from public.businesses b where id = 'b0000000-0000-4000-8000-0000000000b2' $$, 'grow,declined', 'which leaves his plan as it was');
select t.lives($$ select public.admin_set_plan('b0000000-0000-4000-8000-0000000000a2', 'free') $$, 'takes a business off its plan');
select t.is($$ select plan || ',' || (plan_until is null) from public.businesses where id = 'b0000000-0000-4000-8000-0000000000a2' $$, 'free,true', 'which is then free, with no last day');
select t.throws($$ select public.admin_set_plan('b0000000-0000-4000-8000-0000000000a2', 'platinum') $$, 'cannot give a plan that does not exist', '22023');
select t.throws($$ select public.set_role(auth.uid(), 'superadmin') $$, 'cannot promote themself', '42501', 'Only a superadmin');
select t.throws($$ select public.set_role('00000000-0000-4000-8000-00000000000a', 'admin') $$, 'cannot make anyone else an admin', '42501', 'Only a superadmin');
select t.is($$ with done as (update public.site_settings set greeting = 'Hacked' returning 1) select count(*) from done $$, '0', 'cannot change the site''s look: that is the superadmin''s');
select t.is($$ select count(*) from public.profiles $$, '5', 'reads everyone''s profile, to reach an owner');
select t.is($$ select string_agg(action, ',' order by id) from public.audit_log where actor = auth.uid() $$, 'business.status,business.status,business.status,business.verified,business.verified,business.plan,business.verified,plan_request.done,plan_request.declined,business.plan', 'everything the admin did is on the record, in order, under their name');
select t.is($$ select count(*) from public.audit_log where action = 'role.set' and actor = '00000000-0000-4000-8000-000000000001' $$, '1', 'and so is the superadmin''s change of role');
select t.is($$ select count(*) from public.audit_log where action = 'settings.look' $$, '1', 'and the change of look');
select t.throws($$ insert into public.audit_log (action) values ('made.up') $$, 'cannot write to the record by hand', '42501');
select t.throws($$ delete from public.audit_log $$, 'cannot wipe the record', '42501');

------------------------------------------------------------------------------------------------
select t.be('anon', '', 'A visitor again, after the admin''s work');
select t.is($$ select count(*) from public.businesses $$, '4', 'sees the business that was approved, and no longer the one that was suspended');
select t.is($$ select count(*) from public.services $$, '0', 'sees no services of a business taken off Grow');
select t.is($$ select count(*) from public.pay_details $$, '0', 'nor how to pay it: no business is on Grow now');
select t.throws($$ insert into public.bookings (business_id, name, phone, wanted_at) values ('b0000000-0000-4000-8000-0000000000a2', 'Dev', '+230 5888 0001', now() + interval '2 days') $$, 'can no longer ask it for a booking', '42501', 'row-level security');

------------------------------------------------------------------------------------------------
select t.be('authenticated', :'alice', 'Alice, whose claim on a listing was rejected');
select t.lives($$ update public.businesses set about = 'It really is mine: here is why.' where id = 'b0000000-0000-4000-8000-0000000000a4' $$, 'changes the rejected business and saves it');
select t.is($$ select status || ',' || (status_note = '') from public.businesses where id = 'b0000000-0000-4000-8000-0000000000a4' $$, 'pending,true', 'which sends it back to be looked at again');
select t.lives($$ delete from public.businesses where id = 'b0000000-0000-4000-8000-0000000000a4' $$, 'removes her own business');

------------------------------------------------------------------------------------------------
-- The second round: subscribers, menus, showcases, pictures, an owner's own records, advertisements.
reset role;
-- Alice Salon is on Grow again, live and verified. Alice Bakery is a food outlet on Go; Bob Books is on Go and sells no food.
update public.businesses set plan = 'grow', plan_until = current_date + 30 where id = 'b0000000-0000-4000-8000-0000000000a2';

select t.be('anon', '', 'A visitor joins the list for the pocket guide and the magazine');
select t.lives($$ select public.subscribe('  New@Reader.mu ', true, false) $$, 'adds their address, asking for the pocket guide');
select t.throws($$ select * from public.subscribers $$, 'cannot read the list', '42501');
select t.throws($$ insert into public.subscribers (email, wants_guide) values ('direct@reader.mu', true) $$, 'cannot write to the list except by asking to join', '42501');
select t.throws($$ delete from public.subscribers $$, 'cannot empty the list', '42501');
select t.throws($$ select public.subscribe('not an address') $$, 'cannot add something that is not an email address', '22023');
select t.throws($$ select public.subscribe('nothing@reader.mu', false, false) $$, 'cannot join without asking for anything', '22023');
select t.lives($$ select public.subscribe('NEW@reader.mu', false, true) $$, 'asks again, this time for the magazine');
select t.is($$ select public.unsubscribe('00000000-0000-4000-8000-00000000dead')::text $$, 'false', 'cannot take anyone off the list with a made-up token');
reset role;
select t.is($$ select count(*) || ',' || min(email) || ',' || bool_and(wants_guide and wants_magazine) from public.subscribers $$, '1,new@reader.mu,true', 'the address is on the list once, in lower case, with both things asked for');
insert into public.subscribers (email, wants_guide, created_at) select 'crowd' || n || '@reader.mu', true, now() from generate_series(1, 200) n;
select token as leave_token from public.subscribers where email = 'new@reader.mu' \gset
select t.be('anon', '', 'A visitor, when two hundred have joined within the hour');
select t.throws($$ select public.subscribe('late@reader.mu') $$, 'a new address is asked to try again later', 'P0001', 'Try again later');
select t.lives($$ select public.subscribe('new@reader.mu', true, true) $$, 'an address already on the list is still heard');
select t.is(format($$ select public.unsubscribe(%L)::text $$, :'leave_token'), 'true', 'leaves the list with the token from their own link');
reset role;
select t.is($$ select count(*) from public.subscribers where email = 'new@reader.mu' $$, '0', 'and the row is gone');
delete from public.subscribers where email like 'crowd%' and email <> 'crowd1@reader.mu';
select t.be('authenticated', :'alice', 'Alice, a regular user');
select t.is($$ select count(*) from public.subscribers $$, '0', 'cannot read the list');
select t.be('authenticated', :'admin', 'An admin');
select t.is($$ select count(*) from public.subscribers $$, '1', 'reads the list');
select t.lives($$ delete from public.subscribers where email = 'crowd1@reader.mu' $$, 'takes an address off by hand');
select t.is($$ select count(*) from public.audit_log where action = 'subscriber.removed' and actor = auth.uid() $$, '1', 'which is on the record');

------------------------------------------------------------------------------------------------
select t.be('authenticated', :'alice', 'Alice and the menu of her bakery, which is on Go');
select t.lives($$ insert into public.menu_sections (business_id, title, position) values ('b0000000-0000-4000-8000-0000000000a1', ' Breads ', 1) $$, 'adds a section to the menu');
select t.lives($$ insert into public.menu_items (section_id, name, description, price_mur, position) select id, 'Pain maison', 'Baked each morning.', 25, 1 from public.menu_sections where title = 'Breads' $$, 'adds an item to it, with its price');
select t.is($$ select (business_id = 'b0000000-0000-4000-8000-0000000000a1')::text from public.menu_items where name = 'Pain maison' $$, 'true', 'the item belongs to the section''s own business');
select t.throws($$ insert into public.menu_sections (business_id, title) values ('b0000000-0000-4000-8000-0000000000a3', 'Snacks') $$, 'cannot keep a menu for her business on the free plan', '42501', 'row-level security');
select t.throws($$ insert into public.menu_sections (business_id, title) values ('b0000000-0000-4000-8000-0000000000a2', 'Snacks') $$, 'cannot keep a menu for her salon: it is on Grow, but it is not a food outlet', '42501', 'row-level security');
select t.throws($$ insert into public.menu_items (section_id, name, price_mur) select id, 'Gold loaf', -5 from public.menu_sections where title = 'Breads' $$, 'cannot give a price below nothing', '23514');
select t.be('authenticated', :'bob', 'Bob, another owner');
select t.is($$ select count(*) from public.menu_sections $$, '0', 'cannot read Alice''s menu through his account');
select t.throws($$ insert into public.menu_items (section_id, name) values ((select id from public.menu_sections limit 1), 'Hacked') $$, 'cannot add an item to a section he cannot see', '23503');
reset role;
select id as breads from public.menu_sections where title = 'Breads' \gset
select t.be('authenticated', :'bob', 'Bob, who has learnt the id of Alice''s section');
select t.throws(format($$ insert into public.menu_items (section_id, name) values (%L, 'Hacked') $$, :'breads'), 'still cannot add an item to it', '42501', 'row-level security');
select t.is($$ with done as (update public.menu_items set price_mur = 1 returning 1) select count(*) from done $$, '0', 'cannot change Alice''s prices');
select t.is($$ with done as (delete from public.menu_sections returning 1) select count(*) from done $$, '0', 'cannot remove her sections');
select t.throws($$ insert into public.menu_sections (business_id, title) values ('b0000000-0000-4000-8000-0000000000b1', 'Coffee') $$, 'cannot keep a menu for his bookshop, though it is on Go', '42501', 'row-level security');
select t.be('anon', '', 'A visitor');
select t.is($$ select (select count(*) from public.menu_sections) || ',' || (select string_agg(name || ' ' || price_mur, ',') from public.menu_items) $$, '1,Pain maison 25', 'reads the menu of a live food outlet on a paid plan');
select t.throws($$ insert into public.menu_sections (business_id, title) values ('b0000000-0000-4000-8000-0000000000a1', 'Hacked') $$, 'cannot write to a menu', '42501');
reset role;
update public.businesses set plan_until = current_date - 1 where id = 'b0000000-0000-4000-8000-0000000000a1';
select t.be('anon', '', 'A visitor, once the bakery''s plan has run out');
select t.is($$ select (select count(*) from public.menu_sections) + (select count(*) from public.menu_items) $$, '0', 'no longer reads its menu');
reset role;
update public.businesses set plan_until = current_date + 365 where id = 'b0000000-0000-4000-8000-0000000000a1';

------------------------------------------------------------------------------------------------
select t.be('authenticated', :'alice', 'Alice and the showcase of a business on a paid plan');
select t.lives($$ insert into public.showcases (business_id, tagline, hours, cover, photos) values ('b0000000-0000-4000-8000-0000000000a1', ' Bread since 1998 ', array['Monday to Saturday: 6 to 6', 'Sunday: 6 to noon'], 'business/b0000000-0000-4000-8000-0000000000a1/cover-1.jpg', array['business/b0000000-0000-4000-8000-0000000000a1/photo-1.webp']) $$, 'gives her bakery a line, its hours, a cover and a photograph');
select t.throws($$ update public.showcases set cover = 'business/b0000000-0000-4000-8000-0000000000b1/cover-1.jpg' where business_id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'cannot show a picture from another business''s folder', '23514');
select t.throws($$ update public.showcases set photos = array['https://elsewhere.example/a.jpg'] where business_id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'cannot show a picture from anywhere else', '23514');
select t.throws($$ update public.showcases set photos = (select array_agg('business/b0000000-0000-4000-8000-0000000000a1/photo-' || n || '.jpg') from generate_series(1, 9) n) where business_id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'cannot show more than eight photographs', '23514');
select t.throws($$ insert into public.showcases (business_id, tagline) values ('b0000000-0000-4000-8000-0000000000a3', 'Fast repairs') $$, 'cannot make a showcase for her business on the free plan', '42501', 'row-level security');
select t.be('authenticated', :'bob', 'Bob, another owner');
select t.is($$ select count(*) from public.showcases $$, '0', 'cannot read Alice''s showcase through his account');
select t.is($$ with done as (update public.showcases set tagline = 'Hacked' returning 1) select count(*) from done $$, '0', 'cannot change it');
select t.throws($$ insert into public.showcases (business_id, tagline) values ('b0000000-0000-4000-8000-0000000000a2', 'Hacked') $$, 'cannot make one for a business that is not his', '42501', 'row-level security');
select t.be('anon', '', 'A visitor');
select t.is($$ select tagline || '|' || cardinality(hours) || '|' || cardinality(photos) from public.showcases $$, 'Bread since 1998|2|1', 'reads the showcase of a live business on a paid plan');
select t.throws($$ update public.showcases set tagline = 'Hacked' $$, 'cannot change a showcase', '42501');
reset role;
update public.businesses set status = 'suspended' where id = 'b0000000-0000-4000-8000-0000000000a1';
select t.be('anon', '', 'A visitor, while the bakery is suspended');
select t.is($$ select count(*) from public.showcases $$, '0', 'no longer reads its showcase');
reset role;
update public.businesses set status = 'live' where id = 'b0000000-0000-4000-8000-0000000000a1';

------------------------------------------------------------------------------------------------
select t.be('authenticated', :'alice', 'Alice and the pictures she uploads');
select t.lives($$ insert into storage.objects (bucket_id, name) values ('media', 'business/b0000000-0000-4000-8000-0000000000a1/cover-1.jpg') $$, 'keeps a picture in her paid business''s own folder');
select t.throws($$ insert into storage.objects (bucket_id, name) values ('media', 'business/b0000000-0000-4000-8000-0000000000b1/cover-1.jpg') $$, 'cannot put one in another owner''s folder', '42501', 'row-level security');
select t.throws($$ insert into storage.objects (bucket_id, name) values ('media', 'business/b0000000-0000-4000-8000-0000000000a3/cover-1.jpg') $$, 'cannot put one in the folder of her business on the free plan', '42501', 'row-level security');
select t.throws($$ insert into storage.objects (bucket_id, name) values ('media', 'business/b0000000-0000-4000-8000-0000000000a1/../../site/x.jpg') $$, 'cannot climb out of her folder', '42501', 'row-level security');
select t.throws($$ insert into storage.objects (bucket_id, name) values ('media', 'business/b0000000-0000-4000-8000-0000000000a1/script.svg') $$, 'cannot keep anything but a JPEG, a PNG or a WebP by name', '42501', 'row-level security');
select t.throws($$ insert into storage.objects (bucket_id, name) values ('media', 'site/backdrop-1.jpg') $$, 'cannot put a picture behind the site', '42501', 'row-level security');
select t.lives($$ insert into storage.objects (bucket_id, name) select 'media', 'business/b0000000-0000-4000-8000-0000000000a1/photo-' || n || '.jpg' from generate_series(1, 11) n $$, 'fills the folder to its twelve pictures');
select t.throws($$ insert into storage.objects (bucket_id, name) values ('media', 'business/b0000000-0000-4000-8000-0000000000a1/photo-12.jpg') $$, 'and is refused the thirteenth', '42501', 'row-level security');
select t.be('authenticated', :'bob', 'Bob, another owner');
select t.is($$ select count(*) from storage.objects $$, '0', 'cannot list Alice''s pictures');
select t.is($$ with done as (delete from storage.objects returning 1) select count(*) from done $$, '0', 'cannot remove them');
select t.be('anon', '', 'A visitor');
select t.throws($$ insert into storage.objects (bucket_id, name) values ('media', 'business/b0000000-0000-4000-8000-0000000000a1/anon-1.jpg') $$, 'cannot upload anything', '42501', 'row-level security');
select t.be('authenticated', :'admin', 'An admin');
select t.throws($$ insert into storage.objects (bucket_id, name) values ('media', 'site/backdrop-1.jpg') $$, 'cannot put a picture behind the site: that is the superadmin''s', '42501', 'row-level security');
select t.be('authenticated', :'owner', 'The superadmin and the pictures behind the page');
select t.lives($$ insert into storage.objects (bucket_id, name) values ('media', 'site/backdrop-1.jpg') $$, 'uploads a picture for behind the page');
select t.lives($$ insert into public.site_pictures (path, label) values ('site/backdrop-1.jpg', ' Le Morne at dusk ') $$, 'and names it');
select t.throws($$ insert into public.site_pictures (path, label) values ('business/x/backdrop.jpg', 'Elsewhere') $$, 'cannot name a picture that is not among the site''s own', '23514');
select t.lives($$ update public.site_settings set mode = 'rotation', pictures = array['lagoon', (select id::text from public.site_pictures)] $$, 'chooses a round of pictures, a new one each day');
select t.throws($$ update public.site_settings set mode = 'weekly' $$, 'cannot choose a way of choosing that does not exist', '23514');
select t.be('authenticated', :'admin', 'An admin');
select t.throws($$ insert into public.site_pictures (path, label) values ('site/backdrop-2.jpg', 'Another') $$, 'cannot add to the site''s pictures', '42501', 'row-level security');
select t.is($$ with done as (update public.site_settings set mode = 'calendar' returning 1) select count(*) from done $$, '0', 'cannot change how the picture is chosen');
select t.is($$ with done as (delete from public.site_pictures returning 1) select count(*) from done $$, '0', 'cannot remove a picture');
select t.is($$ select (detail ->> 'mode') || ',' || jsonb_array_length(detail -> 'pictures') from public.audit_log where action = 'settings.look' order by id desc limit 1 $$, 'rotation,2', 'reads on the record how the picture is now chosen');
select t.be('anon', '', 'A visitor');
select t.is($$ select mode || ',' || cardinality(pictures) || ',' || (select label from public.site_pictures) from public.site_settings $$, 'rotation,2,Le Morne at dusk', 'reads how the picture is chosen, and the pictures there are');
select t.throws($$ select created_by from public.site_pictures $$, 'cannot read who uploaded one', '42501');

------------------------------------------------------------------------------------------------
select t.be('authenticated', :'alice', 'Alice and what her business on Grow keeps for itself');
select t.lives($$ insert into public.customers (business_id, name, phone, notes) values ('b0000000-0000-4000-8000-0000000000a2', ' Dev Ramdin ', '+230 5999 0001', 'Prefers mornings.') $$, 'adds a customer by hand');
select t.throws($$ insert into public.customers (business_id, name, phone) values ('b0000000-0000-4000-8000-0000000000a2', 'Dev again', '+230 59 99 00 01') $$, 'cannot add the same telephone number twice', '23505');
select t.throws($$ insert into public.customers (business_id, name) values ('b0000000-0000-4000-8000-0000000000a1', 'A regular') $$, 'cannot keep customers for her business on Go: that is Grow''s', '42501', 'row-level security');
select t.lives($$ insert into public.booking_notes (booking_id, note) select id, 'Asked for the same stylist.' from public.bookings where note = 'After work' $$, 'adds her own note to a booking');
select t.lives($$ insert into public.payments (business_id, booking_id, customer_id, paid_on, payer, what, amount_mur, method) select 'b0000000-0000-4000-8000-0000000000a2', b.id, c.id, current_date, 'Dev Ramdin', 'Cut and blow dry', 600, 'juice' from public.bookings b, public.customers c where b.note = 'After work' and c.name = 'Dev Ramdin' $$, 'records a payment for that booking, by MCB Juice');
select t.throws($$ insert into public.payments (business_id, booking_id, paid_on, amount_mur, method) select 'b0000000-0000-4000-8000-0000000000a2', id, current_date, 600, 'cash' from public.bookings where note = 'After work' $$, 'cannot mark one booking paid twice', '23505');
select t.throws($$ insert into public.payments (business_id, paid_on, amount_mur, method) values ('b0000000-0000-4000-8000-0000000000a2', current_date, 0, 'cash') $$, 'cannot record a payment of nothing', '23514');
select t.throws($$ insert into public.payments (business_id, paid_on, amount_mur, method) values ('b0000000-0000-4000-8000-0000000000a2', current_date, 100, 'bitcoin') $$, 'cannot record a way of paying the ledger does not know', '23514');
select t.lives($$ insert into public.payments (business_id, paid_on, payer, what, amount_mur, method) values ('b0000000-0000-4000-8000-0000000000a2', current_date, 'A walk-in', 'Colour', 1800, 'cash') $$, 'records a payment with no booking behind it');
select t.is($$ select month || ',' || total || ',' || payments from public.payment_totals $$, to_char(current_date, 'YYYY-MM') || ',2400,2', 'reads what the ledger adds up to this month');
select t.is($$ select bookings || ',' || done from public.customer_tallies where phone_key = '23059990001' $$, '3,1', 'reads how often a number has booked with her');
select t.lives($$ insert into public.services (business_id, name, price_mur, kind, stock) values ('b0000000-0000-4000-8000-0000000000a2', 'Shampoo, 250 ml', 350, 'product', 12) $$, 'lists a product, with how many are in stock');
select t.be('authenticated', :'bob', 'Bob, another owner');
select t.is($$ select (select count(*) from public.customers) + (select count(*) from public.payments) + (select count(*) from public.booking_notes) + (select count(*) from public.payment_totals) $$, '0', 'cannot read Alice''s customers, her payments, her notes or her totals');
select t.is($$ select count(*) from public.customer_tallies $$, '0', 'cannot read who has booked with her');
select t.throws($$ insert into public.payments (business_id, paid_on, amount_mur, method) values ('b0000000-0000-4000-8000-0000000000a2', current_date, 5, 'cash') $$, 'cannot write in her ledger', '42501', 'row-level security');
select t.throws($$ insert into public.customers (business_id, name) values ('b0000000-0000-4000-8000-0000000000a2', 'Hacked') $$, 'cannot add to her customers', '42501', 'row-level security');
select t.is($$ with done as (update public.customers set notes = 'Hacked' returning 1) select count(*) from done $$, '0', 'cannot change them');
select t.be('authenticated', :'carol', 'Carol, who once booked with Alice');
select t.is($$ select (select count(*) from public.bookings) || ',' || (select count(*) from public.booking_notes) $$, '1,0', 'reads her own booking, and never the business''s note on a booking');
select t.throws($$ insert into public.booking_notes (booking_id, note) select id, 'Hacked' from public.bookings $$, 'cannot write a note on her booking as if she were the business', '42501', 'row-level security');
select t.be('authenticated', :'admin', 'An admin');
select t.is($$ select (select count(*) from public.customers) + (select count(*) from public.payments) + (select count(*) from public.booking_notes) $$, '0', 'cannot read an owner''s customers, payments or notes: they are the owner''s alone');
select t.be('anon', '', 'A visitor');
select t.throws($$ select * from public.customers $$, 'cannot read customers', '42501');
select t.throws($$ select * from public.payments $$, 'cannot read payments', '42501');
select t.throws($$ select * from public.booking_notes $$, 'cannot read notes on bookings', '42501');
select t.throws($$ select * from public.customer_tallies $$, 'cannot read the tallies', '42501');
select t.throws($$ select * from public.payment_totals $$, 'cannot read the totals', '42501');
select t.is($$ select string_agg(kind, ',' order by kind) from public.services $$, 'product,service,service', 'reads what kind of thing each service is');
select t.throws($$ select stock from public.services $$, 'cannot read how many are in stock', '42501');

------------------------------------------------------------------------------------------------
select t.be('authenticated', :'alice', 'Alice and her advertisements');
select t.lives(format($$ insert into public.ads (business_id, headline, line, place, months) values ('b0000000-0000-4000-8000-0000000000a1', ' Fresh bread at six ', 'Every morning in Curepipe.', 'home', array[%L, %L, %L]) $$, t.month(2), t.month(1), t.month(1)), 'drafts an advertisement for the first screen, for the two months to come');
select t.is($$ select status || ',' || paid || ',' || headline || ',' || cardinality(months) || ',' || (months[1] < months[2]) from public.ads $$, 'draft,false,Fresh bread at six,2,true', 'which is a draft, unpaid, with its months in order and counted once');
select t.throws(format($$ insert into public.ads (business_id, headline, place, months) values ('b0000000-0000-4000-8000-0000000000a1', 'This month', 'home', array[%L]) $$, t.month(0)), 'cannot ask for the month that has begun', '23514', 'months to come');
select t.throws(format($$ insert into public.ads (business_id, headline, place, months) values ('b0000000-0000-4000-8000-0000000000a1', 'Last month', 'home', array[%L]) $$, t.month(-1)), 'cannot ask for a month that has passed', '23514', 'months to come');
select t.throws($$ insert into public.ads (business_id, headline, place, months) values ('b0000000-0000-4000-8000-0000000000a1', 'No month', 'home', array['next month']) $$, 'cannot ask for something that is not a month', '23514');
select t.throws(format($$ insert into public.ads (business_id, headline, place, months, status) values ('b0000000-0000-4000-8000-0000000000a1', 'Approved already', 'home', array[%L], 'approved') $$, t.month(1)), 'cannot send one in already approved', '42501');
select t.throws($$ update public.ads set status = 'submitted' $$, 'cannot send it in without its picture', '23514', 'picture');
select t.throws($$ update public.ads set artwork = 'ads/00000000-0000-4000-8000-0000000000ff/art-1.jpg' $$, 'cannot use another advertisement''s picture', '23514');
select t.lives($$ update public.ads set artwork = 'ads/' || id || '/art-1.jpg' $$, 'gives it its own picture');
select t.lives($$ update public.ads set status = 'submitted' $$, 'sends it in');
select t.throws($$ update public.ads set headline = 'Changed after sending' $$, 'cannot change it while it is with an admin', 'P0001', 'Take the advertisement back');
select t.throws($$ update public.ads set status = 'approved' $$, 'cannot approve it herself', '42501', 'cannot be changed that way');
select t.throws($$ update public.ads set paid = true $$, 'cannot mark it paid herself', '42501');
select t.throws($$ select public.admin_review_ad((select id from public.ads limit 1), true) $$, 'cannot approve it with admin_review_ad', '42501', 'Only an admin');
select t.throws($$ select public.admin_set_ad_paid((select id from public.ads limit 1), true) $$, 'cannot mark it paid with admin_set_ad_paid', '42501', 'Only an admin');
select t.throws($$ insert into storage.objects (bucket_id, name) select 'media', 'ads/' || id || '/art-2.jpg' from public.ads $$, 'cannot add a picture to one that is with an admin', '42501', 'row-level security');
select t.be('authenticated', :'carol', 'Carol, whose shops are still waiting to be checked');
select t.throws(format($$ insert into public.ads (business_id, headline, place, months) select id, 'Too early', 'home', array[%L] from public.businesses limit 1 $$, t.month(1)), 'cannot advertise a business that is not live', '42501', 'row-level security');
select t.be('authenticated', :'bob', 'Bob, another owner');
select t.is($$ select count(*) from public.ads $$, '0', 'cannot read Alice''s advertisement');
select t.is($$ with done as (update public.ads set headline = 'Hacked' returning 1) select count(*) from done $$, '0', 'cannot change it');
select t.be('anon', '', 'A visitor');
select t.is($$ select count(*) from public.ads $$, '0', 'is shown no advertisement that has not been approved');
select t.throws($$ select public.admin_review_ad('00000000-0000-4000-8000-0000000000ff', true) $$, 'cannot call admin_review_ad', '42501');
select t.be('authenticated', :'admin', 'An admin and the advertisements sent in');
select t.is($$ select count(*) from public.ads where status = 'submitted' $$, '1', 'sees what is waiting');
select t.throws($$ select public.admin_review_ad((select id from public.ads limit 1), false, '  ') $$, 'cannot decline without saying why', '22023');
select t.lives($$ select public.admin_review_ad((select id from public.ads limit 1), true) $$, 'approves it');
select t.is($$ select public.ad_state(status, paid, months) || ',' || (reviewed_by = auth.uid()) from public.ads $$, 'approved,true', 'it is approved, by them, and waits for its month and its payment');
select t.lives($$ select public.admin_set_ad_paid((select id from public.ads limit 1), true) $$, 'marks it paid, once payment is arranged');
select t.be('authenticated', :'alice', 'Alice, once her advertisement is approved');
select t.throws($$ update public.ads set headline = 'Changed after approval' $$, 'cannot change it', 'P0001', 'approved advertisement');
select t.is($$ with done as (delete from public.ads returning 1) select count(*) from done $$, '0', 'cannot take it out');
select t.throws($$ insert into storage.objects (bucket_id, name) select 'media', 'ads/' || id || '/art-3.jpg' from public.ads $$, 'cannot swap its picture', '42501', 'row-level security');
select t.lives(format($$ insert into public.ads (business_id, headline, place, months) values ('b0000000-0000-4000-8000-0000000000a1', 'A second one', 'guide-listing', array[%L]) $$, t.month(1)), 'drafts a listing for the pocket guide''s sponsors'' page');
select t.lives($$ update public.ads set status = 'submitted' where headline = 'A second one' $$, 'and sends it in: a listing needs no picture');
select t.be('authenticated', :'admin', 'An admin');
select t.lives($$ select public.admin_review_ad((select id from public.ads where headline = 'A second one'), false, 'Say what you sell.') $$, 'declines it, with a reason');
select t.be('authenticated', :'alice', 'Alice, whose second advertisement was declined');
select t.is($$ select status || ': ' || reason from public.ads where headline = 'A second one' $$, 'declined: Say what you sell.', 'is told why');
select t.lives($$ update public.ads set line = 'Bread, cakes and savouries.' where headline = 'A second one' $$, 'mends it');
select t.is($$ select status || ',' || (reason = '') from public.ads where headline = 'A second one' $$, 'draft,true', 'which makes it a draft again');
select t.lives($$ delete from public.ads where headline = 'A second one' $$, 'and takes it out');

-- Advertisements put in as the owner of the database, each with a known id: one running this month for Bob Books, one approved and
-- unpaid this month, and the pocket guide's four sponsored pages for next month.
reset role;
insert into public.ads (id, business_id, headline, line, link_to, place, months, status, paid, artwork) values
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-0000000000b1', 'Books for every reader', 'New and second-hand, in Port Louis.', 'page', 'home', array[t.month(0)], 'approved', true, 'ads/d0000000-0000-4000-8000-000000000001/art-1.jpg'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-0000000000b1', 'Not paid for yet', '', 'page', 'results', array[t.month(0)], 'approved', false, ''),
  ('d0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-0000000000b1', 'Bob in the guide', 'Books for the beach.', 'page', 'guide-panel', array[t.month(1), t.month(2)], 'approved', true, ''),
  ('d0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-0000000000b1', 'Guide panel, unpaid', '', 'page', 'guide-panel', array[t.month(1)], 'approved', false, ''),
  ('d0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-0000000000b1', 'Page one', '', 'page', 'guide-page', array[t.month(1)], 'approved', true, ''),
  ('d0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-0000000000b1', 'Page two', '', 'page', 'guide-page', array[t.month(1)], 'approved', false, ''),
  ('d0000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-0000000000a3', 'Page three', '', 'page', 'guide-page', array[t.month(1), t.month(2)], 'approved', false, ''),
  ('d0000000-0000-4000-8000-000000000014', 'b0000000-0000-4000-8000-0000000000a3', 'Page four', '', 'page', 'guide-page', array[t.month(1)], 'approved', false, '');
select t.throws(format($$ insert into public.ads (business_id, headline, place, months, status) values ('b0000000-0000-4000-8000-0000000000a3', 'Page five', 'guide-page', array[%L], 'approved') $$, t.month(1)), 'even the owner of the database cannot give an edition of the pocket guide a fifth sponsored page', 'P0001', 'four sponsored pages');
select t.be('authenticated', :'alice', 'Alice asks for a page in the pocket guide');
select t.lives(format($$ insert into public.ads (business_id, headline, place, months) values ('b0000000-0000-4000-8000-0000000000a1', 'A page of bread', 'guide-page', array[%L, %L]) $$, t.month(1), t.month(3)), 'drafts a sponsored page for next month and one later');
select t.lives($$ update public.ads set artwork = 'ads/' || id || '/page-1.jpg', status = 'submitted' where headline = 'A page of bread' $$, 'and sends it in');
select t.be('authenticated', :'admin', 'An admin');
select t.throws($$ select public.admin_review_ad((select id from public.ads where headline = 'A page of bread'), true) $$, 'cannot approve a fifth sponsored page for an edition that has four', 'P0001', 'four sponsored pages');
select t.lives($$ select public.admin_review_ad((select id from public.ads where headline = 'A page of bread'), false, 'Next month is full. Choose another month.') $$, 'declines it, saying the edition is full');
select t.be('authenticated', :'alice', 'Alice');
select t.lives(format($$ update public.ads set months = array[%L], status = 'submitted' where headline = 'A page of bread' $$, t.month(3)), 'moves it to a later month and sends it in again');
select t.be('authenticated', :'admin', 'An admin');
select t.lives($$ select public.admin_review_ad((select id from public.ads where headline = 'A page of bread'), true) $$, 'approves it for an edition with room');
select t.is($$ select string_agg(action, ',' order by id) from public.audit_log where action like 'ad.%' and actor = auth.uid() $$, 'ad.approved,ad.paid,ad.declined,ad.declined,ad.approved', 'what the admin did with advertisements is on the record');

select t.be('anon', '', 'A visitor, and what is advertised to them');
select t.is($$ select string_agg(headline, ',' order by headline) from public.ads where place not like 'guide-%' $$, 'Books for every reader', 'is shown the one advertisement that is approved, paid and running this month: not the unpaid one, not next month''s');
select t.is($$ select public.ad_state(status, paid, months) from public.ads where place = 'home' $$, 'running', 'which is running');
select t.throws($$ select reason from public.ads $$, 'cannot read why an advertisement was declined', '42501');
select t.is($$ select string_agg(month || ' ' || option || ' ' || name || ' ' || line, '; ' order by month, option) from public.guide_sponsors $$, t.month(1) || ' page Bob Books Page one; ' || t.month(1) || ' panel Bob Books Books for the beach.; ' || t.month(2) || ' panel Bob Books Books for the beach.', 'reads who sponsors each edition of the pocket guide: the approved and paid, a row a month');
select t.throws($$ update public.ads set paid = true $$, 'cannot change an advertisement', '42501');
reset role;
update public.businesses set status = 'suspended' where id = 'b0000000-0000-4000-8000-0000000000b1';
select t.be('anon', '', 'A visitor, while Bob Books is suspended');
select t.is($$ select (select count(*) from public.ads) + (select count(*) from public.guide_sponsors) $$, '0', 'is shown none of its advertisements, on the site or in the guide');
reset role;
update public.businesses set status = 'live' where id = 'b0000000-0000-4000-8000-0000000000b1';
select t.is($$ select public.ad_state('approved', true, array[t.month(-1)]) || ',' || public.ad_state('approved', false, array[t.month(0)]) || ',' || public.ad_state('submitted', false, array[t.month(1)]) $$, 'ended,approved,submitted', 'an advertisement whose months have passed has ended; one not paid for is not running');

------------------------------------------------------------------------------------------------
select t.be('authenticated', :'alice', 'Alice asks to stop a plan at the end of its period');
select t.lives($$ insert into public.plan_requests (business_id, plan, note) values ('b0000000-0000-4000-8000-0000000000a1', 'free', 'We are closing for the season.') $$, 'asks for her bakery''s plan not to be renewed');
select t.be('authenticated', :'admin', 'An admin');
select t.lives($$ select public.admin_handle_plan_request((select id from public.plan_requests where business_id = 'b0000000-0000-4000-8000-0000000000a1' and status = 'open'), true) $$, 'accepts');
select t.is($$ select plan || ',' || (plan_until = current_date + 365) || ',' || (select count(*) from public.plan_requests r where r.business_id = b.id and r.status = 'open') from public.businesses b where id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'go,true,0', 'the plan runs to the day it was paid to, and no further');

------------------------------------------------------------------------------------------------
select t.be('anon', '', 'A visitor places an order as a guest');
select t.is($$ select count(*) from public.catalogue where active $$, '13', 'reads what the site sells, and at what price');
select t.is($$ select public.place_order('[{"id": "guide:mauritius-places-to-see", "qty": 2}, {"id": "sponsor:panel", "qty": 3, "detail": "From next month"}]'::jsonb, ' Gita Guest ', '+230 5123 4567', '', 'Call in the afternoon.') ->> 'total' $$, '4800', 'orders two guides and three months of a panel, and is told the total at the site''s own prices');
select t.is($$ select public.place_order('[{"id": "guide:mauritius-places-to-see", "qty": 1, "price": 1, "unit_mur": 1, "price_mur": 1}]'::jsonb, 'Gita Guest', '', 'GITA@guest.mu') ->> 'total' $$, '150', 'cannot set a price of their own: a price sent with a line is not read');
select t.is($$ select (public.place_order('[{"id": "ad:home", "qty": 1}]'::jsonb, 'Gita Guest', '', 'gita@guest.mu')) ->> 'on_request' $$, 'true', 'orders something priced on request, and is told so');
select t.throws($$ select public.place_order('[{"id": "plan:platinum", "qty": 1}]'::jsonb, 'Gita Guest', '+230 5123 4567') $$, 'cannot order what the site does not sell', '22023', 'does not sell');
select t.throws($$ select public.place_order('[{"id": "plan:go", "qty": 0}]'::jsonb, 'Gita Guest', '+230 5123 4567') $$, 'cannot order none of a thing', '22023');
select t.throws($$ select public.place_order('[{"id": "plan:go", "qty": 500}]'::jsonb, 'Gita Guest', '+230 5123 4567') $$, 'cannot order five hundred of a thing', '22023');
select t.throws($$ select public.place_order('[]'::jsonb, 'Gita Guest', '+230 5123 4567') $$, 'cannot place an empty order', '22023');
select t.throws($$ select public.place_order('[{"id": "plan:go", "qty": 1}]'::jsonb, 'Gita Guest') $$, 'cannot order without a way to be reached', '22023', 'reach you');
select t.throws($$ select public.place_order('[{"id": "plan:go", "qty": 1}]'::jsonb, '', '+230 5123 4567') $$, 'cannot order without a name', '22023');
select t.throws($$ select * from public.orders $$, 'cannot read orders, their own included', '42501');
select t.throws($$ select * from public.order_items $$, 'cannot read the lines of orders', '42501');
select t.throws($$ insert into public.orders (name, phone, total_mur, status) values ('Gita Guest', '+230 5123 4567', 1, 'paid') $$, 'cannot write an order straight to the table', '42501');
select t.throws($$ update public.catalogue set price_mur = 1 $$, 'cannot change a price', '42501');
select t.throws($$ select public.set_catalogue('[{"id": "plan:go", "name": "Biznes Go", "price": 1}]'::jsonb) $$, 'cannot call set_catalogue', '42501');
select t.throws($$ select public.admin_set_order('00000000-0000-4000-8000-0000000000ff', 'paid') $$, 'cannot call admin_set_order', '42501');
select t.lives($$ select public.place_order('[{"id": "plan:go", "qty": 1}]'::jsonb, 'Gita Guest', '(230) 5123-4567') from generate_series(1, 4) $$, 'places four more orders from the same telephone number');
select t.throws($$ select public.place_order('[{"id": "plan:go", "qty": 1}]'::jsonb, 'Gita Guest', '+230 51 23 45 67') $$, 'the sixth in an hour from one number is refused, however the number is written', 'P0001', 'last hour');
select t.be('authenticated', :'carol', 'Carol places an order while signed in');
select t.throws($$ select public.place_order('[{"id": "plan:grow", "qty": 2}]'::jsonb) $$, 'cannot order while her profile has no name, unless she gives one', '22023', 'name');
select t.lives($$ update public.profiles set name = 'Carol' where id = auth.uid() $$, 'gives her profile a name');
select t.is($$ select (public.place_order('[{"id": "plan:grow", "qty": 2, "detail": "For Carol Shop 1"}]'::jsonb)) ->> 'total' $$, '2500', 'orders two months of Biznes Grow, leaving her name and address to her profile');
select t.is($$ select count(*) || ',' || min(name) || ',' || min(email) || ',' || min(status) || ',' || bool_and(customer_id = auth.uid()) from public.orders $$, '1,Carol,carol@new.mu,placed,true', 'reads her own order and no other: not the guest''s');
select t.is($$ select string_agg(item || ' x' || qty || ' at ' || unit_mur || ' a ' || per || ' (' || detail || ')', ',') from public.order_items $$, 'plan:grow x2 at 1250 a month (For Carol Shop 1)', 'reads its lines, priced as the catalogue had them');
select t.throws($$ update public.orders set status = 'paid', total_mur = 1 $$, 'cannot mark her own order paid, or change its total', '42501');
select t.throws($$ update public.order_items set unit_mur = 1 $$, 'cannot change the price on a line', '42501');
select t.throws($$ delete from public.orders $$, 'cannot delete an order', '42501');
select t.throws($$ select public.admin_set_order((select id from public.orders limit 1), 'paid') $$, 'cannot move her order on with admin_set_order', '42501', 'Only an admin');
select t.be('authenticated', :'bob', 'Bob, another person');
select t.is($$ select (select count(*) from public.orders) + (select count(*) from public.order_items) $$, '0', 'cannot read Carol''s order, the guest''s, or any line of either');
select t.be('authenticated', :'admin', 'An admin and the orders');
select t.is($$ select count(*) || ',' || count(*) filter (where customer_id is null) from public.orders $$, '8,7', 'reads every order, the guest''s among them');
select t.lives($$ select public.admin_set_order((select id from public.orders where customer_id is not null), 'awaiting_payment', 'Sent the Juice number.') $$, 'marks one as awaiting payment, with a note for the admins');
select t.lives($$ select public.admin_set_order((select id from public.orders where customer_id is not null), 'paid') $$, 'and then as paid');
select t.is($$ select status || ',' || admin_note || ',' || (handled_by = auth.uid()) from public.orders where customer_id is not null $$, 'paid,Sent the Juice number.,true', 'which the order then says, with who did it');
select t.throws($$ select public.admin_set_order((select id from public.orders limit 1), 'refunded') $$, 'cannot give a status that does not exist', '22023');
select t.is($$ select string_agg(action, ',' order by id) from public.audit_log where action like 'order.%' $$, 'order.awaiting_payment,order.paid', 'each step is on the record');
select t.throws($$ select public.set_catalogue('[{"id": "plan:go", "name": "Biznes Go", "price": 1, "per": "month"}]'::jsonb) $$, 'cannot change what the site sells: that is the superadmin''s', '42501', 'Only the superadmin');
select t.be('authenticated', :'owner', 'The superadmin and what the site sells');
select t.lives($$ select public.set_catalogue('[{"id": "plan:go", "name": "Biznes Go", "price": 600, "per": "month"}, {"id": "guide:mauritius-places-to-see", "name": "Mauritius, place by place", "price": 150, "per": "each"}]'::jsonb) $$, 'brings the catalogue level with the site''s data');
select t.is($$ select (select price_mur from public.catalogue where id = 'plan:go') || ',' || (select count(*) from public.catalogue where active) || ',' || (select count(*) from public.catalogue) $$, '600,2,13', 'a price is changed, and what is no longer sold is switched off, not deleted');
select t.be('authenticated', :'carol', 'Carol, after the prices changed');
select t.is($$ select string_agg(unit_mur::text, ',') from public.order_items $$, '1250', 'still reads her order at the price of its day');
select t.throws($$ select public.place_order('[{"id": "plan:grow", "qty": 1}]'::jsonb) $$, 'cannot order what has been switched off', '22023', 'does not sell');

------------------------------------------------------------------------------------------------
reset role;
select E'\n# The second lock: the same rules held by triggers, should a grant ever be widened by mistake';
grant insert, update on public.businesses, public.profiles, public.bookings, public.plan_requests to authenticated;
grant insert on public.bookings to anon;
select t.be('authenticated', :'alice', 'Alice, with every column granted to her by mistake');
select t.throws($$ update public.profiles set role = 'superadmin' where id = auth.uid() $$, 'still cannot change her own role', '42501', 'Only a superadmin');
select t.throws($$ update public.businesses set status = 'suspended' where id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'still cannot change her own status', '42501', 'Only an admin');
select t.throws($$ update public.businesses set plan = 'grow', plan_until = current_date + 3650 where id = 'b0000000-0000-4000-8000-0000000000a2' $$, 'still cannot change her own plan', '42501', 'Only an admin');
select t.throws($$ update public.businesses set verified = false where id = 'b0000000-0000-4000-8000-0000000000a1' $$, 'still cannot change her own verified mark', '42501', 'Only an admin');
select t.lives($$ insert into public.businesses (name, category, status, plan, plan_until, verified, owner_id) values ('Alice Tries', 'florists', 'live', 'grow', current_date + 3650, true, '00000000-0000-4000-8000-00000000000b') $$, 'a business sent as live, on Grow, verified and in Bob''s name is taken');
select t.is($$ select status || ',' || plan || ',' || (plan_until is null) || ',' || verified || ',' || (owner_id = auth.uid()) from public.businesses where name = 'Alice Tries' $$, 'pending,free,true,false,true', 'but lands pending, free, unverified and in her own');
select t.throws($$ update public.bookings set name = 'Hacked' where business_id = 'b0000000-0000-4000-8000-0000000000a2' $$, 'still cannot rewrite a booking', '42501', 'Only the status');
select t.lives($$ insert into public.plan_requests (business_id, plan, status, handled_at) values ('b0000000-0000-4000-8000-0000000000a3', 'grow', 'done', now()) $$, 'a request sent as already done is taken');
select t.is($$ select status || ',' || (handled_at is null) from public.plan_requests where business_id = 'b0000000-0000-4000-8000-0000000000a3' $$, 'open,true', 'but lands open');
reset role;
update public.businesses set plan = 'grow', plan_until = current_date + 30 where id = 'b0000000-0000-4000-8000-0000000000a2';
select t.be('anon', '', 'A visitor, with every column granted to them by mistake');
select t.lives($$ insert into public.bookings (business_id, name, phone, wanted_at, status, customer_id) values ('b0000000-0000-4000-8000-0000000000a2', 'Eve', '+230 5666 0001', now() + interval '2 days', 'confirmed', '00000000-0000-4000-8000-00000000000c') $$, 'a booking sent as confirmed and in Carol''s name is taken');
reset role;
select t.is($$ select status || ',' || (customer_id is null) from public.bookings where name = 'Eve' $$, 'requested,true', 'but lands as a plain request from nobody');

------------------------------------------------------------------------------------------------
select E'\n# The security review: what is typed, and what nobody outside may reach';
select t.be('authenticated', :'alice', 'Alice, writing straight to the API, past the website''s own checks');
select t.throws($$ update public.businesses set website = 'javascript:alert(1)' where name = 'Alice Flowers' $$, 'cannot give a web address that is a script', '23514');
select t.throws($$ update public.businesses set website = 'data:text/html,hello' where name = 'Alice Flowers' $$, 'nor one that is a page in itself', '23514');
select t.throws($$ update public.businesses set website = 'https://example.mu/ onclick=x' where name = 'Alice Flowers' $$, 'nor one with a space in it', '23514');
select t.lives($$ update public.businesses set website = 'https://example.mu/flowers' where name = 'Alice Flowers' $$, 'can give one that begins http or https');
select t.throws($$ update public.businesses set phone = '<script>alert(1)</script>' where name = 'Alice Flowers' $$, 'cannot give a telephone number that is not one', '23514');
select t.throws($$ update public.businesses set about = repeat('a', 1201) where name = 'Alice Flowers' $$, 'cannot write more than 1,200 characters about a business', '23514');
select t.throws($$ update public.businesses set name = repeat('a', 121) where name = 'Alice Flowers' $$, 'cannot give a name longer than 120 characters', '23514');
select t.throws($$ update public.businesses set category = '../admin' where name = 'Alice Flowers' $$, 'cannot give a category that is not a plain word', '23514');
select t.throws($$ update public.businesses set town = 'a town with spaces' where name = 'Alice Flowers' $$, 'nor a town that is not one', '23514');
select t.throws($$ insert into public.businesses (name, category, listing_id) values ('Alice Claims', 'florists', 'n1; drop table public.businesses') $$, 'cannot claim a listing whose id is not an id', '23514');
select t.throws($$ update public.profiles set phone = 'javascript:alert(1)' where id = auth.uid() $$, 'cannot put anything but a telephone number on her profile', '23514');
select t.throws($$ insert into public.plan_requests (business_id, plan, note) values ('b0000000-0000-4000-8000-0000000000a2', 'go', repeat('a', 501)) $$, 'cannot send a note longer than 500 characters with a request', '23514');
select t.throws($$ select private.record('made.up', 'by hand') $$, 'cannot write to the record through its own function', '42501');
select t.be('anon', '', 'A visitor, trying what is left');
select t.throws($$ select public.admin_handle_plan_request('00000000-0000-4000-8000-000000000000', true, current_date + 365) $$, 'cannot call admin_handle_plan_request', '42501');
select t.throws($$ select email from public.profiles $$, 'cannot read a single column of the profiles', '42501');
select t.throws($$ insert into public.bookings (business_id, name, phone, wanted_at, note) values ('b0000000-0000-4000-8000-0000000000a2', 'Dev', '+230 5999 0009', now() + interval '2 days', repeat('a', 501)) $$, 'cannot send a note longer than 500 characters with a booking', '23514');
reset role;
select E'\n# The catalogue itself';
select t.is($$ select coalesce(bool_or(has_function_privilege(r.name, p.oid, 'execute')), false)::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace, (values ('anon'), ('authenticated')) r (name) where n.nspname = 'public' and p.proname = 'rls_auto_enable' $$, 'false', 'the project''s own rls_auto_enable(), where there is one, is closed to a visitor and to anyone signed in');
select t.is($$ select coalesce(string_agg(c.relname, ', ' order by c.relname), 'none') from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity $$, 'none', 'every table in public has row level security switched on');
select t.is($$ select coalesce(string_agg(p.proname, ', ' order by p.proname), 'none') from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public', 'private') and p.prosecdef and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) setting where setting like 'search_path=%') $$, 'none', 'every function that runs as its owner fixes its search path');
select t.is($$ select coalesce(string_agg(p.proname, ', ' order by p.proname), 'none') from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'private' and has_function_privilege('anon', p.oid, 'execute') $$, 'takes_bookings', 'of the policies'' helpers a visitor may run one: whether a business takes bookings');

------------------------------------------------------------------------------------------------
select E'\n# The owner of the database, in the SQL editor';
select t.throws($$ update public.profiles set role = 'user' where email = 'owner@test.mu' $$, 'cannot demote the last superadmin either', 'P0001', 'last superadmin');
select t.throws($$ delete from auth.users where email = 'owner@test.mu' $$, 'cannot remove the last superadmin''s account', 'P0001', 'last superadmin');
select t.lives($$ update public.profiles set role = 'superadmin' where email = 'admin@test.mu' $$, 'can make a second superadmin');
select t.lives($$ update public.profiles set role = 'user' where email = 'owner@test.mu' $$, 'after which the first can be demoted');
select t.lives($$ delete from auth.users where email = 'alice@test.mu' $$, 'can remove an account');
select t.is($$ select count(*) from public.businesses where name like 'Alice%' $$, '0', 'and its businesses go with it');

rollback;

select format(E'\n1..%s', last_value) from t.n;
select case when is_called then last_value else 0 end as failed, is_called as any_failed from t.failed \gset
select case when :failed = 0 then '# All passed.' else format('# %s FAILED.', :failed) end;
set client_min_messages = warning;
drop schema t cascade;
-- A failure ends the run with an error, so the script that called it fails too.
\if :any_failed
  do $$ begin raise exception 'The row level security tests failed.'; end; $$;
\endif
