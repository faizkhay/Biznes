import type { MetadataRoute } from "next";
import { site } from "@/data/site";

// What a phone or a computer needs to keep biznes.mu as an app: its name, its colours, its icons
// and the pages it can open straight from the icon. Next serves this as /manifest.webmanifest and
// links it from every page. The icons are drawn from the site's mark by scripts/icons.mjs.
const PAPER = "#fdf9ec"; // --palette-cream, the same value as the theme colour in layout.tsx

const icon = (name: string, size: number, purpose: "any" | "maskable") => ({ src: `/icons/${name}-${size}.png`, sizes: `${size}x${size}`, type: "image/png", purpose });

/**
 * The pages the icon can open directly, by a long press on a phone or a right click on a desk.
 * Some phones show only the first four, so the shortlist, which is one visitor's own, is last.
 * Baz Manzer is not among them: it is an app of its own (src/app/baz-manzer/manifest.webmanifest).
 */
const SHORTCUTS = [
  { name: "Search", url: "/search" },
  { name: "Home", url: "/home" },
  { name: "Directory", url: "/directory" },
  { name: "Emergency numbers", url: "/emergency" },
  { name: "Saved", url: "/saved" },
];

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: site.name,
    short_name: "biznes",
    description: site.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: PAPER,
    theme_color: PAPER,
    lang: "en",
    dir: "ltr",
    categories: ["business", "navigation", "travel"],
    icons: [icon("icon", 192, "any"), icon("icon", 512, "any"), icon("icon-maskable", 192, "maskable"), icon("icon-maskable", 512, "maskable")],
    shortcuts: SHORTCUTS.map((shortcut) => ({ ...shortcut, icons: [icon("icon", 192, "any")] })),
  };
}
