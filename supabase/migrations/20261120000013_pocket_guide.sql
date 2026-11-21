-- biznes.mu accounts, part 13: the catalogue follows the one pocket guide.
--
-- Part 10 seeded the catalogue as the site's data stood then, with the guide "Mauritius, place by
-- place". The site now sells one guide, the biznes.mu Pocket Guide, renewed each month
-- (content/pdf/product.json), at the same price. A database made from these files would otherwise
-- start out of step with the site, and a guide that the two disagree about cannot be ordered until
-- the superadmin brings them level at /admin/orders.
--
-- The old guide is switched off, not deleted: an order already placed for it keeps its line.
insert into public.catalogue (id, name, price_mur, per) values
  ('guide:biznes-pocket-guide', 'biznes.mu Pocket Guide', 150, 'each')
on conflict (id) do update
  set name = excluded.name, price_mur = excluded.price_mur, per = excluded.per, active = true, updated_at = now();

update public.catalogue set active = false, updated_at = now()
  where id = 'guide:mauritius-places-to-see' and active;
