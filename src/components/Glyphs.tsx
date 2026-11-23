// The site's own picture-icons: one for each kind of business, each group of the directory, each
// district, each kind of food and each page the menu names. They are drawn for biznes.mu and are
// not from a library. Every one is decoration beside words, so each is hidden from assistive
// technology; the words beside it are what is read.
//
// This file is the one way in for the rest of the site. The drawings are data, in
// src/components/glyphs; the districts are cut from the island's own outline by
// scripts/district-icons.mjs. A thing with no drawing of its own takes the nearest that is true
// of it (a kind of business takes its group's), so a caller never has to ask whether one exists.
//
// Every icon has one solid point (DESIGN.md, "Icons"). It is the icon's own colour unless the icon
// is given `lit`, or something around it sets `--glyph-point`: then the point is the signal colour
// inside a ring of the icon's colour. Use it where the icon is ink on a light ground, never on an
// ink tile, where the icon is saffron already.
import { DISTRICT_SHAPES, ISLANDS } from "../data/district-shapes";
import { CATEGORIES, CUTLERY, GROUPS, SHOP } from "./glyphs/directory";
import { Frame, Glyph, POINT, Point, RING, type Drawing, type GlyphProps } from "./glyphs/draw";
import { FOODS } from "./glyphs/food";
import { LENS, PAGES } from "./glyphs/pages";

export type { GlyphProps } from "./glyphs/draw";

/** The drawing kept under a name, if there is one. Never a thing inherited from Object. */
const find = <T,>(set: Record<string, T>, name: string | undefined | null): T | undefined => (typeof name === "string" && Object.hasOwn(set, name) ? set[name] : undefined);

/** A kind of business, by its id in data/index/categories.json; `group` is the group it sits in. */
export function CategoryIcon({ id, group, ...p }: GlyphProps & { id?: string; group?: string }) {
  return <Glyph drawing={find(CATEGORIES, id) ?? find(GROUPS, group) ?? SHOP} {...p} />;
}

/** A group of the directory, by its id ("eat", "shops", "health" and the rest). */
export function GroupGlyph({ id, ...p }: GlyphProps & { id?: string }) {
  return <Glyph drawing={find(GROUPS, id) ?? SHOP} {...p} />;
}

/**
 * A district, by its slug in data/index/districts.json: the island in line, with the district
 * filled. Rodrigues is its own island, filled whole. Port Louis is too small to see as a shape, so
 * it is the point itself. A slug that is not a district draws Mauritius with a point at its middle.
 */
export function DistrictIcon({ slug, ...p }: GlyphProps & { slug?: string }) {
  const shape = find(DISTRICT_SHAPES, slug);
  return (
    <Frame {...p}>
      {shape && !shape.point ? <path d={shape.part} fill={POINT} strokeWidth={RING} /> : null}
      <path d={ISLANDS[shape?.island ?? "mauritius"]} />
      {shape?.point ? <Point x={shape.x} y={shape.y} /> : null}
      {shape ? null : <Point x={12} y={12} />}
    </Frame>
  );
}

/** A kind of food on Baz Manzer, by its id (src/lib/food.ts). One with no drawing takes the fork and knife. */
export function FoodIcon({ id, ...p }: GlyphProps & { id?: string }) {
  return <Glyph drawing={find(FOODS, id) ?? CUTLERY} {...p} />;
}

/** The drawing for an address: its own, else that of the page above it, else the lens. */
function pageDrawing(href: string | undefined): Drawing {
  let path = String(href ?? "").split("?")[0];
  const whole = find(PAGES, path);
  if (whole) return whole;
  path = path.split("#")[0].replace(/\/+$/, "") || "/";
  while (path.length > 1) {
    const found = find(PAGES, path);
    if (found) return found;
    path = path.slice(0, path.lastIndexOf("/"));
  }
  return find(PAGES, path) ?? LENS;
}

/** A page the menu names, by its address (src/data/site.ts). A page under one of them takes its icon. */
export function PageIcon({ href, ...p }: GlyphProps & { href: string }) {
  return <Glyph drawing={pageDrawing(href)} {...p} />;
}
