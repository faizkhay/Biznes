-- biznes.mu accounts, part 3: Biznes Grow. The services a business sells and the bookings it takes.
--
-- Anyone may ask a live business on Biznes Grow for a booking, signed in or not, with a name and a
-- telephone number. The business confirms, declines, or marks it done. Payment is between the
-- customer and the business: nothing here takes money. A business may say how it is paid by MCB
-- Juice, as details only: a mobile number and a name, shown to customers while it is on Grow.

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  description text not null default '' check (char_length(description) <= 400),
  -- In whole rupees. Null where the business gives no price.
  price_mur integer check (price_mur is null or price_mur between 0 and 10000000),
  minutes integer check (minutes is null or minutes between 5 and 1440),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table public.services is 'What a business on Biznes Grow sells. The public sees the active ones of live businesses.';
create index services_business on public.services (business_id, created_at);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  -- The customer's account when they were signed in; otherwise only the name and number.
  customer_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  phone text not null check (phone ~ '^\+?[0-9 ().-]{7,20}$'),
  -- The number as digits only, to count requests from one telephone.
  phone_key text generated always as (regexp_replace(phone, '[^0-9]', '', 'g')) stored,
  wanted_at timestamptz not null,
  note text not null default '' check (char_length(note) <= 500),
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'declined', 'cancelled', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.bookings is 'A request for a booking with a business on Biznes Grow, and what became of it.';
create index bookings_business on public.bookings (business_id, created_at desc);
create index bookings_customer on public.bookings (customer_id) where customer_id is not null;
create index bookings_phone on public.bookings (phone_key, created_at desc);

create table public.pay_details (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  -- The Mauritian mobile number of the business's MCB Juice account, as "5XXX XXXX", and the name
  -- the account is under. Details for a customer to pay with: the site takes no part in a payment.
  juice_number text not null default '' check (juice_number = '' or juice_number ~ '^[0-9]{4} [0-9]{4}$'),
  juice_name text not null default '' check (char_length(juice_name) <= 80),
  updated_at timestamptz not null default now()
);
comment on table public.pay_details is 'How a business is paid by MCB Juice: details only, written by the owner, shown to the public while the business is live and on Biznes Grow.';

-- True for a live business whose Biznes Grow plan is paid up today.
create function private.takes_bookings(business uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.businesses b where b.id = business and b.status = 'live' and public.plan_now(b.plan, b.plan_until) = 'grow');
$$;
revoke all on function private.takes_bookings(uuid) from public;
grant execute on function private.takes_bookings(uuid) to anon, authenticated;

-- True for the owner of a business whose Biznes Grow plan is paid up today.
create function private.runs_grow(business uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.businesses b where b.id = business and b.owner_id = (select auth.uid()) and public.plan_now(b.plan, b.plan_until) = 'grow');
$$;
revoke all on function private.runs_grow(uuid) from public;
grant execute on function private.runs_grow(uuid) to authenticated;

-- A business lists sixty services at most.
create function private.services_before_write() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.services s where s.business_id = new.business_id) >= 60 then
    raise exception 'A business can list sixty services. Remove one first.' using errcode = 'P0001', hint = 'too_many';
  end if;
  if tg_op = 'UPDATE' and new.business_id <> old.business_id then
    raise exception 'A service stays with its business.' using errcode = '42501', hint = 'forbidden';
  end if;
  new.name := btrim(new.name);
  new.description := btrim(new.description);
  return new;
end;
$$;
revoke all on function private.services_before_write() from public;

create trigger services_10_before_write
  before insert or update on public.services
  for each row execute function private.services_before_write();

create function private.pay_details_before_write() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.juice_number := btrim(new.juice_number);
  new.juice_name := btrim(new.juice_name);
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.pay_details_before_write() from public;

create trigger pay_details_10_before_write
  before insert or update on public.pay_details
  for each row execute function private.pay_details_before_write();

-- A new booking, as the API may send it: always a request, from whoever is asking.
create function private.bookings_guard_insert() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.status := 'requested';
    new.customer_id := (select auth.uid());
    new.created_at := now();
  end if;
  new.name := btrim(new.name);
  new.phone := btrim(new.phone);
  new.note := btrim(new.note);
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.bookings_guard_insert() from public;

create trigger bookings_10_guard_insert
  before insert on public.bookings
  for each row execute function private.bookings_guard_insert();

-- The limits on a new booking, whoever sends it: a service of that business, a time to come, and
-- not too many from one telephone or to one business. It runs as the owner of the table, because
-- a visitor cannot read the bookings it has to count.
create function private.bookings_limits() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.service_id is not null and not exists (select 1 from public.services s where s.id = new.service_id and s.business_id = new.business_id and s.active) then
    raise exception 'That service is not offered by this business.' using errcode = '23514', hint = 'booking_service';
  end if;
  if new.wanted_at <= now() then
    raise exception 'Choose a time that is still to come.' using errcode = '23514', hint = 'booking_past';
  end if;
  if new.wanted_at > now() + interval '1 year' then
    raise exception 'Choose a time within the next year.' using errcode = '23514', hint = 'booking_far';
  end if;
  -- One at a time for a business, so the counts below cannot be raced past.
  perform pg_advisory_xact_lock(hashtext('biznes.bookings.' || new.business_id::text));
  if (select count(*) from public.bookings b where b.business_id = new.business_id and b.phone_key = regexp_replace(new.phone, '[^0-9]', '', 'g') and b.created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Three requests have come from this number in the last hour. Try again later, or call the business.' using errcode = 'P0001', hint = 'booking_rate';
  end if;
  if (select count(*) from public.bookings b where b.phone_key = regexp_replace(new.phone, '[^0-9]', '', 'g') and b.created_at > now() - interval '1 day') >= 10 then
    raise exception 'Too many requests have come from this number today. Try again tomorrow.' using errcode = 'P0001', hint = 'booking_rate';
  end if;
  if (select count(*) from public.bookings b where b.business_id = new.business_id and b.created_at > now() - interval '1 hour') >= 40 then
    raise exception 'This business has had many requests in the last hour. Try again later, or call it.' using errcode = 'P0001', hint = 'booking_busy';
  end if;
  return new;
end;
$$;
revoke all on function private.bookings_limits() from public;

create trigger bookings_20_limits
  before insert on public.bookings
  for each row execute function private.bookings_limits();

-- A changed booking. Through the API only its status moves: the business confirms or declines a
-- request and marks a confirmed one done; the customer cancels their own.
create function private.bookings_guard_update() returns trigger
language plpgsql set search_path = ''
as $$
declare
  by_business boolean;
  by_customer boolean;
begin
  if current_user in ('anon', 'authenticated') then
    if new.id <> old.id or new.business_id <> old.business_id or new.service_id is distinct from old.service_id or new.customer_id is distinct from old.customer_id
      or new.name <> old.name or new.phone <> old.phone or new.wanted_at <> old.wanted_at or new.note <> old.note or new.created_at <> old.created_at then
      raise exception 'Only the status of a booking can change.' using errcode = '42501', hint = 'forbidden';
    end if;
    if new.status <> old.status then
      by_business := private.owns_business(old.business_id)
        and ((old.status = 'requested' and new.status in ('confirmed', 'declined')) or (old.status = 'confirmed' and new.status in ('done', 'declined')));
      by_customer := old.customer_id is not null and old.customer_id = (select auth.uid())
        and old.status in ('requested', 'confirmed') and new.status = 'cancelled';
      if not (by_business or by_customer) then
        raise exception 'That booking cannot be changed that way.' using errcode = '42501', hint = 'booking_step';
      end if;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.bookings_guard_update() from public;

create trigger bookings_10_guard_update
  before update on public.bookings
  for each row execute function private.bookings_guard_update();

-- Who may read and change what.
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.pay_details enable row level security;

revoke all on table public.services from anon, authenticated;
revoke all on table public.bookings from anon, authenticated;
revoke all on table public.pay_details from anon, authenticated;

grant select (business_id, juice_number, juice_name) on table public.pay_details to anon;
grant select on table public.pay_details to authenticated;
grant insert (business_id, juice_number, juice_name) on table public.pay_details to authenticated;
grant update (business_id, juice_number, juice_name) on table public.pay_details to authenticated;
grant delete on table public.pay_details to authenticated;

grant select (id, business_id, name, description, price_mur, minutes, active, created_at) on table public.services to anon;
grant select on table public.services to authenticated;
grant insert (business_id, name, description, price_mur, minutes, active) on table public.services to authenticated;
grant update (name, description, price_mur, minutes, active) on table public.services to authenticated;
grant delete on table public.services to authenticated;

grant insert (business_id, service_id, name, phone, wanted_at, note) on table public.bookings to anon, authenticated;
grant select on table public.bookings to authenticated;
grant update (status) on table public.bookings to authenticated;

create policy services_public_read on public.services
  for select to anon
  using (active and private.takes_bookings(business_id));

create policy services_read on public.services
  for select to authenticated
  using (private.owns_business(business_id) or (select private.is_admin()));

create policy services_insert on public.services
  for insert to authenticated
  with check (private.runs_grow(business_id));

create policy services_update on public.services
  for update to authenticated
  using (private.owns_business(business_id))
  with check (private.runs_grow(business_id));

create policy services_delete on public.services
  for delete to authenticated
  using (private.owns_business(business_id));

-- Anyone may ask, but only a live business on Biznes Grow can be asked.
create policy bookings_request on public.bookings
  for insert to anon, authenticated
  with check (private.takes_bookings(business_id));

create policy bookings_read on public.bookings
  for select to authenticated
  using (customer_id = (select auth.uid()) or private.owns_business(business_id) or (select private.is_admin()));

create policy bookings_update on public.bookings
  for update to authenticated
  using (customer_id = (select auth.uid()) or private.owns_business(business_id))
  with check (customer_id = (select auth.uid()) or private.owns_business(business_id));

-- How a business is paid is the public's to read only while it is live and on Biznes Grow. Its
-- owner writes it at any time, for their own businesses and no other.
create policy pay_details_public_read on public.pay_details
  for select to anon
  using (private.takes_bookings(business_id));

create policy pay_details_read on public.pay_details
  for select to authenticated
  using (private.owns_business(business_id) or (select private.is_admin()));

create policy pay_details_insert on public.pay_details
  for insert to authenticated
  with check (private.owns_business(business_id));

create policy pay_details_update on public.pay_details
  for update to authenticated
  using (private.owns_business(business_id))
  with check (private.owns_business(business_id));

create policy pay_details_delete on public.pay_details
  for delete to authenticated
  using (private.owns_business(business_id));
