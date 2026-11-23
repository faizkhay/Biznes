-- biznes.mu accounts, part 14: the site's own email.
--
-- The list of subscribers (part 5) was a table an admin took as a file. This part makes it a list
-- the site can write to: an address is confirmed by a link, addresses that must not be written to
-- are kept apart, a message is written as a campaign, and sending it is a queue with one row for
-- each address. The last mile, handing a message to a mail service, is the website's
-- (src/lib/accounts/email): the database holds who, what and when, and decides who may be written
-- to. It holds no key of any mail service.
--
-- It alters `subscribers` and keeps every row. Nothing here sends anything.
--
--   1. Confirming an address (and letting an address from before part 11 be written to its row).
--   2. Addresses that must not be written to.
--   3. The settings: who a message comes from, and who it goes to.
--   4. Campaigns: what is written.
--   5. The queue: one row for each address, and no address twice.
--   6. What an admin's page counts.

------------------------------------------------------------------------------------------------
-- A call that certainly came through the website.
--
-- `private.from_site()` (part 11) asks for the site's word only once its hash is kept. Three
-- things below hand the website something a visitor must never be handed (a link that confirms an
-- address) or believe the website about something only it could check (a mail service's signed
-- word that an address bounced). For those the hash must be kept and the word must match: with
-- no hash kept they are refused, not let through.
create function private.strictly_from_site() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from private.site_proof p
    where p.word_hash = encode(sha256(convert_to(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-biznes-proof', ''), 'utf8')), 'hex'));
$$;
revoke all on function private.strictly_from_site() from public, anon, authenticated;

------------------------------------------------------------------------------------------------
-- 1. Confirming an address.
--
-- `confirmed_at` has been on the table since part 5 and nothing set it. An address is confirmed
-- by pressing a button on a page that a link in a message leads to: the link carries a token of
-- its own, apart from the one that leaves the list, so a message passed on to a friend cannot
-- confirm for its first reader, and a link to leave never confirms.
alter table public.subscribers
  add column confirm_token uuid not null default gen_random_uuid(),
  add column confirm_sent_at timestamptz;
comment on column public.subscribers.confirm_token is 'What the link in a message asking to confirm carries. It is made again when the address is suppressed, so an old link confirms nothing.';
comment on column public.subscribers.confirm_sent_at is 'When a message asking this address to confirm was last handed to a mail service. Null: it has never been asked.';
create unique index subscribers_confirm_token on public.subscribers (confirm_token);
create index subscribers_unconfirmed on public.subscribers (created_at) where confirmed_at is null;

-- Part 11 narrowed the pattern of an address with a check that was not made of the rows already
-- there. Such a check is still made of an old row whenever anything on it is written, so an
-- address that joined before could not be confirmed, asked to confirm or kept from being written
-- to: each of those writes its row. The rule is the same and is now asked only where it was meant:
-- of a new address, and of one that is changed.
alter table public.subscribers drop constraint subscribers_email_plain;

create function private.subscribers_email_plain() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' or new.email is distinct from old.email) and new.email !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' then
    raise exception 'That email address does not look right.' using errcode = '23514', hint = 'subscribe_email';
  end if;
  return new;
end;
$$;
revoke all on function private.subscribers_email_plain() from public;

create trigger subscribers_05_email_plain
  before insert or update on public.subscribers
  for each row execute function private.subscribers_email_plain();

-- Pressed on the page the link leads to. True when the link was a real one. Confirming twice
-- changes nothing the second time.
create function public.confirm_subscription(link_token uuid) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  address text;
begin
  if not private.from_site() then
    raise exception 'Confirm your address from the link you were sent.' using errcode = '42501', hint = 'forbidden';
  end if;
  update public.subscribers s set confirmed_at = coalesce(s.confirmed_at, now())
    where s.confirm_token = link_token
    returning s.email into address;
  if address is null then
    return false;
  end if;
  -- A message reached the address and its reader pressed: an address that had bounced is good
  -- again. One whose reader complained, or asked us by hand, stays as it is until an admin lifts it.
  delete from public.email_suppressions x where x.email = address and x.reason = 'bounce';
  return true;
end;
$$;
revoke all on function public.confirm_subscription(uuid) from public;
grant execute on function public.confirm_subscription(uuid) to anon, authenticated;

------------------------------------------------------------------------------------------------
-- 2. Addresses that must not be written to.
--
-- A hard bounce, a complaint, or a person who asked us by hand. It is looked at when a message is
-- queued and again as each batch is taken, so no message reaches one. Joining the list again does
-- not take an address out of here: only a fresh confirmation does (for a bounce), or an admin, by
-- hand and on the record.
create table public.email_suppressions (
  -- In lower case, as on the list. Wider than the list's own pattern: a mail service may report
  -- an address that joined before the pattern was narrowed.
  email text primary key check (char_length(email) <= 160 and email = lower(email) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'),
  reason text not null check (reason in ('bounce', 'complaint', 'asked')),
  -- What the mail service said, or the admin's own line.
  detail text not null default '' check (char_length(detail) <= 300),
  -- Who said so: an admin, or the mail service whose signed word the website checked.
  source text not null default 'admin' check (source in ('admin', 'resend', 'mailgun', 'local')),
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
comment on table public.email_suppressions is 'Addresses that must not be written to, with the reason and the day. Read by admins; written by functions only.';
create index email_suppressions_created on public.email_suppressions (created_at desc);

-- One address into the table, by whatever road. A complaint is never written over by a lesser
-- reason. The address's old confirmation no longer counts and its old link confirms nothing.
create function private.suppress(address text, why text, said text, by_whom text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  clean text := lower(btrim(coalesce(address, '')));
begin
  if char_length(clean) > 160 or clean !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then
    raise exception 'That email address does not look right.' using errcode = '22023', hint = 'email_address';
  end if;
  insert into public.email_suppressions as x (email, reason, detail, source, added_by)
  values (clean, why, left(btrim(coalesce(said, '')), 300), by_whom, (select p.id from public.profiles p where p.id = (select auth.uid())))
  on conflict (email) do update
    set reason = excluded.reason, detail = excluded.detail, source = excluded.source, added_by = excluded.added_by, created_at = now()
    where x.reason <> 'complaint' or excluded.reason = 'complaint';
  update public.subscribers s set confirmed_at = null, confirm_token = gen_random_uuid(), confirm_sent_at = null where s.email = clean;
  perform private.record('email.suppressed', 'address:' || clean, jsonb_build_object('reason', why, 'source', by_whom));
end;
$$;
revoke all on function private.suppress(text, text, text, text) from public;

-- An admin, for a person who asked not to be written to.
create function public.admin_suppress(address text, why text default '') returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  perform private.suppress(address, 'asked', why, 'admin');
end;
$$;
revoke all on function public.admin_suppress(text, text) from public, anon;
grant execute on function public.admin_suppress(text, text) to authenticated;

-- An admin lifts one, by hand. The address, if it is still on the list, stays unconfirmed.
create function public.admin_unsuppress(address text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  was public.email_suppressions;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  delete from public.email_suppressions x where x.email = lower(btrim(coalesce(address, ''))) returning * into was;
  if was.email is null then
    raise exception 'That address is not among the ones we do not write to.' using errcode = 'P0002', hint = 'missing';
  end if;
  perform private.record('email.unsuppressed', 'address:' || was.email, jsonb_build_object('reason', was.reason, 'source', was.source));
end;
$$;
revoke all on function public.admin_unsuppress(text) from public, anon;
grant execute on function public.admin_unsuppress(text) to authenticated;

-- What a mail service told the website afterwards: a hard bounce or a complaint. The website has
-- checked the service's own signature before it calls this, and says so with its word, which
-- must be the right one: with no hash kept this is refused.
create function public.email_event(provider text, kind text, address text, detail text default '') returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.strictly_from_site() then
    raise exception 'Only the website may report what a mail service said.' using errcode = '42501', hint = 'forbidden';
  end if;
  if provider is null or provider not in ('resend', 'mailgun', 'local') or kind is null or kind not in ('bounce', 'complaint') then
    raise exception 'That is not something a mail service says.' using errcode = '22023', hint = 'invalid';
  end if;
  perform private.suppress(address, kind, detail, provider);
end;
$$;
revoke all on function public.email_event(text, text, text, text) from public;
grant execute on function public.email_event(text, text, text, text) to anon, authenticated;

alter table public.email_suppressions enable row level security;
revoke all on table public.email_suppressions from anon, authenticated;
grant select on table public.email_suppressions to authenticated;

create policy email_suppressions_read on public.email_suppressions
  for select to authenticated
  using ((select private.is_admin()));

------------------------------------------------------------------------------------------------
-- 3. The settings. One row: who a message comes from, where a reply goes, the sender's postal
-- address, which every message ends with, and who is written to. The superadmin's alone to
-- change; admins read them, because a message cannot be sent without them.
create table public.email_settings (
  -- One row, and only ever one.
  id boolean primary key default true check (id),
  from_name text not null default '' check (char_length(from_name) <= 80 and from_name !~ '[[:cntrl:]<>"]'),
  from_email text not null default '' check (from_email = '' or (char_length(from_email) <= 160 and from_email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$')),
  reply_to text not null default '' check (reply_to = '' or (char_length(reply_to) <= 160 and reply_to ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$')),
  -- Several lines. No message may be sent while it is empty.
  postal_address text not null default '' check (char_length(postal_address) <= 300),
  -- Who a message goes to. 'confirmed_once_connected': only confirmed addresses when the site
  -- itself sends, and every address that is not suppressed when a message is sent by hand, because
  -- with no sender connected nobody can be asked to confirm. 'confirmed': only confirmed
  -- addresses, by either road. 'everyone': every address that is not suppressed.
  write_to text not null default 'confirmed_once_connected' check (write_to in ('confirmed_once_connected', 'confirmed', 'everyone')),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
comment on table public.email_settings is 'A single row: who the site''s email comes from, the postal address every message ends with, and who is written to. The superadmin''s to change.';
insert into public.email_settings (id) values (true);

create function private.email_settings_before_update() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.id := true;
  new.from_name := btrim(new.from_name);
  new.from_email := lower(btrim(new.from_email));
  new.reply_to := lower(btrim(new.reply_to));
  new.postal_address := btrim(new.postal_address);
  new.updated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.email_settings_before_update() from public;

create trigger email_settings_10_before_update
  before update on public.email_settings
  for each row execute function private.email_settings_before_update();

create function private.email_settings_audit() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (new.from_name, new.from_email, new.reply_to, new.postal_address, new.write_to) is distinct from (old.from_name, old.from_email, old.reply_to, old.postal_address, old.write_to) then
    perform private.record('settings.email', 'email_settings', jsonb_build_object('from_name', new.from_name, 'from_email', new.from_email, 'reply_to', new.reply_to, 'postal_address', new.postal_address, 'write_to', new.write_to));
  end if;
  return null;
end;
$$;
revoke all on function private.email_settings_audit() from public;

create trigger email_settings_90_audit
  after update on public.email_settings
  for each row execute function private.email_settings_audit();

alter table public.email_settings enable row level security;
revoke all on table public.email_settings from anon, authenticated;
grant select on table public.email_settings to authenticated;
grant update (from_name, from_email, reply_to, postal_address, write_to) on table public.email_settings to authenticated;

create policy email_settings_read on public.email_settings
  for select to authenticated
  using ((select private.is_admin()));

create policy email_settings_update on public.email_settings
  for update to authenticated
  using ((select private.is_superadmin()))
  with check ((select private.is_superadmin()));

-- The link to confirm an address that has just joined, for the website to put in a message. It
-- is handed over only to the website (its word must be the right one), only for an address that
-- is on the list and not yet confirmed, and once a day at most for any one address, so the form
-- cannot be used to fill a stranger's inbox. An address whose reader complained or asked us by
-- hand is not written to, even to confirm. Null: there is nothing to send to this address.
create function public.confirmation_for(address text) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  clean text := lower(btrim(coalesce(address, '')));
  found_row public.subscribers;
  setting public.email_settings;
begin
  if not private.strictly_from_site() then
    raise exception 'Only the website may ask for a link to confirm.' using errcode = '42501', hint = 'forbidden';
  end if;
  -- No message may be sent while there is nobody for it to come from or no postal address to end
  -- it with. That is said before the address is looked at, so it says nothing about the address.
  select * into setting from public.email_settings;
  if setting.postal_address = '' or setting.from_email = '' or setting.from_name = '' then
    raise exception 'No message may be sent until the settings say who it comes from and give the sender''s postal address.' using errcode = 'P0001', hint = 'email_not_ready';
  end if;
  select * into found_row from public.subscribers s where s.email = clean for update;
  if found_row.id is null or found_row.confirmed_at is not null then
    return null;
  end if;
  if exists (select 1 from public.email_suppressions x where x.email = clean and x.reason <> 'bounce') then
    return null;
  end if;
  if found_row.confirm_sent_at is not null and found_row.confirm_sent_at > now() - interval '1 day' then
    return null;
  end if;
  update public.subscribers s set confirm_sent_at = now() where s.id = found_row.id;
  -- With the link goes what the message is sent with: a visitor's request cannot read the settings.
  return jsonb_build_object('confirm', found_row.confirm_token, 'leave', found_row.token,
    'from_name', setting.from_name, 'from_email', setting.from_email, 'reply_to', setting.reply_to, 'postal_address', setting.postal_address);
end;
$$;
revoke all on function public.confirmation_for(text) from public;
grant execute on function public.confirmation_for(text) to anon, authenticated;

-- The message asking to confirm could not be handed to the mail service: the address may be
-- asked again at once, and counts as never asked.
create function public.confirmation_unsent(link_token uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.strictly_from_site() then
    raise exception 'Only the website may say that.' using errcode = '42501', hint = 'forbidden';
  end if;
  update public.subscribers s set confirm_sent_at = null where s.confirm_token = link_token and s.confirmed_at is null;
end;
$$;
revoke all on function public.confirmation_unsent(uuid) from public;
grant execute on function public.confirmation_unsent(uuid) to anon, authenticated;

------------------------------------------------------------------------------------------------
-- 4. Campaigns: a message to the list.
--
-- A body is a list of blocks, each one of four kinds: a heading, a paragraph, a button that leads
-- to a path on this site or to a full https address, and a line. Nothing else, and no HTML: the
-- website draws the blocks itself. A draft may hold a block that is not filled in yet (`whole`
-- false); a message that is ready may not.
create function private.are_email_blocks(blocks jsonb, whole boolean) returns boolean
language sql immutable set search_path = ''
as $$
  select case when jsonb_typeof(blocks) = 'array' then
    jsonb_array_length(blocks) <= 40
    and not exists (
      select 1 from jsonb_array_elements(blocks) b
      where not coalesce(
        case when jsonb_typeof(b) <> 'object' then false else
          case b ->> 'type'
            when 'heading' then char_length(b ->> 'text') between (case when whole then 1 else 0 end) and 120 and (b ->> 'text') !~ '[[:cntrl:]]'
            -- A paragraph may break its lines; it holds no other mark that is not a letter.
            when 'paragraph' then char_length(b ->> 'text') between (case when whole then 1 else 0 end) and 2000 and (b ->> 'text') !~ '[\x01-\x09\x0b-\x1f\x7f]'
            when 'button' then char_length(b ->> 'label') between (case when whole then 1 else 0 end) and 60 and (b ->> 'label') !~ '[[:cntrl:]]'
              and char_length(b ->> 'href') <= 300
              and (((b ->> 'href') = '' and not whole) or ((b ->> 'href') ~ '^(/[^[:space:]"<>]*|https://[^[:space:]"<>]+)$' and (b ->> 'href') !~ '^//'))
            when 'line' then true
            else false
          end
        end, false))
    else false end;
$$;
revoke all on function private.are_email_blocks(jsonb, boolean) from public;

create table public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  -- What it is for: an edition of the pocket guide, the magazine, a note, or asking the addresses
  -- that joined before to confirm.
  kind text not null check (kind in ('guide', 'magazine', 'note', 'confirm')),
  -- Who it goes to: those who asked for the guide, for the magazine, or everyone on the list.
  audience text not null check (audience in ('guide', 'magazine', 'everyone', 'unconfirmed')),
  -- The month of the edition it announces, for the pocket guide.
  edition text check (edition is null or edition ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  subject text not null default '' check (char_length(subject) <= 150 and subject !~ '[[:cntrl:]]'),
  -- The line a mail program shows after the subject.
  preheader text not null default '' check (char_length(preheader) <= 200 and preheader !~ '[[:cntrl:]]'),
  blocks jsonb not null default '[]'::jsonb check (private.are_email_blocks(blocks, false)),
  status text not null default 'draft' check (status in ('draft', 'ready', 'sending', 'sent', 'cancelled')),
  -- Sent from the owner's own mail program, and written into the record afterwards.
  by_hand boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  started_by uuid references public.profiles (id) on delete set null,
  started_at timestamptz,
  finished_at timestamptz,
  constraint email_campaigns_confirm_goes_to_unconfirmed check ((kind = 'confirm') = (audience = 'unconfirmed'))
);
comment on table public.email_campaigns is 'A message to the list: what it is for, who it goes to, its words, and where it stands. Written by admins, through functions.';
create index email_campaigns_created on public.email_campaigns (created_at desc);

-- A new message, as a draft.
create function public.email_campaign_create(kind text, audience text, subject text default '', preheader text default '', blocks jsonb default '[]'::jsonb, edition text default null) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  made uuid;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  if kind is null or kind not in ('guide', 'magazine', 'note') or audience is null or audience not in ('guide', 'magazine', 'everyone') then
    raise exception 'Say what the message is for, and who it goes to.' using errcode = '22023', hint = 'invalid';
  end if;
  if (select count(*) from public.email_campaigns c where c.created_at > now() - interval '1 day') >= 100 then
    raise exception 'A hundred messages have been started today. Use one of them.' using errcode = 'P0001', hint = 'too_many';
  end if;
  insert into public.email_campaigns (kind, audience, edition, subject, preheader, blocks, created_by, updated_by)
  values (kind, audience, edition, btrim(coalesce(subject, '')), btrim(coalesce(preheader, '')), coalesce(blocks, '[]'::jsonb), (select auth.uid()), (select auth.uid()))
  returning id into made;
  perform private.record('email.campaign_created', 'campaign:' || made, jsonb_build_object('kind', kind, 'audience', audience, 'subject', btrim(coalesce(subject, ''))));
  return made;
end;
$$;
revoke all on function public.email_campaign_create(text, text, text, text, jsonb, text) from public, anon;
grant execute on function public.email_campaign_create(text, text, text, text, jsonb, text) to authenticated;

-- Change a draft's words, or who it goes to. Only a draft is changed: one that is ready has been
-- looked at as it is, and one that is being sent or was sent is the record.
create function public.email_campaign_save(campaign uuid, audience text, subject text, preheader text, blocks jsonb) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  was public.email_campaigns;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  select * into was from public.email_campaigns c where c.id = campaign for update;
  if was.id is null then
    raise exception 'That message is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
  if was.status <> 'draft' or was.kind = 'confirm' then
    raise exception 'Only a draft can be changed. Make it a draft again first.' using errcode = 'P0001', hint = 'email_step';
  end if;
  if audience is null or audience not in ('guide', 'magazine', 'everyone') then
    raise exception 'Say who the message goes to.' using errcode = '22023', hint = 'invalid';
  end if;
  update public.email_campaigns c
    set audience = email_campaign_save.audience, subject = btrim(coalesce(email_campaign_save.subject, '')), preheader = btrim(coalesce(email_campaign_save.preheader, '')),
        blocks = coalesce(email_campaign_save.blocks, '[]'::jsonb), updated_by = (select auth.uid()), updated_at = now()
    where c.id = campaign;
end;
$$;
revoke all on function public.email_campaign_save(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.email_campaign_save(uuid, text, text, text, jsonb) to authenticated;

-- Move a message between draft, ready and cancelled. Sending and sent are reached only by the
-- functions of the queue below. Cancelling one that is being sent leaves out everyone not yet
-- written to; what was sent stays on the record.
create function public.email_campaign_step(campaign uuid, new_status text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  was public.email_campaigns;
  left_out integer := 0;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  select * into was from public.email_campaigns c where c.id = campaign for update;
  if was.id is null then
    raise exception 'That message is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
  if new_status = 'ready' and was.status = 'draft' and was.kind <> 'confirm' then
    if btrim(was.subject) = '' then
      raise exception 'Give the message a subject first.' using errcode = '23514', hint = 'email_subject';
    end if;
    if jsonb_array_length(was.blocks) = 0 then
      raise exception 'Write something in the message first.' using errcode = '23514', hint = 'email_empty';
    end if;
    if not private.are_email_blocks(was.blocks, true) then
      raise exception 'A part of the message is not filled in. Fill it in or take it out first.' using errcode = '23514', hint = 'email_blocks';
    end if;
  elsif new_status = 'draft' and was.status in ('ready', 'cancelled') and was.started_at is null then
    null;
  elsif new_status = 'cancelled' and was.status in ('draft', 'ready') then
    null;
  elsif new_status = 'cancelled' and was.status = 'sending' then
    update public.email_recipients r set state = 'skipped', reason = 'cancelled', done_at = now() where r.campaign_id = campaign and r.state = 'queued';
    get diagnostics left_out = row_count;
  else
    raise exception 'That message cannot be moved that way from where it stands.' using errcode = 'P0001', hint = 'email_step';
  end if;
  update public.email_campaigns c
    set status = new_status, updated_by = (select auth.uid()), updated_at = now(),
        finished_at = case when new_status = 'cancelled' and was.status = 'sending' then now() else c.finished_at end
    where c.id = campaign;
  perform private.record('email.campaign_' || new_status, 'campaign:' || campaign, jsonb_build_object('kind', was.kind, 'subject', was.subject, 'from', was.status, 'left_out', left_out));
end;
$$;
revoke all on function public.email_campaign_step(uuid, text) from public, anon;
grant execute on function public.email_campaign_step(uuid, text) to authenticated;

-- Take a message out for good. Only one that was never sent to anyone: what was sent is the record.
create function public.email_campaign_remove(campaign uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  was public.email_campaigns;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  select * into was from public.email_campaigns c where c.id = campaign for update;
  if was.id is null then
    raise exception 'That message is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
  if was.started_at is not null or was.status not in ('draft', 'ready', 'cancelled') then
    raise exception 'A message that was sent stays on the record.' using errcode = 'P0001', hint = 'email_step';
  end if;
  delete from public.email_campaigns c where c.id = campaign;
  perform private.record('email.campaign_removed', 'campaign:' || campaign, jsonb_build_object('kind', was.kind, 'subject', was.subject));
end;
$$;
revoke all on function public.email_campaign_remove(uuid) from public, anon;
grant execute on function public.email_campaign_remove(uuid) to authenticated;

alter table public.email_campaigns enable row level security;
revoke all on table public.email_campaigns from anon, authenticated;
grant select on table public.email_campaigns to authenticated;

create policy email_campaigns_read on public.email_campaigns
  for select to authenticated
  using ((select private.is_admin()));

------------------------------------------------------------------------------------------------
-- 5. The queue.
--
-- Pressing "Send" writes one row here for each address the message goes to, with the address as
-- it was that day. The website then takes the rows a batch at a time, hands each batch to the
-- mail service, and says how it went. One address is in a campaign once, by a unique rule, and a
-- row is taken once: no address is written to twice for one campaign.
create table public.email_recipients (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.email_campaigns (id) on delete cascade,
  -- Whose row on the list it was. Empty once that person has left.
  subscriber_id uuid references public.subscribers (id) on delete set null,
  -- The address as it was when the message was queued.
  email text not null,
  -- queued: waiting. sending: taken by a batch, not yet answered for. sent, failed: as the mail
  -- service answered. skipped: left out, with the reason.
  state text not null default 'queued' check (state in ('queued', 'sending', 'sent', 'failed', 'skipped')),
  -- Why it was skipped (suppressed, unconfirmed, left, confirmed, cancelled), or what the mail service said.
  reason text not null default '' check (char_length(reason) <= 300),
  -- A failure with no plain answer: the batch may or may not have gone. Never tried again by itself.
  unsure boolean not null default false,
  -- The batch that took it, and the name the mail service gave the message.
  batch uuid,
  provider_id text not null default '' check (char_length(provider_id) <= 200),
  claimed_at timestamptz,
  done_at timestamptz,
  constraint email_recipients_once unique (campaign_id, email)
);
comment on table public.email_recipients is 'Who a message went to: one row for each address, once for a campaign, with how it went. Written by the functions of the queue; read by admins.';
create index email_recipients_state on public.email_recipients (campaign_id, state, id);
create index email_recipients_batch on public.email_recipients (batch) where batch is not null;

alter table public.email_recipients enable row level security;
revoke all on table public.email_recipients from anon, authenticated;
grant select on table public.email_recipients to authenticated;

create policy email_recipients_read on public.email_recipients
  for select to authenticated
  using ((select private.is_admin()));

-- Who a campaign goes to today, and who is left out and why. `hand` is the road: a message the
-- site sends itself, or one sent from the owner's own mail program (see `write_to` above).
create function private.email_audience(campaign uuid, hand boolean)
returns table (subscriber_id uuid, email text, leave_token uuid, state text, reason text)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.email, s.token,
    case when x.email is not null or (need.confirmed and s.confirmed_at is null) then 'skipped' else 'queued' end,
    case when x.email is not null then 'suppressed' when need.confirmed and s.confirmed_at is null then 'unconfirmed' else '' end
  from public.email_campaigns c
  cross join lateral (
    select case (select e.write_to from public.email_settings e) when 'everyone' then false when 'confirmed' then true else not coalesce(hand, false) end as confirmed
  ) need
  join public.subscribers s on c.audience = 'everyone' or (c.audience = 'guide' and s.wants_guide) or (c.audience = 'magazine' and s.wants_magazine)
  left join public.email_suppressions x on x.email = s.email
  where c.id = campaign and c.kind <> 'confirm';
$$;
revoke all on function private.email_audience(uuid, boolean) from public;

-- How a campaign stands: how many are waiting, taken, sent, failed and left out.
create function private.email_progress(campaign uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'status', (select c.status from public.email_campaigns c where c.id = campaign),
    'queued', count(*) filter (where r.state = 'queued'),
    'sending', count(*) filter (where r.state = 'sending'),
    'sent', count(*) filter (where r.state = 'sent'),
    'failed', count(*) filter (where r.state = 'failed'),
    'unsure', count(*) filter (where r.state = 'failed' and r.unsure),
    'skipped', count(*) filter (where r.state = 'skipped'),
    'total', count(*))
  from public.email_recipients r where r.campaign_id = campaign;
$$;
revoke all on function private.email_progress(uuid) from public;

-- A campaign with nobody left waiting or taken is finished, and that is on the record.
create function private.email_finish(campaign uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  was public.email_campaigns;
begin
  select * into was from public.email_campaigns c where c.id = campaign;
  if was.status <> 'sending' or exists (select 1 from public.email_recipients r where r.campaign_id = campaign and r.state in ('queued', 'sending')) then
    return;
  end if;
  update public.email_campaigns c set status = 'sent', finished_at = now(), updated_at = now() where c.id = campaign;
  perform private.record('email.campaign_sent', 'campaign:' || campaign, private.email_progress(campaign) || jsonb_build_object('kind', was.kind, 'subject', was.subject));
end;
$$;
revoke all on function private.email_finish(uuid) from public;

-- What an admin is shown before sending: how many would be written to, and how many left out.
create function public.email_audience_counts(campaign uuid, by_hand boolean default false) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  return (
    select jsonb_build_object(
      'to_send', count(*) filter (where a.state = 'queued'),
      'suppressed', count(*) filter (where a.reason = 'suppressed'),
      'unconfirmed', count(*) filter (where a.reason = 'unconfirmed'))
    from private.email_audience(campaign, by_hand) a);
end;
$$;
revoke all on function public.email_audience_counts(uuid, boolean) from public, anon;
grant execute on function public.email_audience_counts(uuid, boolean) to authenticated;

-- The addresses a message sent by hand goes to, each with its own link to leave, for the file an
-- admin takes to their own mail program.
create function public.email_hand_list(campaign uuid) returns table (email text, leave_token uuid)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  return query select a.email, a.leave_token from private.email_audience(campaign, true) a where a.state = 'queued' order by a.email;
end;
$$;
revoke all on function public.email_hand_list(uuid) from public, anon;
grant execute on function public.email_hand_list(uuid) to authenticated;

-- "Send": one row for each address, and the campaign is being sent. No message goes out while
-- the sender's postal address is empty, or while there is no address to send from.
create function public.email_queue(campaign uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  was public.email_campaigns;
  setting public.email_settings;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  select * into was from public.email_campaigns c where c.id = campaign for update;
  if was.id is null then
    raise exception 'That message is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
  if was.status <> 'ready' or was.kind = 'confirm' then
    raise exception 'Only a message that is ready can be sent.' using errcode = 'P0001', hint = 'email_step';
  end if;
  select * into setting from public.email_settings;
  if setting.postal_address = '' then
    raise exception 'No message may be sent until the sender''s postal address is set.' using errcode = 'P0001', hint = 'email_postal';
  end if;
  if setting.from_email = '' or setting.from_name = '' then
    raise exception 'Set the name and the address the message comes from first.' using errcode = 'P0001', hint = 'email_from';
  end if;
  if not exists (select 1 from private.email_audience(campaign, false) a where a.state = 'queued') then
    raise exception 'There is nobody to write to.' using errcode = 'P0001', hint = 'email_nobody';
  end if;
  insert into public.email_recipients (campaign_id, subscriber_id, email, state, reason, done_at)
    select campaign, a.subscriber_id, a.email, a.state, a.reason, case when a.state = 'skipped' then now() end
    from private.email_audience(campaign, false) a
  on conflict on constraint email_recipients_once do nothing;
  update public.email_campaigns c set status = 'sending', by_hand = false, started_by = (select auth.uid()), started_at = now(), updated_at = now() where c.id = campaign;
  perform private.record('email.campaign_started', 'campaign:' || campaign, private.email_progress(campaign) || jsonb_build_object('kind', was.kind, 'subject', was.subject));
  return private.email_progress(campaign);
end;
$$;
revoke all on function public.email_queue(uuid) from public, anon;
grant execute on function public.email_queue(uuid) to authenticated;

-- Take the next batch. Each row is looked at again as it is taken: a person who has left since,
-- an address suppressed since, one no longer confirmed, are left out with the reason. What is
-- handed back is what the website must now send: the address, and its own links. A batch that
-- was taken and never answered for is closed after ten minutes as unsure, and not tried again.
create function public.email_claim(campaign uuid, most integer default 25)
returns table (id bigint, email text, leave_token uuid, confirm_token uuid, claim uuid)
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  was public.email_campaigns;
  need_confirmed boolean;
  this_claim uuid := gen_random_uuid();
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  select * into was from public.email_campaigns c where c.id = campaign for update;
  if was.id is null then
    raise exception 'That message is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
  if was.status <> 'sending' then
    raise exception 'This message is not being sent.' using errcode = 'P0001', hint = 'email_step';
  end if;
  update public.email_recipients r set state = 'failed', unsure = true, reason = 'interrupted', done_at = now()
    where r.campaign_id = campaign and r.state = 'sending' and r.claimed_at < now() - interval '10 minutes';
  need_confirmed := was.kind <> 'confirm' and (select e.write_to from public.email_settings e) <> 'everyone';
  with picked as (
    select r.id from public.email_recipients r
    where r.campaign_id = campaign and r.state = 'queued'
    order by r.id limit least(greatest(coalesce(most, 25), 1), 100)
    for update skip locked
  ), judged as (
    select p.id,
      case when s.id is null then 'left'
           when exists (select 1 from public.email_suppressions x where x.email = s.email) then 'suppressed'
           when was.kind = 'confirm' and s.confirmed_at is not null then 'confirmed'
           when need_confirmed and s.confirmed_at is null then 'unconfirmed'
           else '' end as why
    from picked p
    join public.email_recipients r on r.id = p.id
    left join public.subscribers s on s.id = r.subscriber_id
  )
  update public.email_recipients r
    set state = case when j.why = '' then 'sending' else 'skipped' end,
        reason = j.why,
        batch = case when j.why = '' then this_claim end,
        claimed_at = case when j.why = '' then now() end,
        done_at = case when j.why = '' then null else now() end
    from judged j where r.id = j.id;
  perform private.email_finish(campaign);
  return query
    select r.id, r.email, s.token, s.confirm_token, r.batch
    from public.email_recipients r join public.subscribers s on s.id = r.subscriber_id
    where r.campaign_id = campaign and r.batch = this_claim and r.state = 'sending'
    order by r.id;
end;
$$;
revoke all on function public.email_claim(uuid, integer) from public, anon;
grant execute on function public.email_claim(uuid, integer) to authenticated;

-- How a batch went. `results` is a list of {"id": 12, "ok": true, "ref": "the service's name for
-- it"} or {"id": 13, "ok": false, "why": "what the service said", "unsure": true}. Only rows of
-- that batch that are still taken are written, so a batch cannot be answered for twice.
create function public.email_mark(campaign uuid, claim uuid, results jsonb) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  was public.email_campaigns;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  select * into was from public.email_campaigns c where c.id = campaign for update;
  if was.id is null then
    raise exception 'That message is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
  if results is null or jsonb_typeof(results) <> 'array' then
    raise exception 'That is not how a batch went.' using errcode = '22023', hint = 'invalid';
  end if;
  update public.email_recipients r
    set state = case when x.ok then 'sent' else 'failed' end,
        provider_id = case when x.ok then left(coalesce(x.ref, ''), 200) else '' end,
        reason = case when x.ok then '' else left(coalesce(nullif(btrim(x.why), ''), 'The mail service refused it.'), 300) end,
        unsure = not coalesce(x.ok, false) and coalesce(x.unsure, false),
        done_at = now()
    from jsonb_to_recordset(results) as x (id bigint, ok boolean, ref text, why text, unsure boolean)
    where r.id = x.id and r.campaign_id = campaign and r.batch = email_mark.claim and r.state = 'sending' and x.ok is not null;
  -- An address that was to be asked to confirm, and whose message was plainly refused, counts as
  -- never asked: it may be asked another time.
  if was.kind = 'confirm' then
    update public.subscribers s set confirm_sent_at = null
      from public.email_recipients r
      where r.campaign_id = campaign and r.batch = email_mark.claim and r.state = 'failed' and not r.unsure and s.id = r.subscriber_id and s.confirmed_at is null;
  end if;
  perform private.email_finish(campaign);
  return private.email_progress(campaign);
end;
$$;
revoke all on function public.email_mark(uuid, uuid, jsonb) from public, anon;
grant execute on function public.email_mark(uuid, uuid, jsonb) to authenticated;

-- How a campaign stands, for its page.
create function public.email_progress(campaign uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  return private.email_progress(campaign);
end;
$$;
revoke all on function public.email_progress(uuid) from public, anon;
grant execute on function public.email_progress(uuid) to authenticated;

-- Queue again the addresses the mail service plainly refused. An admin's own decision, never the
-- site's: one whose batch got no plain answer may have had the message, and is left as it is.
create function public.email_retry_failed(campaign uuid) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  was public.email_campaigns;
  again integer;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  select * into was from public.email_campaigns c where c.id = campaign for update;
  if was.id is null then
    raise exception 'That message is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
  if was.by_hand or was.status not in ('sending', 'sent') then
    raise exception 'That message cannot be sent again from where it stands.' using errcode = 'P0001', hint = 'email_step';
  end if;
  update public.email_recipients r set state = 'queued', reason = '', batch = null, claimed_at = null, done_at = null
    where r.campaign_id = campaign and r.state = 'failed' and not r.unsure;
  get diagnostics again = row_count;
  if again > 0 then
    update public.email_campaigns c set status = 'sending', finished_at = null, updated_at = now() where c.id = campaign;
    perform private.record('email.campaign_retry', 'campaign:' || campaign, jsonb_build_object('kind', was.kind, 'subject', was.subject, 'again', again));
  end if;
  return again;
end;
$$;
revoke all on function public.email_retry_failed(uuid) from public, anon;
grant execute on function public.email_retry_failed(uuid) to authenticated;

-- "Mark as sent by hand": the message went out from the owner's own mail program. The addresses
-- it went to are the ones the file held (`email_hand_list`), written into the record as sent, and
-- the ones left out with the reason.
create function public.email_sent_by_hand(campaign uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  was public.email_campaigns;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  select * into was from public.email_campaigns c where c.id = campaign for update;
  if was.id is null then
    raise exception 'That message is not here.' using errcode = 'P0002', hint = 'missing';
  end if;
  if was.status <> 'ready' or was.kind = 'confirm' then
    raise exception 'Only a message that is ready can be marked as sent.' using errcode = 'P0001', hint = 'email_step';
  end if;
  if (select e.postal_address from public.email_settings e) = '' then
    raise exception 'No message may be sent until the sender''s postal address is set.' using errcode = 'P0001', hint = 'email_postal';
  end if;
  if not exists (select 1 from private.email_audience(campaign, true) a where a.state = 'queued') then
    raise exception 'There is nobody to write to.' using errcode = 'P0001', hint = 'email_nobody';
  end if;
  insert into public.email_recipients (campaign_id, subscriber_id, email, state, reason, done_at)
    select campaign, a.subscriber_id, a.email, case when a.state = 'queued' then 'sent' else 'skipped' end, a.reason, now()
    from private.email_audience(campaign, true) a
  on conflict on constraint email_recipients_once do nothing;
  update public.email_campaigns c
    set status = 'sent', by_hand = true, started_by = (select auth.uid()), started_at = now(), finished_at = now(), updated_at = now()
    where c.id = campaign;
  perform private.record('email.campaign_sent_by_hand', 'campaign:' || campaign, private.email_progress(campaign) || jsonb_build_object('kind', was.kind, 'subject', was.subject));
  return private.email_progress(campaign);
end;
$$;
revoke all on function public.email_sent_by_hand(uuid) from public, anon;
grant execute on function public.email_sent_by_hand(uuid) to authenticated;

-- Ask the addresses that joined before to confirm, once. Each address that is unconfirmed, has
-- never been asked and is not suppressed is queued in a campaign of its own kind, and counts as
-- asked from this moment, so pressing again asks nobody twice. The words of the message are the
-- website's own; nobody writes them here.
create function public.email_ask_confirm() returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  setting public.email_settings;
  made uuid;
  asked integer;
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  select * into setting from public.email_settings;
  if setting.postal_address = '' then
    raise exception 'No message may be sent until the sender''s postal address is set.' using errcode = 'P0001', hint = 'email_postal';
  end if;
  if setting.from_email = '' or setting.from_name = '' then
    raise exception 'Set the name and the address the message comes from first.' using errcode = 'P0001', hint = 'email_from';
  end if;
  -- One at a time, so two presses cannot both find the same addresses unasked.
  perform pg_advisory_xact_lock(hashtext('biznes.email.confirm'));
  insert into public.email_campaigns (kind, audience, subject, status, created_by, updated_by, started_by, started_at)
  values ('confirm', 'unconfirmed', 'Confirm your address', 'sending', (select auth.uid()), (select auth.uid()), (select auth.uid()), now())
  returning id into made;
  insert into public.email_recipients (campaign_id, subscriber_id, email)
    select made, s.id, s.email from public.subscribers s
    where s.confirmed_at is null and s.confirm_sent_at is null
      and not exists (select 1 from public.email_suppressions x where x.email = s.email)
    order by s.created_at, s.id;
  get diagnostics asked = row_count;
  if asked = 0 then
    raise exception 'There is nobody to ask: every address has confirmed, has been asked already, or is not written to.' using errcode = 'P0001', hint = 'email_nobody';
  end if;
  update public.subscribers s set confirm_sent_at = now()
    from public.email_recipients r where r.campaign_id = made and s.id = r.subscriber_id;
  perform private.record('email.confirm_asked', 'campaign:' || made, jsonb_build_object('asked', asked));
  return made;
end;
$$;
revoke all on function public.email_ask_confirm() from public, anon;
grant execute on function public.email_ask_confirm() to authenticated;

------------------------------------------------------------------------------------------------
-- 6. What an admin's page counts, in one call: the list, the confirmed, each wish, the addresses
-- not written to, those who could still be asked to confirm, and whether the database holds the
-- hash of the site's word (without it no link to confirm is handed to the website, and nothing a
-- mail service says is believed).
create function public.email_status() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only an admin can do that.' using errcode = '42501', hint = 'forbidden';
  end if;
  return (
    select jsonb_build_object(
      'subscribers', count(*),
      'confirmed', count(*) filter (where s.confirmed_at is not null),
      'guide', count(*) filter (where s.wants_guide),
      'magazine', count(*) filter (where s.wants_magazine),
      'to_ask', count(*) filter (where s.confirmed_at is null and s.confirm_sent_at is null and not exists (select 1 from public.email_suppressions x where x.email = s.email)),
      'suppressed', (select count(*) from public.email_suppressions),
      'proof', exists (select 1 from private.site_proof))
    from public.subscribers s);
end;
$$;
revoke all on function public.email_status() from public, anon;
grant execute on function public.email_status() to authenticated;
