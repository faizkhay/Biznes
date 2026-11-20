-- biznes.mu accounts, part 9: pictures. Where they are kept, who may put them there, and how the
-- superadmin chooses the picture behind the page.
--
-- Every picture an owner or the superadmin uploads goes to one bucket of Supabase Storage,
-- `media`. Anyone may look at what is in it: these are pictures for public pages. Only three
-- kinds of path can be written, each by its own people:
--
--   business/<business id>/<file>   the owner of a live or pending business on a paid plan
--   ads/<advertisement id>/<file>   the owner of that advertisement, while it is a draft or declined
--   site/<file>                     the superadmin: pictures for behind the page
--
-- Pictures only (JPEG, PNG, WebP), three megabytes each at most: the bucket itself refuses
-- anything else, whoever sends it. The website uploads as the person signed in, with their own
-- session, so these rules are the ones that hold. There is no service key.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- True for a path the person asking may keep a picture at. `adding` also counts what is already
-- there, so a folder cannot be filled without end.
create function private.may_keep_media(path text, adding boolean) returns boolean
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
  if adding and (select count(*) from storage.objects o where o.bucket_id = 'media' and left(o.name, char_length(folder)) = folder) >= most then
    return false;
  end if;
  return true;
end;
$$;
revoke all on function private.may_keep_media(text, boolean) from public;
grant execute on function private.may_keep_media(text, boolean) to authenticated;

create policy "biznes media: add your own pictures" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and private.may_keep_media(name, true));

create policy "biznes media: see your own pictures" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (private.may_keep_media(name, false) or (select private.is_admin())));

create policy "biznes media: remove your own pictures" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and private.may_keep_media(name, false));

-- The pictures the superadmin has uploaded for behind the page, beside the ones the site is built
-- with (src/data/themes.ts).
create table public.site_pictures (
  id uuid primary key default gen_random_uuid(),
  path text not null unique check (path ~ '^site/[a-z0-9-]{1,64}\.(jpg|png|webp)$'),
  label text not null check (char_length(btrim(label)) between 1 and 60),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
comment on table public.site_pictures is 'Pictures the superadmin has uploaded for behind the page. The file is in the media bucket at `path`.';

create function private.site_pictures_before_insert() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.label := btrim(new.label);
  new.created_by := (select auth.uid());
  new.created_at := now();
  return new;
end;
$$;
revoke all on function private.site_pictures_before_insert() from public;

create trigger site_pictures_10_before_insert
  before insert on public.site_pictures
  for each row execute function private.site_pictures_before_insert();

create function private.site_pictures_audit() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.record(case when tg_op = 'INSERT' then 'picture.added' else 'picture.removed' end, 'site_picture:' || coalesce(new.id, old.id), jsonb_build_object('label', coalesce(new.label, old.label)));
  return null;
end;
$$;
revoke all on function private.site_pictures_audit() from public;

create trigger site_pictures_90_audit
  after insert or delete on public.site_pictures
  for each row execute function private.site_pictures_audit();

alter table public.site_pictures enable row level security;
revoke all on table public.site_pictures from anon, authenticated;
grant select (id, path, label, created_at) on table public.site_pictures to anon;
grant select on table public.site_pictures to authenticated;
grant insert (path, label) on table public.site_pictures to authenticated;
grant delete on table public.site_pictures to authenticated;

create policy site_pictures_read on public.site_pictures
  for select to anon, authenticated
  using (true);

create policy site_pictures_insert on public.site_pictures
  for insert to authenticated
  with check ((select private.is_superadmin()));

create policy site_pictures_delete on public.site_pictures
  for delete to authenticated
  using ((select private.is_superadmin()));

-- How the picture behind the page is chosen: by the calendar, as it always was; one picture,
-- fixed; or a round of chosen pictures, a new one each day. `picture` is the fixed one and
-- `pictures` the round. Each names a picture the site is built with, by its id in
-- src/data/themes.ts, or one that was uploaded, by its id in site_pictures.
alter table public.site_settings
  add column mode text not null default 'calendar' check (mode in ('calendar', 'fixed', 'rotation')),
  add column pictures text[] not null default '{}' check (cardinality(pictures) <= 30);

-- A picture chosen before there was a choice of how was a fixed one.
update public.site_settings set mode = 'fixed' where picture is not null;

grant select (mode, pictures) on table public.site_settings to anon;
grant update (mode, pictures) on table public.site_settings to authenticated;
