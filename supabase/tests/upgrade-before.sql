-- Rows as a project might hold them after parts 1 to 10 and before part 11, written as the owner
-- of the database: among them the rows part 11 has to mend. Run by scripts/test-rls.sh on a
-- scratch database, between the two; upgrade-after.sql then says what became of them.

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000000001', 'owner@test.mu', '{"name": "Owner"}'),
  ('00000000-0000-4000-8000-00000000000a', 'alice@test.mu', '{"name": "Alice"}');

insert into public.businesses (id, owner_id, name, category, town, phone, website, plan, plan_until, verified, status) values
  ('b0000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-00000000000a', 'Alice Bakery', 'bakeries', 'curepipe', '+230 5111 1111', 'https://bakery.example.mu/', 'go', current_date + 30, true, 'live');

-- A month that is null beside one that is a month: part 8's check let it through.
insert into public.ads (id, business_id, headline, link_to, place, months, status, paid) values
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-0000000000a1', 'Leads to her website', 'website', 'home', array['2027-01', null], 'approved', true),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-0000000000a1', 'Leads to her page', 'page', 'guide-panel', array['2027-02'], 'approved', true),
  ('d0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-0000000000a1', 'Still waiting', 'website', 'results', array['2027-03'], 'submitted', false);

-- A null among a page's photographs and among its hours: part 6's trigger let both through.
insert into public.showcases (business_id, tagline, hours, cover, photos) values
  ('b0000000-0000-4000-8000-0000000000a1', 'Bread since 1998', array['Monday to Saturday: 6 to 6', null], '', array['business/b0000000-0000-4000-8000-0000000000a1/photo-1.jpg', null]);

-- Two on the list: one plain, one that part 11's narrower pattern would no longer take.
insert into public.subscribers (email, wants_guide) values ('plain@reader.mu', true), ('o''neil@reader.mu', true);

-- An order placed before the proof was asked for.
select public.place_order('[{"id": "plan:go", "qty": 2}]'::jsonb, 'Gita Guest', '+230 5123 4567') \gset before_

-- A picture in the bucket, as an upload leaves it.
insert into storage.objects (bucket_id, name) values ('media', 'business/b0000000-0000-4000-8000-0000000000a1/photo-1.jpg');
