// The site's own picture-icons: one for each kind of business, each group of the directory, each
// district, each kind of food and each page the menu names. They are drawn for biznes.mu and are
// not from a library. Every one is decoration beside words, so each is hidden from assistive
// technology; the words beside it are what is read.
//
// This file is the one way in for the rest of the site. Until an icon is drawn for a thing, the
// group's own icon stands in for it (src/components/Icons.tsx), so a caller never has to ask
// whether one exists.
import type { SVGProps } from "react";
import { Book, Bookmark, Calc, Calendar, Cart, Fork, GroupIcon, Info, Landmark, List, Person, Phone, Pin, Store } from "./Icons";

type P = SVGProps<SVGSVGElement>;

/** A kind of business, by its id in data/index/categories.json; `group` is the group it sits in. */
export function CategoryIcon({ id: _id, group, ...p }: P & { id?: string; group?: string }) {
  return <GroupIcon group={group} {...p} />;
}

/** A group of the directory, by its id ("eat", "shops", "health" and the rest). */
export function GroupGlyph({ id, ...p }: P & { id?: string }) {
  return <GroupIcon group={id} {...p} />;
}

/** A district, by its slug in data/index/districts.json. */
export function DistrictIcon({ slug: _slug, ...p }: P & { slug?: string }) {
  return <Pin {...p} />;
}

/** A kind of food on Baz Manzer, by its id (src/lib/food.ts). */
export function FoodIcon({ id: _id, ...p }: P & { id?: string }) {
  return <Fork {...p} />;
}

const PAGE_ICONS: Record<string, (p: P) => React.ReactElement> = {
  "/home": (p) => <GroupIcon group="home" {...p} />,
  "/directory": Store,
  "/places": Pin,
  "/baz-manzer": Fork,
  "/emergency": Phone,
  "/holidays": Calendar,
  "/learn": Book,
  "/tools": Calc,
  "/learn/glossary": Book,
  "/official": Landmark,
  "/shop": Book,
  "/pricing": Store,
  "/add": Store,
  "/data": Info,
  "/saved": Bookmark,
  "/cart": Cart,
  "/account": Person,
  "/about": Info,
  "/bot": Info,
  "/privacy": Info,
  "/more": List,
};

/** A page the menu names, by its address (src/data/site.ts). */
export function PageIcon({ href, ...p }: P & { href: string }) {
  const Icon = PAGE_ICONS[href.split("#")[0]] ?? Store;
  return <Icon {...p} />;
}
