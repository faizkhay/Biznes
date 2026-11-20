-- biznes.mu accounts, part 2: the businesses people list, and the plans they ask for.
--
-- An owner lists a business, or claims a listing that is already in the open index. It always
-- starts pending, free and unverified, whatever the request says. An admin makes it live, and
-- changes its plan and its verified mark. How a plan is paid for is not decided, so nothing here
-- takes money: an owner asks for a plan, and an admin switches it on once payment is arranged.

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  -- The id of a listing in the open index ("n123", "w123", "r123", "q123") when the owner claims one.
  listing_id text check (listing_id is null or listing_id ~ '^[nwrq][0-9]{1,20}$'),
  slug text not null unique,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  -- A category id from data/index/categories.json and a place slug from data/index/places.json.
  -- The website checks both against the index; the database checks only their shape.
  category text not null check (category ~ '^[a-z0-9-]{1,60}$'),
  town text not null default '' check (town ~ '^[a-z0-9-]{0,80}$'),
  address text not null default '' check (char_length(address) <= 200),
  phone text not null default '' check (phone = '' or phone ~ '^\+?[0-9 ().-]{7,20}$'),
  website text not null default '' check (website = '' or (char_length(website) <= 200 and website ~* '^https?://[^[:space:]]+$')),
  about text not null default '' check (char_length(about) <= 1200),
  plan text not null default 'free' check (plan in ('free', 'go', 'grow')),
  -- The last day the plan is paid for. After it the business is treated as free.
  plan_until date,
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'live', 'rejected', 'suspended')),
  -- A word from the admin to the owner: why it was rejected or suspended.
  status_note text not null default '' check (char_length(status_note) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.businesses is 'A business listed by its owner. Owners write the descriptive fields; admins decide status, plan and the verified mark.';

-- A listing in the open index has one live owner at most. Several people may ask for the same
-- listing; an admin decides whose it is. Nobody can hold a listing just by asking first.
create unique index businesses_one_live_claim on public.businesses (listing_id) where listing_id is not null and status = 'live';
create unique index businesses_one_claim_each on public.businesses (owner_id, listing_id) where listing_id is not null;
create index businesses_owner on public.businesses (owner_id);
create index businesses_status on public.businesses (status, created_at);

create table public.plan_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  requested_by uuid references public.profiles (id) on delete set null,
  plan text not null check (plan in ('go', 'grow')),
  note text not null default '' check (char_length(note) <= 500),
  status text not null default 'open' check (status in ('open', 'done', 'declined')),
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.plan_requests is 'An owner asking for Biznes Go or Biznes Grow. An admin switches the plan on by hand, after payment is arranged.';
create unique index plan_requests_one_open on public.plan_requests (business_id) where status = 'open';
create index plan_requests_status on public.plan_requests (status, created_at);

-- The plan a business is on today: a paid plan whose last day has passed counts as free.
create function public.plan_now(plan text, plan_until date) returns text
language sql stable set search_path = ''
as $$
  select case when plan <> 'free' and plan_until is not null and plan_until < (now() at time zone 'Indian/Mauritius')::date then 'free' else plan end;
$$;
revoke all on function public.plan_now(text, date) from public;
grant execute on function public.plan_now(text, date) to anon, authenticated;

create function private.owns_business(business uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.businesses b where b.id = business and b.owner_id = (select auth.uid()));
$$;
revoke all on function private.owns_business(uuid) from public;
grant execute on function private.owns_business(uuid) to authenticated;

-- "Chez Ravi, Curepipe" as "chez-ravi-curepipe", for the address of a business's own page.
create function private.slugify(words text) returns text
language sql immutable set search_path = ''
as $$
  select coalesce(
    nullif(left(btrim(regexp_replace(lower(translate(words, 'àâäáãåçèéêëìíîïñòóôöõùúûüýÿÀÂÄÁÃÅÇÈÉÊËÌÍÎÏÑÒÓÔÖÕÙÚÛÜÝ', 'aaaaaaceeeeiiiinooooouuuuyyaaaaaaceeeeiiiinooooouuuuy')), '[^a-z0-9]+', '-', 'g'), '-'), 60), ''),
    'business');
$$;
revoke all on function private.slugify(text) from public;
grant execute on function private.slugify(text) to authenticated;

-- A new business. Through the API it belongs to whoever sends it and starts pending, free and
-- unverified, whatever was asked for. Its address is made here, from its name.
create function private.businesses_before_insert() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.owner_id := (select auth.uid());
    new.status := 'pending';
    new.status_note := '';
    new.plan := 'free';
    new.plan_until := null;
    new.verified := false;
    new.created_at := now();
    if new.owner_id is null then
      raise exception 'Sign in to list a business.' using errcode = '42501', hint = 'forbidden';
    end if;
    if (select count(*) from public.businesses b where b.owner_id = new.owner_id) >= 20 then
      raise exception 'One account can list twenty businesses. Ask us if you need more.' using errcode = 'P0001', hint = 'too_many';
    end if;
  end if;
  new.name := btrim(new.name);
  new.address := btrim(new.address);
  new.phone := btrim(new.phone);
  new.website := btrim(new.website);
  new.about := btrim(new.about);
  new.slug := private.slugify(new.name) || '-' || left(replace(new.id::text, '-', ''), 8);
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.businesses_before_insert() from public;

create trigger businesses_10_before_insert
  before insert on public.businesses
  for each row execute function private.businesses_before_insert();

-- A changed business. Through the API an owner changes what describes it and nothing else. Saving
-- a rejected business sends it back to be looked at again. The name of a verified business stays
-- as it was checked.
create function private.businesses_before_update() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if new.id <> old.id or new.owner_id <> old.owner_id or new.slug <> old.slug or new.listing_id is distinct from old.listing_id
      or new.plan <> old.plan or new.plan_until is distinct from old.plan_until or new.verified <> old.verified
      or new.status <> old.status or new.status_note <> old.status_note or new.created_at <> old.created_at then
      raise exception 'Only an admin can change that.' using errcode = '42501', hint = 'forbidden';
    end if;
    if old.verified and btrim(new.name) <> old.name then
      raise exception 'The name of a verified business is changed by us. Ask and we will.' using errcode = 'P0001', hint = 'verified_name';
    end if;
    if old.status = 'rejected' then
      new.status := 'pending';
      new.status_note := '';
    end if;
  end if;
  new.name := btrim(new.name);
  new.address := btrim(new.address);
  new.phone := btrim(new.phone);
  new.website := btrim(new.website);
  new.about := btrim(new.about);
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.businesses_before_update() from public;

create trigger businesses_10_before_update
  before update on public.businesses
  for each row execute function private.businesses_before_update();

-- The record of what happened to a business: listed, made live, rejected, suspended, moved to a
-- plan, verified, removed.
create function private.businesses_audit() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.record('business.listed', 'business:' || new.id, jsonb_build_object('name', new.name, 'listing', new.listing_id));
  elsif tg_op = 'DELETE' then
    perform private.record('business.removed', 'business:' || old.id, jsonb_build_object('name', old.name, 'status', old.status, 'plan', old.plan));
  else
    if new.status <> old.status then
      perform private.record('business.status', 'business:' || new.id, jsonb_build_object('name', new.name, 'from', old.status, 'to', new.status, 'note', new.status_note));
    end if;
    if new.plan <> old.plan or new.plan_until is distinct from old.plan_until then
      perform private.record('business.plan', 'business:' || new.id, jsonb_build_object('name', new.name, 'from', old.plan, 'to', new.plan, 'until', new.plan_until));
    end if;
    if new.verified <> old.verified then
      perform private.record('business.verified', 'business:' || new.id, jsonb_build_object('name', new.name, 'to', new.verified));
    end if;
  end if;
  return null;
end;
$$;
revoke all on function private.businesses_audit() from public;

create trigger businesses_90_audit
  after insert or update or delete on public.businesses
  for each row execute function private.businesses_audit();

-- A request for a plan. Through the API it is open, and from whoever sends it.
create function private.plan_requests_before_insert() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.requested_by := (select auth.uid());
    new.status := 'open';
    new.handled_by := null;
    new.handled_at := null;
    new.created_at := now();
  end if;
  new.note := btrim(new.note);
  return new;
end;
$$;
revoke all on function private.plan_requests_before_insert() from public;

create trigger plan_requests_10_before_insert
  before insert on public.plan_requests
  for each row execute function private.plan_requests_before_insert();

-- What an admin does. Each checks who is asking, then changes the business as the owner of the
-- tables, so no API role ever holds the right to change these columns.

-- Make a business live, reject it, suspend it, or put it back in the queue.
create function public.admin_set_status(business uuid, new_status text, note text default '') returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  if new_status is null or new_status not in ('pending', 'live', 'rejected', 'suspended') then
    raise exception 'That is not a status.' using errcode = '22023', hint = 'invalid';
  end if;
  update public.businesses
    set status = new_status, status_note = case when new_status in ('rejected', 'suspended') then left(btrim(coalesce(note, '')), 300) else '' end
    where id = business;
  if not found then
    raise exception 'That business is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
exception
  when unique_violation then
    raise exception 'Another live business has already claimed that listing. Reject or suspend it first.' using errcode = 'P0001', hint = 'claimed';
end;
$$;

-- Put a business on a plan, with the last day it is paid for. A paid plan marks the business
-- verified: switch one on only once the business has been checked and payment arranged.
create function public.admin_set_plan(business uuid, new_plan text, until date default null) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  if new_plan is null or new_plan not in ('free', 'go', 'grow') then
    raise exception 'That is not a plan.' using errcode = '22023', hint = 'invalid';
  end if;
  update public.businesses
    set plan = new_plan,
        plan_until = case when new_plan = 'free' then null else until end,
        verified = verified or new_plan <> 'free'
    where id = business;
  if not found then
    raise exception 'That business is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
end;
$$;

-- Give or take away the verified mark.
create function public.admin_set_verified(business uuid, is_verified boolean) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  update public.businesses set verified = coalesce(is_verified, false) where id = business;
  if not found then
    raise exception 'That business is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
end;
$$;

-- Answer a request for a plan: switch the plan on until a day, or decline.
create function public.admin_handle_plan_request(request uuid, accept boolean, until date default null) returns void
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
  if accept then
    perform public.admin_set_plan(asked.business_id, asked.plan, until);
  end if;
  update public.plan_requests
    set status = case when accept then 'done' else 'declined' end, handled_by = (select auth.uid()), handled_at = now()
    where id = request;
  perform private.record(case when accept then 'plan_request.done' else 'plan_request.declined' end, 'business:' || asked.business_id, jsonb_build_object('plan', asked.plan, 'until', until));
end;
$$;

revoke all on function public.admin_set_status(uuid, text, text) from public, anon;
revoke all on function public.admin_set_plan(uuid, text, date) from public, anon;
revoke all on function public.admin_set_verified(uuid, boolean) from public, anon;
revoke all on function public.admin_handle_plan_request(uuid, boolean, date) from public, anon;
grant execute on function public.admin_set_status(uuid, text, text) to authenticated;
grant execute on function public.admin_set_plan(uuid, text, date) to authenticated;
grant execute on function public.admin_set_verified(uuid, boolean) to authenticated;
grant execute on function public.admin_handle_plan_request(uuid, boolean, date) to authenticated;

-- Who may read and change what.
alter table public.businesses enable row level security;
alter table public.plan_requests enable row level security;

revoke all on table public.businesses from anon, authenticated;
revoke all on table public.plan_requests from anon, authenticated;

-- A visitor reads what a live business shows the public, and not who owns it.
grant select (id, slug, listing_id, name, category, town, address, phone, website, about, plan, plan_until, verified, status) on table public.businesses to anon;
grant select on table public.businesses to authenticated;
grant insert (listing_id, name, category, town, address, phone, website, about) on table public.businesses to authenticated;
grant update (name, category, town, address, phone, website, about) on table public.businesses to authenticated;
grant delete on table public.businesses to authenticated;

grant select on table public.plan_requests to authenticated;
grant insert (business_id, plan, note) on table public.plan_requests to authenticated;
grant delete on table public.plan_requests to authenticated;

create policy businesses_public_read on public.businesses
  for select to anon
  using (status = 'live');

-- Signed in, a person reads their own businesses, and an admin reads them all. The public pages
-- read as `anon` whoever is looking, so nobody needs more than this.
create policy businesses_read on public.businesses
  for select to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()));

create policy businesses_insert on public.businesses
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy businesses_update on public.businesses
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy businesses_delete on public.businesses
  for delete to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()));

create policy plan_requests_read on public.plan_requests
  for select to authenticated
  using (private.owns_business(business_id) or (select private.is_admin()));

create policy plan_requests_insert on public.plan_requests
  for insert to authenticated
  with check (private.owns_business(business_id));

-- An owner may take back a request nobody has answered yet.
create policy plan_requests_delete on public.plan_requests
  for delete to authenticated
  using (status = 'open' and private.owns_business(business_id));
