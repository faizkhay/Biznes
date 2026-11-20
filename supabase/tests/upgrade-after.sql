-- What became of the rows in upgrade-before.sql once part 11 (and anything after it) was applied.
-- Each line is one claim; the first that fails stops the run.
\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on

create function pg_temp.claim(pass boolean, what text) returns text
language plpgsql as $$
begin
  if pass is not true then
    raise exception 'not ok - %', what;
  end if;
  return 'ok - ' || what;
end;
$$;

select pg_temp.claim((select count(*) = 13 from public.catalogue) and (select count(*) = 5 from public.food_categories) and (select count(*) = 2 from public.profiles) and (select count(*) = 1 from public.site_settings) and (select count(*) > 0 from public.audit_log), 'the catalogue, the food categories, the profiles, the settings and the record are as they were');
select pg_temp.claim((select months = array['2027-01'] from public.ads where id = 'd0000000-0000-4000-8000-000000000001'), 'the null is gone from an advertisement''s months, and its month is kept');
select pg_temp.claim((select count(*) = 3 from public.ads) and (select bool_and(private.are_months(months)) from public.ads), 'every advertisement is still there, each with months that are months');
select pg_temp.claim((select link_url = 'https://bakery.example.mu/' and status = 'approved' and paid from public.ads where id = 'd0000000-0000-4000-8000-000000000001'), 'an approved advertisement that leads to a website is given the address it leads to today, and is still approved and paid');
select pg_temp.claim((select link_url = '' from public.ads where id = 'd0000000-0000-4000-8000-000000000002') and (select link_url = '' from public.ads where id = 'd0000000-0000-4000-8000-000000000003'), 'one that leads to its page, and one not yet approved, are given none');
select pg_temp.claim((select string_agg(option || ' ' || website, ',' order by month) = 'panel ' from public.guide_sponsors), 'the guide''s sponsors read through the new column');
select pg_temp.claim((select hours = array['Monday to Saturday: 6 to 6'] and photos = array['business/b0000000-0000-4000-8000-0000000000a1/photo-1.jpg'] from public.showcases), 'the nulls are gone from a page''s hours and photographs, and the rest is kept');
select pg_temp.claim((select count(*) = 2 from public.subscribers), 'both addresses are still on the list, the one the new pattern would refuse among them');
select pg_temp.claim((select count(*) = 1 from public.orders where total_mur = 1100), 'the order placed before is as it was');

-- What is new works on the old rows.
select public.subscribe('plain@reader.mu', false, true);
select pg_temp.claim((select wants_guide and wants_magazine from public.subscribers where email = 'plain@reader.mu') and (select count(*) = 1 from private.subscribe_tries), 'an address that joined before is still heard, and the call is counted');
select pg_temp.claim((select (public.place_order('[{"id": "plan:grow", "qty": 1}]'::jsonb, 'Gita Guest', '+230 5123 4567')) ->> 'total' = '1250'), 'an order is still taken, by the function that now stands in front');
select pg_temp.claim(to_regprocedure('public.admin_review_ad(uuid, boolean, text)') is null and to_regprocedure('public.admin_review_ad(uuid, boolean, text, timestamptz)') is not null, 'approval is the function that asks for a stamp, and the one that did not is gone');
select pg_temp.claim((select string_agg(polname, ', ' order by polname) = 'biznes media: add your own pictures, biznes media: counted by the database, biznes media: remove your own pictures, biznes media: see your own pictures' from pg_policy where polrelid = 'storage.objects'::regclass), 'the bucket has its four rules');
select pg_temp.claim((select polroles = array[(select proowner from pg_proc where oid = 'private.may_keep_media(text, boolean)'::regprocedure)] from pg_policy where polrelid = 'storage.objects'::regclass and polname = 'biznes media: counted by the database'), 'the rule that lets the folder limits be counted is for the role the counting function runs as');
select pg_temp.claim((select count(*) = 1 from storage.objects), 'and the picture that was in it');
