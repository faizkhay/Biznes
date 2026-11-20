-- biznes.mu accounts, part 5: the people who have asked to be sent the pocket guide or the magazine.
--
-- Anyone may add their address, with what they want to be sent. The site sends no email itself:
-- the list is read by an admin and each edition is sent by hand. Every row carries a token, and
-- whoever holds it can take the address off the list, with no account and no questions.

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  -- Kept in lower case, so one address is one row however it is typed.
  email text not null check (char_length(email) <= 160 and email = lower(email) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'),
  wants_guide boolean not null default false,
  wants_magazine boolean not null default false,
  -- What an unsubscribe link carries. Nothing else opens the row to its owner.
  token uuid not null default gen_random_uuid(),
  -- For the day addresses are confirmed by a message. Nothing sets it yet.
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint subscribers_wants_something check (wants_guide or wants_magazine)
);
comment on table public.subscribers is 'Addresses that asked for the pocket guide or the magazine. Written only through subscribe(); read only by admins.';
create unique index subscribers_email on public.subscribers (email);
create unique index subscribers_token on public.subscribers (token);
create index subscribers_created on public.subscribers (created_at desc);

-- Join the list, or add to what an address already on it is sent. It says nothing back, so it
-- cannot be used to find out whether an address is on the list.
create function public.subscribe(address text, guide boolean default true, magazine boolean default true) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  clean text := lower(btrim(coalesce(address, '')));
begin
  if char_length(clean) > 160 or clean !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then
    raise exception 'That email address does not look right.' using errcode = '22023', hint = 'subscribe_email';
  end if;
  if not (coalesce(guide, false) or coalesce(magazine, false)) then
    raise exception 'Choose at least one thing to be sent.' using errcode = '22023', hint = 'subscribe_nothing';
  end if;
  -- One at a time, so the counts below cannot be raced past.
  perform pg_advisory_xact_lock(hashtext('biznes.subscribers'));
  update public.subscribers
    set wants_guide = wants_guide or coalesce(guide, false), wants_magazine = wants_magazine or coalesce(magazine, false)
    where email = clean;
  if found then
    return;
  end if;
  -- A flood of new addresses is stopped here; the website also counts by connection.
  if (select count(*) from public.subscribers s where s.created_at > now() - interval '1 hour') >= 200
    or (select count(*) from public.subscribers s where s.created_at > now() - interval '1 day') >= 2000 then
    raise exception 'Many people have joined in the last while. Try again later.' using errcode = 'P0001', hint = 'subscribe_busy';
  end if;
  insert into public.subscribers (email, wants_guide, wants_magazine) values (clean, coalesce(guide, false), coalesce(magazine, false));
end;
$$;

-- Leave the list. True when an address was taken off.
create function public.unsubscribe(leave_token uuid) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.subscribers where token = leave_token;
  return found;
end;
$$;

revoke all on function public.subscribe(text, boolean, boolean) from public;
revoke all on function public.unsubscribe(uuid) from public;
grant execute on function public.subscribe(text, boolean, boolean) to anon, authenticated;
grant execute on function public.unsubscribe(uuid) to anon, authenticated;

-- An admin taking an address off by hand is on the record. A person leaving by their own link is not.
create function private.subscribers_audit() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and private.is_admin() then
    perform private.record('subscriber.removed', 'subscriber:' || old.id, '{}'::jsonb);
  end if;
  return null;
end;
$$;
revoke all on function private.subscribers_audit() from public;

create trigger subscribers_90_audit
  after delete on public.subscribers
  for each row execute function private.subscribers_audit();

alter table public.subscribers enable row level security;
revoke all on table public.subscribers from anon, authenticated;
grant select, delete on table public.subscribers to authenticated;

create policy subscribers_read on public.subscribers
  for select to authenticated
  using ((select private.is_admin()));

create policy subscribers_remove on public.subscribers
  for delete to authenticated
  using ((select private.is_admin()));
