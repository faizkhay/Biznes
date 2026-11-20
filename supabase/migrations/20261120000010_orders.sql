-- biznes.mu accounts, part 10: orders.
--
-- A visitor fills a cart on the site and places an order: for a pocket guide, a place on its
-- sponsors' pages, a plan, or an advertisement. Nothing is paid here. Payment is not connected:
-- the order is a request, a person answers it with how to pay, and an admin moves it on by hand.
--
-- An order names what it wants and how many. It never names a price. The prices are in the
-- `catalogue` below, which holds what the site sells and is the only thing an order is priced
-- from, so nobody can order at a price of their own. The catalogue is a copy of the site's own
-- data (content/pdf/product.json, content/pdf/sponsorship.json and PLANS in src/data/site.ts): the
-- website refuses to take an order while the two disagree, and the superadmin brings the
-- catalogue level with one press (set_catalogue).

create table public.catalogue (
  -- The kind and the thing: "guide:mauritius-places-to-see", "sponsor:panel", "plan:go", "ad:home".
  id text primary key check (id ~ '^(guide|sponsor|plan|ad):[a-z0-9-]{1,80}$'),
  kind text generated always as (split_part(id, ':', 1)) stored,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  -- In whole rupees. Null where the price is given on request.
  price_mur integer check (price_mur is null or price_mur between 0 and 10000000),
  -- Whether the price is for one, or for a month.
  per text not null default 'each' check (per in ('each', 'month')),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
comment on table public.catalogue is 'What the site sells and at what price: the only thing an order is priced from. A copy of the site''s own data, kept level by the superadmin.';

-- As the site's data stood on 20 November 2026.
insert into public.catalogue (id, name, price_mur, per) values
  ('guide:mauritius-places-to-see', 'Mauritius, place by place', 150, 'each'),
  ('sponsor:listing', 'Sponsored listing', 500, 'month'),
  ('sponsor:panel', 'Sponsored panel', 1500, 'month'),
  ('sponsor:page', 'Sponsored page', 4000, 'month'),
  ('plan:go', 'Biznes Go', 550, 'month'),
  ('plan:grow', 'Biznes Grow', 1250, 'month'),
  ('ad:home', 'Advertisement: the first screen', null, 'month'),
  ('ad:results', 'Advertisement: search results', null, 'month'),
  ('ad:listing', 'Advertisement: a listing''s page', null, 'month'),
  ('ad:food', 'Advertisement: food and drink', null, 'month'),
  ('ad:article', 'Advertisement: the guides', null, 'month'),
  ('ad:directory', 'Advertisement: the directory', null, 'month'),
  ('ad:magazine', 'Advertisement: the magazine', null, 'month');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- The number a person is given, and quotes when they write to us.
  number bigint generated always as identity (start with 1001),
  -- Whose it is, when they were signed in. A guest's order has nobody here, and only admins read it.
  customer_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  phone text not null default '' check (phone = '' or phone ~ '^\+?[0-9 ().-]{7,20}$'),
  phone_key text generated always as (regexp_replace(phone, '[^0-9]', '', 'g')) stored,
  email text not null default '' check (email = '' or (char_length(email) <= 160 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$')),
  note text not null default '' check (char_length(note) <= 500),
  -- The sum of the lines that have a price, in whole rupees, at the prices of the day.
  total_mur integer not null default 0 check (total_mur >= 0),
  status text not null default 'placed' check (status in ('placed', 'awaiting_payment', 'paid', 'fulfilled', 'cancelled')),
  -- A word from the admin, for the admins.
  admin_note text not null default '' check (char_length(admin_note) <= 500),
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_reachable check (phone <> '' or email <> '')
);
comment on table public.orders is 'An order placed on the site. A request, not a payment: an admin moves it on by hand once payment is arranged.';
create index orders_customer on public.orders (customer_id, created_at desc) where customer_id is not null;
create index orders_status on public.orders (status, created_at desc);
create index orders_created on public.orders (created_at desc);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  -- What was ordered, as the catalogue named and priced it on the day.
  item text not null,
  kind text not null,
  name text not null,
  -- The buyer's own word on the line: which months, which business.
  detail text not null default '' check (char_length(detail) <= 200),
  unit_mur integer,
  per text not null default 'each',
  qty integer not null check (qty between 1 and 24)
);
create index order_items_order on public.order_items (order_id);

-- Place an order. `lines` is a list of {"id": "plan:go", "qty": 1, "detail": "..."}. Signed in,
-- the order is that person's and their profile fills what they leave out; a guest gives a name and
-- a telephone number or an email address. It answers with the order's number and its total.
create function public.place_order(lines jsonb, buyer_name text default '', buyer_phone text default '', buyer_email text default '', buyer_note text default '') returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  who uuid := (select auth.uid());
  mine public.profiles;
  line jsonb;
  sold public.catalogue;
  made public.orders;
  wanted integer;
  clean_name text := btrim(coalesce(buyer_name, ''));
  clean_phone text := btrim(coalesce(buyer_phone, ''));
  clean_email text := lower(btrim(coalesce(buyer_email, '')));
  sum_mur bigint := 0;
  on_request boolean := false;
begin
  if lines is null or jsonb_typeof(lines) <> 'array' or jsonb_array_length(lines) = 0 then
    raise exception 'There is nothing in the order.' using errcode = '22023', hint = 'order_empty';
  end if;
  if jsonb_array_length(lines) > 20 then
    raise exception 'An order holds twenty lines at most.' using errcode = '22023', hint = 'order_long';
  end if;
  if who is not null then
    select * into mine from public.profiles where id = who;
    clean_name := coalesce(nullif(clean_name, ''), mine.name, '');
    clean_phone := coalesce(nullif(clean_phone, ''), mine.phone, '');
    clean_email := coalesce(nullif(clean_email, ''), lower(mine.email), '');
  end if;
  if char_length(clean_name) < 2 or char_length(clean_name) > 120 then
    raise exception 'Give your name.' using errcode = '22023', hint = 'order_name';
  end if;
  if clean_phone <> '' and clean_phone !~ '^\+?[0-9 ().-]{7,20}$' then
    raise exception 'That phone number does not look right.' using errcode = '22023', hint = 'order_phone';
  end if;
  if clean_email <> '' and (char_length(clean_email) > 160 or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$') then
    raise exception 'That email address does not look right.' using errcode = '22023', hint = 'order_email';
  end if;
  if clean_phone = '' and clean_email = '' then
    raise exception 'Give a telephone number or an email address, so we can reach you.' using errcode = '22023', hint = 'order_reach';
  end if;

  -- One at a time, so the counts below cannot be raced past.
  perform pg_advisory_xact_lock(hashtext('biznes.orders'));
  if (select count(*) from public.orders o where o.created_at > now() - interval '1 hour'
        and ((who is not null and o.customer_id = who)
          or (clean_phone <> '' and o.phone_key = regexp_replace(clean_phone, '[^0-9]', '', 'g'))
          or (clean_email <> '' and o.email = clean_email))) >= 5 then
    raise exception 'Five orders have come from you in the last hour. We have them: a person will be in touch.' using errcode = 'P0001', hint = 'order_rate';
  end if;
  if (select count(*) from public.orders o where o.created_at > now() - interval '1 hour') >= 200 then
    raise exception 'Many orders have come in the last hour. Try again later.' using errcode = 'P0001', hint = 'order_busy';
  end if;

  insert into public.orders (customer_id, name, phone, email, note)
  values (who, clean_name, clean_phone, clean_email, left(btrim(coalesce(buyer_note, '')), 500))
  returning * into made;

  for line in select * from jsonb_array_elements(lines) loop
    select * into sold from public.catalogue c where c.id = line ->> 'id' and c.active;
    if not found then
      raise exception 'The site does not sell that.' using errcode = '22023', hint = 'order_item';
    end if;
    wanted := case when (line ->> 'qty') ~ '^[0-9]{1,3}$' then (line ->> 'qty')::integer else 0 end;
    if wanted < 1 or wanted > 24 then
      raise exception 'Order from one to twenty-four of a thing.' using errcode = '22023', hint = 'order_qty';
    end if;
    insert into public.order_items (order_id, item, kind, name, detail, unit_mur, per, qty)
    values (made.id, sold.id, sold.kind, sold.name, left(btrim(coalesce(line ->> 'detail', '')), 200), sold.price_mur, sold.per, wanted);
    if sold.price_mur is null then
      on_request := true;
    else
      sum_mur := sum_mur + sold.price_mur::bigint * wanted;
    end if;
  end loop;

  update public.orders set total_mur = sum_mur where id = made.id;
  return jsonb_build_object('number', made.number, 'total', sum_mur, 'on_request', on_request);
end;
$$;
revoke all on function public.place_order(jsonb, text, text, text, text) from public;
grant execute on function public.place_order(jsonb, text, text, text, text) to anon, authenticated;

-- An admin moves an order on: awaiting payment, paid, fulfilled, cancelled, or back to placed.
create function public.admin_set_order(target uuid, new_status text, word text default null) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  if new_status is null or new_status not in ('placed', 'awaiting_payment', 'paid', 'fulfilled', 'cancelled') then
    raise exception 'That is not a status.' using errcode = '22023', hint = 'invalid';
  end if;
  update public.orders
    set status = new_status, admin_note = coalesce(left(btrim(word), 500), admin_note), handled_by = (select auth.uid()), handled_at = now(), updated_at = now()
    where id = target;
  if not found then
    raise exception 'That order is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
end;
$$;
revoke all on function public.admin_set_order(uuid, text, text) from public, anon;
grant execute on function public.admin_set_order(uuid, text, text) to authenticated;

-- Bring the catalogue level with the site's own data. `items` is the whole of what the site
-- sells: [{"id": "plan:go", "name": "Biznes Go", "price": 550, "per": "month"}]. What is not in it
-- is switched off, never deleted, so old orders keep their meaning. The superadmin's alone.
create function public.set_catalogue(items jsonb) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  changed integer;
begin
  if not private.is_superadmin() then
    raise exception 'Only the superadmin can change what the site sells.' using errcode = '42501', hint = 'forbidden';
  end if;
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 or jsonb_array_length(items) > 200 then
    raise exception 'That is not a list of what the site sells.' using errcode = '22023', hint = 'invalid';
  end if;
  insert into public.catalogue (id, name, price_mur, per, active, updated_at)
    select i ->> 'id', i ->> 'name', nullif(i ->> 'price', '')::integer, coalesce(i ->> 'per', 'each'), true, now()
    from jsonb_array_elements(items) i
  on conflict (id) do update set name = excluded.name, price_mur = excluded.price_mur, per = excluded.per, active = true, updated_at = now();
  get diagnostics changed = row_count;
  update public.catalogue set active = false, updated_at = now()
    where active and id not in (select i ->> 'id' from jsonb_array_elements(items) i);
  perform private.record('catalogue.set', 'catalogue', jsonb_build_object('items', changed));
  return changed;
end;
$$;
revoke all on function public.set_catalogue(jsonb) from public, anon;
grant execute on function public.set_catalogue(jsonb) to authenticated;

create function private.orders_audit() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status <> old.status then
    perform private.record('order.' || new.status, 'order:' || new.id, jsonb_build_object('number', new.number, 'from', old.status, 'total', new.total_mur));
  end if;
  return null;
end;
$$;
revoke all on function private.orders_audit() from public;

create trigger orders_90_audit
  after update on public.orders
  for each row execute function private.orders_audit();

-- True for an order the person asking may read: their own, or any for an admin.
create function private.sees_order(target uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.orders o where o.id = target and (o.customer_id = (select auth.uid()) or private.is_admin()));
$$;
revoke all on function private.sees_order(uuid) from public;
grant execute on function private.sees_order(uuid) to authenticated;

alter table public.catalogue enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on table public.catalogue from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;

-- Reading is all the API may do with any of the three. Orders are written by place_order and
-- moved on by admin_set_order; the catalogue by set_catalogue.
grant select on table public.catalogue to anon, authenticated;
grant select on table public.orders to authenticated;
grant select on table public.order_items to authenticated;

create policy catalogue_read on public.catalogue
  for select to anon, authenticated
  using (true);

-- A person reads their own orders. A guest's order belongs to nobody, so only admins read it.
create policy orders_read on public.orders
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()));

create policy order_items_read on public.order_items
  for select to authenticated
  using (private.sees_order(order_id));
