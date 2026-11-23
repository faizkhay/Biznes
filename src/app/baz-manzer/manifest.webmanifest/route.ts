import type { MetadataRoute } from "next";
import { BAZ } from "@/data/site";
import { baz, BAZ_COLOURS } from "@/lib/baz";
import { food } from "@/lib/food";

// What a phone or a computer needs to keep Baz Manzer as an app of its own, beside the whole of
// biznes.mu and not instead of it: its own id, so the two are never taken for one; its own name;
// a first page and a scope inside the section, so the app never leaves it; its own colours and its
// own icons. Next serves a manifest file only from the root of the site (src/app/manifest.ts), so
// this one is a route, made once when the site is built. The layout beside it names it in the
// head of every page of the section. The icons are drawn by scripts/icons.mjs.
export const dynamic = "force-static";

const icon = (name: string, size: number, purpose: "any" | "maskable") => ({ src: `/icons/${name}-${size}.png`, sizes: `${size}x${size}`, type: "image/png", purpose });

export function GET() {
  const { types } = food();
  const [, , towns] = BAZ.ways;
  // What the icon can open directly, by a long press on a phone or a right click on a desk: the
  // kinds of place, as the index counts them, with the towns among the first four, which is as
  // many as some phones show.
  const kinds = types.map((c) => ({ name: c.label, url: baz.kind(c.id) }));
  const shortcuts = [...kinds.slice(0, 3), { name: towns.label, description: towns.line, url: towns.href }, ...kinds.slice(3)];
  const manifest: MetadataRoute.Manifest = {
    id: baz.home,
    name: BAZ.name,
    short_name: BAZ.name,
    description: BAZ.app.description,
    start_url: baz.home,
    // Next writes its addresses with no stroke at the end, so the scope is the first page's own
    // address: it holds that page and everything beneath it.
    scope: baz.home,
    display: "standalone",
    background_color: BAZ_COLOURS.paper,
    theme_color: BAZ_COLOURS.theme,
    lang: "en",
    dir: "ltr",
    categories: ["food", "navigation", "travel"],
    icons: [icon("baz", 192, "any"), icon("baz", 512, "any"), icon("baz-maskable", 192, "maskable"), icon("baz-maskable", 512, "maskable")],
    shortcuts: shortcuts.map((shortcut) => ({ ...shortcut, icons: [icon("baz", 192, "any")] })),
  };
  return new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/manifest+json; charset=utf-8" } });
}
