-- biznes.mu accounts, part 8: advertisements, and changes of plan.
--
-- An owner of a live business makes an advertisement: a headline, a line, a link (their page here
-- or their own website), one picture, the place it should run and the months it should run in.
-- The months are always months to come, never the one that has begun. An admin approves it or
-- declines it with a reason, and marks it paid once payment is arranged by hand. An advertisement
-- that is approved and paid runs in its place for its months, and is always marked as paid for.
--
-- The places: six on the site ("home", "results", "listing", "food", "article", "directory"),
-- three in the pocket guide (a listing, a panel or a page on the sponsors' pages) and the
-- magazine. An edition of the pocket guide carries four sponsored pages at most.

-- The month it is now in Mauritius, as YYYY-MM.
create function private.this_month() returns text
language sql stable set search_path = ''
as $$
  select to_char(now() at time zone 'Indian/Mauritius', 'YYYY-MM');
$$;

create function private.is_live(business uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.businesses b where b.id = business and b.status = 'live');
$$;

-- True when every entry is a month, written YYYY-MM.
create function private.are_months(months text[]) returns boolean
language sql immutable set search_path = ''
as $$
  select coalesce(bool_and(m ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'), false) from unnest(months) m;
$$;

revoke all on function private.this_month() from public;
revoke all on function private.is_live(uuid) from public;
revoke all on function private.are_months(text[]) from public;
grant execute on function private.this_month() to anon, authenticated;
grant execute on function private.is_live(uuid) to anon, authenticated;
grant execute on function private.are_months(text[]) to anon, authenticated;

create table public.ads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  headline text not null check (char_length(btrim(headline)) between 2 and 60),
  line text not null default '' check (char_length(line) <= 120),
  -- Where the advertisement leads: the business's page on this site, or its own website. Never anywhere else.
  link_to text not null default 'page' check (link_to in ('page', 'website')),
  -- One picture, as a path in the `media` bucket under ads/<id>/.
  artwork text not null default '',
  place text not null check (place in ('home', 'results', 'listing', 'food', 'article', 'directory', 'guide-listing', 'guide-panel', 'guide-page', 'magazine')),
  -- The months it should run in, each YYYY-MM.
  months text[] not null check (cardinality(months) between 1 and 12 and private.are_months(months)),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'declined')),
  -- Set by an admin once payment has been arranged. Nothing is paid on the site.
  paid boolean not null default false,
  -- Why it was declined, for the owner.
  reason text not null default '' check (char_length(reason) <= 300),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.ads is 'An owner''s advertisement. It runs where and when it says only once an admin has approved it and marked it paid.';
create index ads_business on public.ads (business_id, created_at desc);
create index ads_status on public.ads (status, place);

-- What an advertisement is doing today. "running" and "ended" are read off the calendar, so
-- nothing has to turn them over at midnight.
create function public.ad_state(status text, paid boolean, months text[]) returns text
language sql stable set search_path = ''
as $$
  select case
    when status <> 'approved' then status
    when (select max(m) from unnest(months) m) < private.this_month() then 'ended'
    when paid and private.this_month() = any (months) then 'running'
    else 'approved'
  end;
$$;
revoke all on function public.ad_state(text, boolean, text[]) from public;
grant execute on function public.ad_state(text, boolean, text[]) to anon, authenticated;

-- The guard on an advertisement. Through the API an owner writes a draft, sends it in, takes it
-- back, and mends one that was declined. Approval, the reason and the paid mark are an admin's.
create function private.ads_guard() returns trigger
language plpgsql set search_path = ''
as $$
declare
  changed boolean;
begin
  new.headline := btrim(new.headline);
  new.line := btrim(new.line);
  new.months := array(select distinct m from unnest(new.months) m order by m);
  if new.artwork <> '' and new.artwork !~ ('^ads/' || new.id || '/[a-z0-9-]{1,64}\.(jpg|png|webp)$') then
    raise exception 'An advertisement shows only its own picture.' using errcode = '23514', hint = 'picture_path';
  end if;

  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
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
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.ads_guard() from public;

create trigger ads_10_guard
  before insert or update on public.ads
  for each row execute function private.ads_guard();

-- An edition of the pocket guide carries four sponsored pages at most. It holds whoever approves,
-- and by whatever route.
create function private.ads_guide_cap() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  month text;
begin
  if new.status = 'approved' and new.place = 'guide-page' then
    perform pg_advisory_xact_lock(hashtext('biznes.ads.guide'));
    foreach month in array new.months loop
      if (select count(*) from public.ads a where a.id <> new.id and a.status = 'approved' and a.place = 'guide-page' and month = any (a.months)) >= 4 then
        raise exception 'The pocket guide for % already has its four sponsored pages.', month using errcode = 'P0001', hint = 'guide_full';
      end if;
    end loop;
  end if;
  return new;
end;
$$;
revoke all on function private.ads_guide_cap() from public;

create trigger ads_20_guide_cap
  before insert or update on public.ads
  for each row execute function private.ads_guide_cap();

create function private.ads_audit() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  of_business text;
begin
  select name into of_business from public.businesses where id = new.business_id;
  if new.status <> old.status then
    perform private.record('ad.' || new.status, 'ad:' || new.id, jsonb_build_object('name', of_business, 'headline', new.headline, 'place', new.place, 'months', new.months, 'reason', new.reason));
  end if;
  if new.paid <> old.paid then
    perform private.record(case when new.paid then 'ad.paid' else 'ad.unpaid' end, 'ad:' || new.id, jsonb_build_object('name', of_business, 'headline', new.headline, 'place', new.place));
  end if;
  return null;
end;
$$;
revoke all on function private.ads_audit() from public;

create trigger ads_90_audit
  after update on public.ads
  for each row execute function private.ads_audit();

-- What an admin does with an advertisement.

-- Approve one that has been sent in, or decline it with a reason. An approved one can be declined later.
create function public.admin_review_ad(ad uuid, approve boolean, why text default '') returns void
language plpgsql security definer set search_path = ''
as $$
declare
  was text;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  select status into was from public.ads where id = ad for update;
  if not found then
    raise exception 'That advertisement is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
  if approve then
    if was <> 'submitted' then
      raise exception 'Only an advertisement that has been sent in can be approved.' using errcode = 'P0001', hint = 'ad_step';
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

-- Mark an approved advertisement paid, or not paid. Only a paid one runs.
create function public.admin_set_ad_paid(ad uuid, is_paid boolean) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  update public.ads set paid = coalesce(is_paid, false) where id = ad and status = 'approved';
  if not found then
    raise exception 'Only an approved advertisement can be marked paid.' using errcode = 'P0001', hint = 'ad_step';
  end if;
end;
$$;

revoke all on function public.admin_review_ad(uuid, boolean, text) from public, anon;
revoke all on function public.admin_set_ad_paid(uuid, boolean) from public, anon;
grant execute on function public.admin_review_ad(uuid, boolean, text) to authenticated;
grant execute on function public.admin_set_ad_paid(uuid, boolean) to authenticated;

alter table public.ads enable row level security;
revoke all on table public.ads from anon, authenticated;

grant select (id, business_id, headline, line, link_to, artwork, place, months, status, paid) on table public.ads to anon;
grant select on table public.ads to authenticated;
grant insert (business_id, headline, line, link_to, place, months) on table public.ads to authenticated;
grant update (headline, line, link_to, artwork, place, months, status) on table public.ads to authenticated;
grant delete on table public.ads to authenticated;

-- The public is shown an advertisement only when it is approved, paid, and of a live business:
-- on the site in the months it runs, and in the pocket guide's list of sponsors for its editions.
create policy ads_public_read on public.ads
  for select to anon
  using (status = 'approved' and paid and private.is_live(business_id) and (place like 'guide-%' or private.this_month() = any (months)));

create policy ads_read on public.ads
  for select to authenticated
  using (private.owns_business(business_id) or (select private.is_admin()));

create policy ads_insert on public.ads
  for insert to authenticated
  with check (private.owns_business(business_id) and private.is_live(business_id));

create policy ads_update on public.ads
  for update to authenticated
  using (private.owns_business(business_id))
  with check (private.owns_business(business_id));

-- An owner may take out an advertisement that has not been approved.
create policy ads_delete on public.ads
  for delete to authenticated
  using (private.owns_business(business_id) and status <> 'approved');

-- The sponsors of each edition of the pocket guide, for the shop and for the script that makes the
-- PDF: one row for each month of each approved, paid guide advertisement of a live business. Read
-- it as a visitor (the publishable key and no session). `town` is a place's slug in the open
-- index and `artwork` a path in the `media` bucket.
create view public.guide_sponsors with (security_invoker = true) as
  select
    m.month,
    substr(a.place, 7) as option,
    b.name,
    case when a.line <> '' then a.line else a.headline end as line,
    b.town,
    b.phone,
    b.website,
    a.artwork
  from public.ads a
  join public.businesses b on b.id = a.business_id
  cross join lateral unnest(a.months) as m (month)
  where a.place like 'guide-%' and a.status = 'approved' and a.paid and b.status = 'live';
comment on view public.guide_sponsors is 'Who sponsors each edition of the pocket guide: approved, paid guide advertisements, a row a month.';
revoke all on table public.guide_sponsors from anon, authenticated;
grant select on table public.guide_sponsors to anon, authenticated;

-- A change of plan. An owner may now also ask to step down, or to stop: a request for the free
-- plan means "stop at the end of the period". The plan then runs to its last day and is not renewed.
alter table public.plan_requests drop constraint plan_requests_plan_check;
alter table public.plan_requests add constraint plan_requests_plan_check check (plan in ('free', 'go', 'grow'));

create or replace function public.admin_handle_plan_request(request uuid, accept boolean, until date default null) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  asked public.plan_requests;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  select * into asked from public.plan_requests where id = request for update;
  if not found or asked.status <> 'open' then
    raise exception 'That request has already been answered.' using errcode = 'P0002', hint = 'missing';
  end if;
  if accept and asked.plan = 'free' then
    -- Stop at the end of the period: the plan keeps its last day, or is given one, and lapses by itself.
    update public.businesses
      set plan_until = coalesce(until, plan_until, (now() at time zone 'Indian/Mauritius')::date)
      where id = asked.business_id and plan <> 'free';
  elsif accept then
    perform public.admin_set_plan(asked.business_id, asked.plan, until);
  end if;
  update public.plan_requests
    set status = case when accept then 'done' else 'declined' end, handled_by = (select auth.uid()), handled_at = now()
    where id = request;
  perform private.record(case when accept then 'plan_request.done' else 'plan_request.declined' end, 'business:' || asked.business_id, jsonb_build_object('plan', asked.plan, 'until', until));
end;
$$;
