-- biznes.mu accounts, part 12: a request for a booking asks for the website's word too.
--
-- Part 11 put joining the list, leaving it and placing an order behind a proof that the call came
-- through the website (`private.from_site()`). A request for a booking is open to a visitor in the
-- same way, and a business takes forty an hour: anyone holding the public key could spend those
-- forty from outside and so close a business's bookings to its customers. A booking sent through
-- the API is now refused without the word, as the other three are.
--
-- The check is made in the trigger that already counts a business's bookings, which runs as its
-- owner. So who is asking is read from the role the API set for the request, not from
-- `current_user`, which inside such a function is the owner. A row written by hand in the SQL
-- editor, with no role set, is not asked for the word.
--
-- As in part 11, nothing is asked for until a hash is kept in `private.site_proof`.
create or replace function private.bookings_limits() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if coalesce(current_setting('role', true), '') in ('anon', 'authenticated') and not private.from_site() then
    raise exception 'Ask for a booking from the business''s page on the website.' using errcode = '42501', hint = 'forbidden';
  end if;
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
