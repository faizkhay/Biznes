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
