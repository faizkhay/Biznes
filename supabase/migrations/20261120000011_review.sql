-- biznes.mu accounts, part 11: what a security review of parts 5 to 10 found, put right.
--
-- It alters what is there and keeps every row. Each heading says what was wrong.
--
--   1. An advertisement could be approved after its owner had changed it behind the admin's page.
--   2. Where an approved advertisement leads could be changed after it was approved.
--   3. Joining the list answered differently for an address already on it.
--   4. The hourly limits could be used up by anyone calling the API with the public key.
--   5. A month that was null passed the check on an advertisement's months.
--   6. Pictures outlived what they belonged to, nobody could remove them, and nothing bounded them.
--   7. An owner could fill the record by sending an advertisement in and taking it back.
--   9. The pattern of an email address on the list was wider than it needed to be.
--
-- (8 and 10 are the website's alone: the kind of a picture as stored, and the upload routes.)

------------------------------------------------------------------------------------------------
-- 4. A proof that a call came through the website.
--
-- Joining the list, leaving it and placing an order are open to a visitor, so each is limited by
-- the hour for everyone together. Anyone holding the public key could spend that limit from
-- outside and so switch the thing off for everybody. The website therefore sends a word with each
-- call, in the header `x-biznes-proof`, from a variable only its server holds (BIZNES_SITE_PROOF);
-- here is kept the SHA-256 of that word, never the word. A call without it is refused.
--
-- Until a hash is put here nothing is asked for, so applying this file breaks nothing. To switch
-- it on: set BIZNES_SITE_PROOF on the website, deploy, then, with the same word,
--
--   insert into private.site_proof (word_hash) values (encode(sha256(convert_to('<the word>', 'utf8')), 'hex'))
--   on conflict (id) do update set word_hash = excluded.word_hash;
create table private.site_proof (
  -- One row, and only ever one.
  id boolean primary key default true check (id),
  word_hash text not null check (word_hash ~ '^[0-9a-f]{64}$')
);
comment on table private.site_proof is 'The SHA-256 of the word the website sends with a visitor''s writes. Empty: no word is asked for.';
alter table private.site_proof enable row level security;
revoke all on table private.site_proof from public, anon, authenticated;

create function private.from_site() returns boolean
language sql stable security definer set search_path = ''
as $$
  select not exists (select 1 from private.site_proof)
    or exists (
      select 1 from private.site_proof p
      where p.word_hash = encode(sha256(convert_to(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-biznes-proof', ''), 'utf8')), 'hex'));
$$;
-- Nobody outside is given the right to run it: the three functions that ask run as their owner.
revoke all on function private.from_site() from public, anon, authenticated;

------------------------------------------------------------------------------------------------
-- 3, 4 and 9. Joining the list.
--
-- Before, an address already on the list was answered before the hourly limit was looked at, and
-- a new one after it: with the limit reached the two answers differed, which told a caller
-- whether an address was on the list. Now every call is counted and refused alike, before the
-- list is touched, and what is counted is the calls, not the rows they made.
create table private.subscribe_tries (
  at timestamptz not null default now()
);
comment on table private.subscribe_tries is 'One row for each call to subscribe() in the last day, to count them by.';
create index subscribe_tries_at on private.subscribe_tries (at);
alter table private.subscribe_tries enable row level security;
revoke all on table private.subscribe_tries from public, anon, authenticated;

create or replace function public.subscribe(address text, guide boolean default true, magazine boolean default true) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  clean text := lower(btrim(coalesce(address, '')));
begin
  if not private.from_site() then
    raise exception 'Join the list from the website.' using errcode = '42501', hint = 'forbidden';
  end if;
  -- Letters, digits and the few marks an address is written with: nothing a spreadsheet could read as a formula's separator.
  if char_length(clean) > 160 or clean !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' then
    raise exception 'That email address does not look right.' using errcode = '22023', hint = 'subscribe_email';
  end if;
  if not (coalesce(guide, false) or coalesce(magazine, false)) then
    raise exception 'Choose at least one thing to be sent.' using errcode = '22023', hint = 'subscribe_nothing';
  end if;
  -- One at a time, so the counts below cannot be raced past.
  perform pg_advisory_xact_lock(hashtext('biznes.subscribers'));
  delete from private.subscribe_tries t where t.at < now() - interval '1 day';
  if (select count(*) from private.subscribe_tries t where t.at > now() - interval '1 hour') >= 200
    or (select count(*) from private.subscribe_tries) >= 2000 then
    raise exception 'Many people have joined in the last while. Try again later.' using errcode = 'P0001', hint = 'subscribe_busy';
  end if;
  insert into private.subscribe_tries default values;
  -- A new address and one already here take the same road from this line on.
  insert into public.subscribers as s (email, wants_guide, wants_magazine)
  values (clean, coalesce(guide, false), coalesce(magazine, false))
  on conflict (email) do update
    set wants_guide = s.wants_guide or excluded.wants_guide, wants_magazine = s.wants_magazine or excluded.wants_magazine;
end;
$$;

create or replace function public.unsubscribe(leave_token uuid) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.from_site() then
    raise exception 'Leave the list from the link you were sent.' using errcode = '42501', hint = 'forbidden';
  end if;
  delete from public.subscribers where token = leave_token;
  return found;
end;
$$;

-- New addresses, and any change to an old one, keep to the narrower pattern. The rows already
-- here are not looked at again: an address that joined before stays as it is.
alter table public.subscribers
  add constraint subscribers_email_plain check (email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$') not valid;

------------------------------------------------------------------------------------------------
-- 4. Placing an order asks for the proof too. The function written in part 10 is kept whole,
-- moved out of the API's reach, and called by a short one that asks first.
alter function public.place_order(jsonb, text, text, text, text) rename to place_order_checked;
alter function public.place_order_checked(jsonb, text, text, text, text) set schema private;
revoke all on function private.place_order_checked(jsonb, text, text, text, text) from public, anon, authenticated;

create function public.place_order(lines jsonb, buyer_name text default '', buyer_phone text default '', buyer_email text default '', buyer_note text default '') returns jsonb
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.from_site() then
    raise exception 'Place an order from the website.' using errcode = '42501', hint = 'forbidden';
  end if;
  -- Who is asking is read from the request, as before: this function only stands in front.
  return private.place_order_checked(lines, buyer_name, buyer_phone, buyer_email, buyer_note);
end;
$$;
revoke all on function public.place_order(jsonb, text, text, text, text) from public;
grant execute on function public.place_order(jsonb, text, text, text, text) to anon, authenticated;

------------------------------------------------------------------------------------------------
-- 5. A null among an advertisement's months, or among a page's pictures or hours.
--
-- `bool_and` passes over a null, so {2027-01,NULL} was taken for a list of months, and the page
-- that reads the months fell over on it. A null is now not a month.
create or replace function private.are_months(months text[]) returns boolean
language sql immutable set search_path = ''
as $$
  select coalesce(bool_and(coalesce(m ~ '^[0-9]{4}-(0[1-9]|1[0-2])$', false)), false) from unnest(months) m;
$$;

-- A visitor writes no advertisement, so has no use for the check on its months.
revoke execute on function private.are_months(text[]) from anon;

-- Rows already holding one are mended: the null goes, the months stay.
update public.ads set months = array_remove(months, null) where array_position(months, null) is not null;
update public.showcases
  set photos = array_remove(photos, null), hours = array_remove(hours, null)
  where array_position(photos, null) is not null or array_position(hours, null) is not null;

create or replace function private.showcases_before_write() returns trigger
language plpgsql set search_path = ''
as $$
declare
  folder text := 'business/' || new.business_id || '/';
  picture text;
  line text;
begin
  if tg_op = 'UPDATE' and new.business_id <> old.business_id then
    raise exception 'A showcase stays with its business.' using errcode = '42501', hint = 'forbidden';
  end if;
  new.tagline := btrim(new.tagline);
  -- A null passes every comparison below without failing one, so it is refused by name.
  if array_position(new.photos, null) is not null then
    raise exception 'A page shows only its own pictures.' using errcode = '23514', hint = 'picture_path';
  end if;
  if array_position(new.hours, null) is not null then
    raise exception 'Each line of opening hours is up to 80 characters.' using errcode = '23514', hint = 'hours_line';
  end if;
  foreach picture in array array_append(new.photos, new.cover) loop
    if picture <> '' and (left(picture, char_length(folder)) <> folder or substr(picture, char_length(folder) + 1) !~ '^[a-z0-9-]{1,64}\.(jpg|png|webp)$') then
      raise exception 'A page shows only its own pictures.' using errcode = '23514', hint = 'picture_path';
    end if;
  end loop;
  if exists (select 1 from unnest(new.photos) p where p = '') then
    raise exception 'A page shows only its own pictures.' using errcode = '23514', hint = 'picture_path';
  end if;
  foreach line in array new.hours loop
    if char_length(line) > 80 or btrim(line) = '' then
      raise exception 'Each line of opening hours is up to 80 characters.' using errcode = '23514', hint = 'hours_line';
    end if;
  end loop;
  new.updated_at := now();
  return new;
end;
$$;

------------------------------------------------------------------------------------------------
-- 2. Where an advertisement leads is fixed when it is approved.
--
-- An advertisement that leads to the business's own website read the address from the business's
-- row each time it was shown, and the owner may change that row whenever they like. Now the
-- address is copied onto the advertisement at the moment it is approved, and that copy is what is
-- shown. It is emptied when the advertisement is declined or goes back to being a draft.
alter table public.ads
  add column link_url text not null default '' check (link_url = '' or (char_length(link_url) <= 200 and link_url ~* '^https?://[^[:space:]]+$'));
comment on column public.ads.link_url is 'The business''s website as it was when an admin approved this advertisement, when it leads there. Empty: it leads to the business''s page on the site.';
grant select (link_url) on table public.ads to anon;

-- How many advertisements a business keeps, counted past row level security.
create function private.ads_of(business uuid) returns bigint
language sql stable security definer set search_path = ''
as $$
  select count(*) from public.ads a where a.business_id = business;
$$;
revoke all on function private.ads_of(uuid) from public;
grant execute on function private.ads_of(uuid) to authenticated;

-- The guard on an advertisement, as in part 8, with four changes: a null is not a month (5); a
-- business keeps twenty advertisements at most (6); the address an advertisement leads to is
-- copied at approval and emptied otherwise (2); and every write gives the row a new stamp, which
-- is what an admin's approval is checked against (1).
create or replace function private.ads_guard() returns trigger
language plpgsql set search_path = ''
as $$
declare
  changed boolean;
begin
  new.headline := btrim(new.headline);
  new.line := btrim(new.line);
  new.months := array(select distinct m from unnest(new.months) m where m is not null order by m);
  if new.artwork <> '' and new.artwork !~ ('^ads/' || new.id || '/[a-z0-9-]{1,64}\.(jpg|png|webp)$') then
    raise exception 'An advertisement shows only its own picture.' using errcode = '23514', hint = 'picture_path';
  end if;

  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      -- One at a time for a business, so the count cannot be raced past.
      perform pg_advisory_xact_lock(hashtext('biznes.ads.' || new.business_id));
      if private.ads_of(new.business_id) >= 20 then
        raise exception 'A business keeps twenty advertisements at most. Take one out first.' using errcode = 'P0001', hint = 'too_many';
      end if;
      new.status := 'draft';
      new.paid := false;
      new.reason := '';
      new.artwork := '';
      new.reviewed_by := null;
      new.reviewed_at := null;
      new.created_at := now();
    else
      if old.status = 'approved' then
        raise exception 'An approved advertisement is changed by us. Ask and we will.' using errcode = 'P0001', hint = 'ad_approved';
      end if;
      if new.id <> old.id or new.business_id <> old.business_id or new.paid <> old.paid or new.reason <> old.reason
        or new.reviewed_by is distinct from old.reviewed_by or new.reviewed_at is distinct from old.reviewed_at or new.created_at <> old.created_at then
        raise exception 'Only an admin can change that.' using errcode = '42501', hint = 'forbidden';
      end if;
      changed := new.headline <> old.headline or new.line <> old.line or new.link_to <> old.link_to or new.artwork <> old.artwork or new.place <> old.place or new.months <> old.months;
      if changed and old.status = 'submitted' then
        raise exception 'Take the advertisement back before you change it.' using errcode = 'P0001', hint = 'ad_submitted';
      end if;
      if new.status <> old.status then
        if not ((old.status in ('draft', 'declined') and new.status = 'submitted') or (old.status in ('submitted', 'declined') and new.status = 'draft')) then
          raise exception 'That advertisement cannot be changed that way.' using errcode = '42501', hint = 'ad_step';
        end if;
      elsif changed and old.status = 'declined' then
        -- Mending a declined advertisement makes it a draft again.
        new.status := 'draft';
      end if;
      if new.status <> 'declined' then
        new.reason := '';
      end if;
    end if;
    if new.status in ('draft', 'submitted') and exists (select 1 from unnest(new.months) m where m <= private.this_month()) then
      raise exception 'An advertisement runs in months to come, never the one that has begun.' using errcode = '23514', hint = 'ad_months';
    end if;
    if new.status = 'submitted' and (tg_op = 'INSERT' or old.status <> 'submitted') then
      if new.artwork = '' and new.place <> 'guide-listing' then
        raise exception 'Add the picture before you send it in.' using errcode = '23514', hint = 'ad_artwork';
      end if;
      if not private.is_live(new.business_id) then
        raise exception 'Only a live business can advertise.' using errcode = '42501', hint = 'ad_live';
      end if;
    end if;
  end if;

  -- Where it leads, whoever approves and by whatever route: copied as it becomes approved, kept
  -- while it stays so, and emptied whenever it is anything else.
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status <> 'approved') then
    new.link_url := case when new.link_to = 'website' then coalesce((select b.website from public.businesses b where b.id = new.business_id), '') else '' end;
  elsif new.status <> 'approved' then
    new.link_url := '';
  end if;
  -- The clock's own time, not the transaction's: two writes never carry one stamp.
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

-- The advertisements already approved are given the address they lead to today.
update public.ads a
  set link_url = b.website
  from public.businesses b
  where b.id = a.business_id and a.status = 'approved' and a.link_to = 'website' and b.website <> '';

-- The pocket guide's sponsors read the same copy. `website` is now the address the advertisement
-- was approved with, and empty for one that leads to the business's page on the site.
create or replace view public.guide_sponsors with (security_invoker = true) as
  select
    m.month,
    substr(a.place, 7) as option,
    b.name,
    case when a.line <> '' then a.line else a.headline end as line,
    b.town,
    b.phone,
    a.link_url as website,
    a.artwork
  from public.ads a
  join public.businesses b on b.id = a.business_id
  cross join lateral unnest(a.months) as m (month)
  where a.place like 'guide-%' and a.status = 'approved' and a.paid and b.status = 'live';
revoke all on table public.guide_sponsors from anon, authenticated;
grant select on table public.guide_sponsors to anon, authenticated;

------------------------------------------------------------------------------------------------
-- 1. An admin approves what they saw.
--
-- An owner could take an advertisement back, change it and send it in again while an admin's page
-- still showed the first one; the approval then landed on words and a picture nobody had checked.
-- Approval now carries the stamp of the row the admin was shown (`seen`, its `updated_at`), and is
-- refused if the row has been written since. Declining needs no stamp.
drop function public.admin_review_ad(uuid, boolean, text);

create function public.admin_review_ad(ad uuid, approve boolean, why text default '', seen timestamptz default null) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  was text;
  stamp timestamptz;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  select status, updated_at into was, stamp from public.ads where id = ad for update;
  if not found then
    raise exception 'That advertisement is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
  if approve then
    if was <> 'submitted' then
      raise exception 'Only an advertisement that has been sent in can be approved.' using errcode = 'P0001', hint = 'ad_step';
    end if;
    if seen is null or seen <> stamp then
      raise exception 'This advertisement has changed since the page was opened. Look at it again, then approve it.' using errcode = 'P0001', hint = 'ad_step';
    end if;
    update public.ads set status = 'approved', reason = '', reviewed_by = (select auth.uid()), reviewed_at = now() where id = ad;
  else
    if was not in ('submitted', 'approved') then
      raise exception 'Only an advertisement that has been sent in can be declined.' using errcode = 'P0001', hint = 'ad_step';
    end if;
    if btrim(coalesce(why, '')) = '' then
      raise exception 'Say why, in a line: the owner is shown it.' using errcode = '22023', hint = 'invalid';
    end if;
    update public.ads set status = 'declined', reason = left(btrim(why), 300), reviewed_by = (select auth.uid()), reviewed_at = now() where id = ad;
  end if;
end;
$$;
revoke all on function public.admin_review_ad(uuid, boolean, text, timestamptz) from public, anon;
grant execute on function public.admin_review_ad(uuid, boolean, text, timestamptz) to authenticated;

-- What the admin was shown beside the advertisement is the business's name and, where it leads
-- there, its website. A change to either while the advertisement waits gives it a new stamp too,
-- so the admin is asked to look again.
create function private.businesses_touch_ads() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.website is distinct from old.website or new.name is distinct from old.name then
    update public.ads set updated_at = now() where business_id = new.id and status = 'submitted';
  end if;
  return null;
end;
$$;
revoke all on function private.businesses_touch_ads() from public;

create trigger businesses_95_touch_ads
  after update on public.businesses
  for each row execute function private.businesses_touch_ads();

------------------------------------------------------------------------------------------------
-- 7. The record holds what admins did with an advertisement, not each time its owner sent it in
-- or took it back: approved, declined, marked paid or not, and anything that takes an approved
-- one down. An owner can do none of those.
create or replace function private.ads_audit() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  of_business text;
begin
  select name into of_business from public.businesses where id = new.business_id;
  if new.status <> old.status and (new.status in ('approved', 'declined') or old.status = 'approved') then
    perform private.record('ad.' || new.status, 'ad:' || new.id, jsonb_build_object('name', of_business, 'headline', new.headline, 'place', new.place, 'months', new.months, 'reason', new.reason));
  end if;
  if new.paid <> old.paid then
    perform private.record(case when new.paid then 'ad.paid' else 'ad.unpaid' end, 'ad:' || new.id, jsonb_build_object('name', of_business, 'headline', new.headline, 'place', new.place));
  end if;
  return null;
end;
$$;

------------------------------------------------------------------------------------------------
-- 6. Pictures: who may remove them, and how many one person may keep.
--
-- A picture could be removed only while the advertisement or business it belonged to was still
-- there, and only by its owner. So the picture of an advertisement that had been taken out stayed
-- for good, an admin could remove nothing, and nothing bounded what one person could leave behind.
--
-- Now: an admin may remove any picture in the bucket; a person may remove a picture they uploaded
-- once the thing it belonged to is gone; and one person keeps 150 pictures at most, counting the
-- ones left behind.

-- True for a picture whose advertisement or business is no longer there.
create function private.media_is_orphan(path text) returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  parts text[] := string_to_array(coalesce(path, ''), '/');
begin
  if cardinality(parts) <> 3 or parts[2] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  if parts[1] = 'business' then
    return not exists (select 1 from public.businesses b where b.id = parts[2]::uuid);
  elsif parts[1] = 'ads' then
    return not exists (select 1 from public.ads a where a.id = parts[2]::uuid);
  end if;
  return false;
end;
$$;
revoke all on function private.media_is_orphan(text) from public;
grant execute on function private.media_is_orphan(text) to authenticated;

-- The rule for a path, as in part 9, with a ceiling for each person when adding. The counts are
-- made by this function's owner, past row level security: see the policy at the end of this part.
--
-- The bucket takes JPEG, PNG and WebP and nothing else. SVG must never be added to that list: an
-- SVG is a document that can carry script, and these are served from the project's own address.
create or replace function private.may_keep_media(path text, adding boolean) returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  parts text[] := string_to_array(coalesce(path, ''), '/');
  file text := parts[cardinality(parts)];
  folder text;
  most integer;
  allowed boolean := false;
begin
  if file is null or file !~ '^[a-z0-9-]{1,64}\.(jpg|png|webp)$' then
    return false;
  end if;
  if cardinality(parts) = 2 and parts[1] = 'site' then
    allowed := private.is_superadmin();
    folder := 'site/';
    most := 60;
  elsif cardinality(parts) = 3 and parts[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    folder := parts[1] || '/' || parts[2] || '/';
    if parts[1] = 'business' then
      -- Removing is the owner's whatever the plan; adding needs a paid plan today.
      allowed := exists (
        select 1 from public.businesses b
        where b.id = parts[2]::uuid and b.owner_id = (select auth.uid())
          and (not adding or (b.status in ('live', 'pending') and public.plan_now(b.plan, b.plan_until) in ('go', 'grow'))));
      most := 12;
    elsif parts[1] = 'ads' then
      allowed := exists (
        select 1 from public.ads a join public.businesses b on b.id = a.business_id
        where a.id = parts[2]::uuid and b.owner_id = (select auth.uid()) and a.status in ('draft', 'declined')
          and (not adding or b.status = 'live'));
      most := 3;
    end if;
  end if;
  if not allowed then
    return false;
  end if;
  if adding then
    if (select count(*) from storage.objects o where o.bucket_id = 'media' and left(o.name, char_length(folder)) = folder) >= most then
      return false;
    end if;
    -- Everything this person has put in the bucket, wherever it is and whatever became of the
    -- thing it belonged to. Storage writes who uploaded a picture in `owner_id`.
    if (select count(*) from storage.objects o where o.bucket_id = 'media' and o.owner_id = (select auth.uid())::text) >= 150 then
      return false;
    end if;
  end if;
  return true;
end;
$$;

drop policy "biznes media: see your own pictures" on storage.objects;
drop policy "biznes media: remove your own pictures" on storage.objects;

-- Removing a picture reads it first, so whoever may remove one may see it.
create policy "biznes media: see your own pictures" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (
    private.may_keep_media(name, false)
    or (select private.is_admin())
    or (owner_id = (select auth.uid())::text and private.media_is_orphan(name))));

create policy "biznes media: remove your own pictures" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (
    private.may_keep_media(name, false)
    or (select private.is_admin())
    or (owner_id = (select auth.uid())::text and private.media_is_orphan(name))));

-- The counts in may_keep_media are made as the role that owns it. On a Supabase project that is
-- `postgres`, which is not a superuser there and does not own storage.objects, but passes row
-- level security by its own attribute (BYPASSRLS), so it counts every row. This says the same
-- thing in a policy, for that role by name, so the counts hold wherever the attribute is not so:
-- without either the function would count nothing and the limits would limit nothing.
--
-- The role is read from the function, not taken as whoever runs this statement: on a Supabase
-- project a policy on storage.objects is made on the applying role's behalf by another role.
do $$
declare
  runs_as regrole := (select proowner::regrole from pg_proc where oid = 'private.may_keep_media(text, boolean)'::regprocedure);
begin
  execute format('create policy "biznes media: counted by the database" on storage.objects for select to %s using (bucket_id = ''media'')', runs_as);
end;
$$;

-- An admin takes a picture off an advertisement. One that was waiting or approved is declined with
-- the reason given, so it comes down and its owner is told why. The website then removes the file.
create function public.admin_remove_ad_picture(ad uuid, why text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  was public.ads;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  select * into was from public.ads where id = ad for update;
  if not found then
    raise exception 'That advertisement is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
  if btrim(coalesce(why, '')) = '' then
    raise exception 'Say why, in a line: the owner is shown it.' using errcode = '22023', hint = 'invalid';
  end if;
  update public.ads
    set artwork = '',
        status = case when was.status in ('submitted', 'approved') then 'declined' else was.status end,
        reason = case when was.status in ('submitted', 'approved', 'declined') then left(btrim(why), 300) else was.reason end,
        reviewed_by = (select auth.uid()),
        reviewed_at = now()
    where id = ad;
  perform private.record('ad.picture_removed', 'ad:' || ad, jsonb_build_object('name', (select b.name from public.businesses b where b.id = was.business_id), 'headline', was.headline, 'reason', left(btrim(why), 300)));
end;
$$;
revoke all on function public.admin_remove_ad_picture(uuid, text) from public, anon;
grant execute on function public.admin_remove_ad_picture(uuid, text) to authenticated;

-- An admin takes a picture off a business's page: its cover, or one of its photographs.
create function public.admin_remove_business_picture(business uuid, path text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  update public.showcases s
    set cover = case when s.cover = path then '' else s.cover end, photos = array_remove(s.photos, path)
    where s.business_id = business and (s.cover = path or path = any (s.photos));
  if not found then
    raise exception 'That picture is not on the page.' using errcode = 'P0002', hint = 'missing';
  end if;
  perform private.record('business.picture_removed', 'business:' || business, jsonb_build_object('name', (select b.name from public.businesses b where b.id = business), 'path', path));
end;
$$;
revoke all on function public.admin_remove_business_picture(uuid, text) from public, anon;
grant execute on function public.admin_remove_business_picture(uuid, text) to authenticated;
