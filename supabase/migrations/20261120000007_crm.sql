-- biznes.mu accounts, part 7: what a business on Biznes Grow keeps for itself. Its customers, a
-- note on a booking, products beside its services, and a ledger of the payments it has taken.
--
-- All of it is the owner's own. Nobody else reads it through the site: not a customer, not another
-- owner, not an admin. The site takes no payment: the ledger is the owner's record, kept by hand.

-- A service may be a product: a thing sold, with how many are in stock if the owner says.
alter table public.services
  add column kind text not null default 'service' check (kind in ('service', 'product')),
  add column stock integer check (stock is null or stock between 0 and 1000000);

-- The public sees what kind a thing is, and not how many are left.
grant select (kind) on table public.services to anon;
grant insert (kind, stock) on table public.services to authenticated;
grant update (kind, stock) on table public.services to authenticated;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  phone text not null default '' check (phone = '' or phone ~ '^\+?[0-9 ().-]{7,20}$'),
  -- The number as digits only: how a customer is matched to the bookings made from that number.
  phone_key text generated always as (regexp_replace(phone, '[^0-9]', '', 'g')) stored,
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.customers is 'A business''s own list of its customers, kept by its owner on Biznes Grow. Nobody else reads it.';
create unique index customers_one_number on public.customers (business_id, phone_key) where phone_key <> '';
create index customers_business on public.customers (business_id, name);

-- A word the business keeps on a booking. It is apart from the booking itself, because the
-- customer who made the booking can read that, and must not read this.
create table public.booking_notes (
  booking_id uuid primary key references public.bookings (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  note text not null default '' check (char_length(note) <= 1000),
  updated_at timestamptz not null default now()
);
comment on table public.booking_notes is 'The business''s own note on a booking. The customer cannot read it.';
create index booking_notes_business on public.booking_notes (business_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  -- The booking this pays for, when it pays for one. A booking is paid once.
  booking_id uuid references public.bookings (id) on delete set null,
  paid_on date not null,
  payer text not null default '' check (char_length(payer) <= 80),
  what text not null default '' check (char_length(what) <= 160),
  -- In whole rupees.
  amount_mur integer not null check (amount_mur between 1 and 100000000),
  method text not null check (method in ('juice', 'cash', 'card', 'transfer')),
  created_at timestamptz not null default now()
);
comment on table public.payments is 'A ledger the owner keeps by hand of payments the business has taken. The site takes none and checks none.';
create unique index payments_one_a_booking on public.payments (booking_id) where booking_id is not null;
create index payments_business on public.payments (business_id, paid_on desc);

create function private.customers_before_write() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.customers c where c.business_id = new.business_id) >= 5000 then
    raise exception 'A business keeps five thousand customers at most.' using errcode = 'P0001', hint = 'too_many';
  end if;
  if tg_op = 'UPDATE' and new.business_id <> old.business_id then
    raise exception 'A customer stays with the business.' using errcode = '42501', hint = 'forbidden';
  end if;
  new.name := btrim(new.name);
  new.phone := btrim(new.phone);
  new.notes := btrim(new.notes);
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.customers_before_write() from public;

create trigger customers_10_before_write
  before insert or update on public.customers
  for each row execute function private.customers_before_write();

-- A note belongs to the business the booking was made with, whatever was sent.
create function private.booking_notes_before_write() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  select b.business_id into new.business_id from public.bookings b where b.id = new.booking_id;
  if new.business_id is null then
    raise exception 'That booking is not here.' using errcode = '23503', hint = 'missing';
  end if;
  new.note := btrim(new.note);
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.booking_notes_before_write() from public;

create trigger booking_notes_10_before_write
  before insert or update on public.booking_notes
  for each row execute function private.booking_notes_before_write();

-- A payment names only the business's own customers and bookings.
create function private.payments_before_write() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.business_id <> old.business_id then
    raise exception 'A payment stays with the business.' using errcode = '42501', hint = 'forbidden';
  end if;
  if new.booking_id is not null and not exists (select 1 from public.bookings b where b.id = new.booking_id and b.business_id = new.business_id) then
    raise exception 'That booking is not this business''s.' using errcode = '23514', hint = 'payment_booking';
  end if;
  if new.customer_id is not null and not exists (select 1 from public.customers c where c.id = new.customer_id and c.business_id = new.business_id) then
    raise exception 'That customer is not this business''s.' using errcode = '23514', hint = 'payment_customer';
  end if;
  if tg_op = 'INSERT' and (select count(*) from public.payments p where p.business_id = new.business_id) >= 50000 then
    raise exception 'The ledger is full. Write to us.' using errcode = 'P0001', hint = 'too_many';
  end if;
  new.payer := btrim(new.payer);
  new.what := btrim(new.what);
  return new;
end;
$$;
revoke all on function private.payments_before_write() from public;

create trigger payments_10_before_write
  before insert or update on public.payments
  for each row execute function private.payments_before_write();

-- How often each telephone number has booked with a business, and when last. It reads the
-- bookings as whoever asks, so an owner sees their own business's and nobody sees another's.
create view public.customer_tallies with (security_invoker = true) as
  select
    b.business_id,
    b.phone_key,
    (array_agg(b.name order by b.created_at desc))[1] as name,
    (array_agg(b.phone order by b.created_at desc))[1] as phone,
    count(*)::integer as bookings,
    count(*) filter (where b.status = 'done')::integer as done,
    max(b.wanted_at) as last_wanted
  from public.bookings b
  group by b.business_id, b.phone_key;
comment on view public.customer_tallies is 'Bookings counted by telephone number, for a business''s list of customers.';

-- What the ledger adds up to, month by month. Read as whoever asks, so only by the owner.
create view public.payment_totals with (security_invoker = true) as
  select p.business_id, to_char(p.paid_on, 'YYYY-MM') as month, sum(p.amount_mur)::bigint as total, count(*)::integer as payments
  from public.payments p
  group by p.business_id, to_char(p.paid_on, 'YYYY-MM');
comment on view public.payment_totals is 'A business''s ledger, added up by month.';

-- Who may read and change what: the owner, on Biznes Grow, and nobody else.
alter table public.customers enable row level security;
alter table public.booking_notes enable row level security;
alter table public.payments enable row level security;

revoke all on table public.customers from anon, authenticated;
revoke all on table public.booking_notes from anon, authenticated;
revoke all on table public.payments from anon, authenticated;
revoke all on table public.customer_tallies from anon, authenticated;
revoke all on table public.payment_totals from anon, authenticated;

grant select on table public.customers to authenticated;
grant insert (business_id, name, phone, notes) on table public.customers to authenticated;
grant update (name, phone, notes) on table public.customers to authenticated;
grant delete on table public.customers to authenticated;

grant select on table public.booking_notes to authenticated;
grant insert (booking_id, note) on table public.booking_notes to authenticated;
grant update (booking_id, note) on table public.booking_notes to authenticated;
grant delete on table public.booking_notes to authenticated;

grant select on table public.payments to authenticated;
grant insert (business_id, customer_id, booking_id, paid_on, payer, what, amount_mur, method) on table public.payments to authenticated;
grant update (customer_id, booking_id, paid_on, payer, what, amount_mur, method) on table public.payments to authenticated;
grant delete on table public.payments to authenticated;

grant select on table public.customer_tallies to authenticated;
grant select on table public.payment_totals to authenticated;

create policy customers_read on public.customers
  for select to authenticated
  using (private.owns_business(business_id));

create policy customers_insert on public.customers
  for insert to authenticated
  with check (private.runs_grow(business_id));

create policy customers_update on public.customers
  for update to authenticated
  using (private.owns_business(business_id))
  with check (private.runs_grow(business_id));

create policy customers_delete on public.customers
  for delete to authenticated
  using (private.owns_business(business_id));

create policy booking_notes_read on public.booking_notes
  for select to authenticated
  using (private.owns_business(business_id));

create policy booking_notes_insert on public.booking_notes
  for insert to authenticated
  with check (private.runs_grow(business_id));

create policy booking_notes_update on public.booking_notes
  for update to authenticated
  using (private.owns_business(business_id))
  with check (private.runs_grow(business_id));

create policy booking_notes_delete on public.booking_notes
  for delete to authenticated
  using (private.owns_business(business_id));

create policy payments_read on public.payments
  for select to authenticated
  using (private.owns_business(business_id));

create policy payments_insert on public.payments
  for insert to authenticated
  with check (private.runs_grow(business_id));

create policy payments_update on public.payments
  for update to authenticated
  using (private.owns_business(business_id))
  with check (private.runs_grow(business_id));

create policy payments_delete on public.payments
  for delete to authenticated
  using (private.owns_business(business_id));
