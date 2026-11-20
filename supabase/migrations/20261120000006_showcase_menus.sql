-- biznes.mu accounts, part 6: what a paid plan adds to a business's page. A showcase (a line of its
-- own, its opening hours, a cover picture and photographs) for Biznes Go and Biznes Grow, and a
-- menu for a food outlet on either. A free listing has none of this, and the public sees none of
-- it unless the business is live and its plan is paid up today.

-- True for the owner of a business whose paid plan is good today.
create function private.runs_paid(business uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.businesses b where b.id = business and b.owner_id = (select auth.uid()) and public.plan_now(b.plan, b.plan_until) in ('go', 'grow'));
$$;

-- True for a live business whose paid plan is good today: what the public may be shown.
create function private.shows_paid(business uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.businesses b where b.id = business and b.status = 'live' and public.plan_now(b.plan, b.plan_until) in ('go', 'grow'));
$$;

revoke all on function private.runs_paid(uuid) from public;
revoke all on function private.shows_paid(uuid) from public;
grant execute on function private.runs_paid(uuid) to authenticated;
grant execute on function private.shows_paid(uuid) to anon, authenticated;

-- The categories that serve food: the group "Eat and drink" of the open index
-- (data/index/categories.json). A category added to that group there needs a row here.
create table public.food_categories (
  category text primary key check (category ~ '^[a-z0-9-]{1,60}$')
);
comment on table public.food_categories is 'The category ids whose businesses may keep a menu: the index''s "eat" group.';
insert into public.food_categories (category) values ('restaurants'), ('fast-food'), ('cafes'), ('bars'), ('bakeries');

create function private.serves_food(business uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.businesses b join public.food_categories f on f.category = b.category where b.id = business);
$$;
revoke all on function private.serves_food(uuid) from public;
grant execute on function private.serves_food(uuid) to anon, authenticated;

create table public.showcases (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  tagline text not null default '' check (char_length(tagline) <= 120),
  -- Opening hours in the owner's words, a line a day.
  hours text[] not null default '{}' check (cardinality(hours) <= 10),
  -- Pictures, as paths in the `media` bucket under business/<business_id>/.
  cover text not null default '',
  photos text[] not null default '{}' check (cardinality(photos) <= 8),
  updated_at timestamptz not null default now()
);
comment on table public.showcases is 'What a business on Biznes Go or Biznes Grow adds to its page: a line, hours, a cover picture and up to eight photographs.';

create table public.menu_sections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  position integer not null default 0 check (position between 0 and 10000),
  created_at timestamptz not null default now()
);
create index menu_sections_business on public.menu_sections (business_id, position);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.menu_sections (id) on delete cascade,
  -- The section's own business, copied here by a trigger so a policy can read it in one step.
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 300),
  -- In whole rupees. Null where the outlet gives no price.
  price_mur integer check (price_mur is null or price_mur between 0 and 10000000),
  position integer not null default 0 check (position between 0 and 10000),
  created_at timestamptz not null default now()
);
comment on table public.menu_items is 'A food outlet''s menu, section by section, for a business on Biznes Go or Biznes Grow.';
create index menu_items_section on public.menu_items (section_id, position);
create index menu_items_business on public.menu_items (business_id);

-- A showcase keeps to its own pictures: every path is under the business's own folder.
create function private.showcases_before_write() returns trigger
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
revoke all on function private.showcases_before_write() from public;

create trigger showcases_10_before_write
  before insert or update on public.showcases
  for each row execute function private.showcases_before_write();

-- A menu's sections: twenty to a business.
create function private.menu_sections_before_write() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.menu_sections s where s.business_id = new.business_id) >= 20 then
    raise exception 'A menu has twenty sections at most. Remove one first.' using errcode = 'P0001', hint = 'too_many';
  end if;
  if tg_op = 'UPDATE' and new.business_id <> old.business_id then
    raise exception 'A section stays with its business.' using errcode = '42501', hint = 'forbidden';
  end if;
  new.title := btrim(new.title);
  return new;
end;
$$;
revoke all on function private.menu_sections_before_write() from public;

create trigger menu_sections_10_before_write
  before insert or update on public.menu_sections
  for each row execute function private.menu_sections_before_write();

-- A menu's items: each belongs to the business its section belongs to, and a menu holds three hundred.
create function private.menu_items_before_write() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  select s.business_id into new.business_id from public.menu_sections s where s.id = new.section_id;
  if new.business_id is null then
    raise exception 'That section is not on the menu.' using errcode = '23503', hint = 'missing';
  end if;
  if tg_op = 'INSERT' and (select count(*) from public.menu_items i where i.business_id = new.business_id) >= 300 then
    raise exception 'A menu holds three hundred items at most. Remove one first.' using errcode = 'P0001', hint = 'too_many';
  end if;
  new.name := btrim(new.name);
  new.description := btrim(new.description);
  return new;
end;
$$;
revoke all on function private.menu_items_before_write() from public;

create trigger menu_items_10_before_write
  before insert or update on public.menu_items
  for each row execute function private.menu_items_before_write();

-- Who may read and change what.
alter table public.food_categories enable row level security;
alter table public.showcases enable row level security;
alter table public.menu_sections enable row level security;
alter table public.menu_items enable row level security;

revoke all on table public.food_categories from anon, authenticated;
revoke all on table public.showcases from anon, authenticated;
revoke all on table public.menu_sections from anon, authenticated;
revoke all on table public.menu_items from anon, authenticated;

grant select on table public.food_categories to anon, authenticated;

grant select (business_id, tagline, hours, cover, photos) on table public.showcases to anon;
grant select on table public.showcases to authenticated;
grant insert (business_id, tagline, hours, cover, photos) on table public.showcases to authenticated;
grant update (tagline, hours, cover, photos) on table public.showcases to authenticated;
grant delete on table public.showcases to authenticated;

grant select (id, business_id, title, position) on table public.menu_sections to anon;
grant select on table public.menu_sections to authenticated;
grant insert (business_id, title, position) on table public.menu_sections to authenticated;
grant update (title, position) on table public.menu_sections to authenticated;
grant delete on table public.menu_sections to authenticated;

grant select (id, section_id, business_id, name, description, price_mur, position) on table public.menu_items to anon;
grant select on table public.menu_items to authenticated;
grant insert (section_id, name, description, price_mur, position) on table public.menu_items to authenticated;
grant update (section_id, name, description, price_mur, position) on table public.menu_items to authenticated;
grant delete on table public.menu_items to authenticated;

create policy food_categories_read on public.food_categories
  for select to anon, authenticated
  using (true);

-- The public sees a showcase only while the business is live and its paid plan is good today.
create policy showcases_public_read on public.showcases
  for select to anon
  using (private.shows_paid(business_id));

create policy showcases_read on public.showcases
  for select to authenticated
  using (private.owns_business(business_id) or (select private.is_admin()));

create policy showcases_insert on public.showcases
  for insert to authenticated
  with check (private.runs_paid(business_id));

create policy showcases_update on public.showcases
  for update to authenticated
  using (private.owns_business(business_id))
  with check (private.runs_paid(business_id));

create policy showcases_delete on public.showcases
  for delete to authenticated
  using (private.owns_business(business_id));

-- A menu is for a food outlet on a paid plan, and the public sees it only while the outlet is live.
create policy menu_sections_public_read on public.menu_sections
  for select to anon
  using (private.shows_paid(business_id) and private.serves_food(business_id));

create policy menu_sections_read on public.menu_sections
  for select to authenticated
  using (private.owns_business(business_id) or (select private.is_admin()));

create policy menu_sections_insert on public.menu_sections
  for insert to authenticated
  with check (private.runs_paid(business_id) and private.serves_food(business_id));

create policy menu_sections_update on public.menu_sections
  for update to authenticated
  using (private.owns_business(business_id))
  with check (private.runs_paid(business_id) and private.serves_food(business_id));

create policy menu_sections_delete on public.menu_sections
  for delete to authenticated
  using (private.owns_business(business_id));

create policy menu_items_public_read on public.menu_items
  for select to anon
  using (private.shows_paid(business_id) and private.serves_food(business_id));

create policy menu_items_read on public.menu_items
  for select to authenticated
  using (private.owns_business(business_id) or (select private.is_admin()));

create policy menu_items_insert on public.menu_items
  for insert to authenticated
  with check (private.runs_paid(business_id) and private.serves_food(business_id));

create policy menu_items_update on public.menu_items
  for update to authenticated
  using (private.owns_business(business_id))
  with check (private.runs_paid(business_id) and private.serves_food(business_id));

create policy menu_items_delete on public.menu_items
  for delete to authenticated
  using (private.owns_business(business_id));
