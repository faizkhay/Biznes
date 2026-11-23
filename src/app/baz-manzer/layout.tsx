import type { Metadata, Viewport } from "next";
import { BAZ } from "@/data/site";
import { baz, BAZ_COLOURS } from "@/lib/baz";

// Baz Manzer is a section that stands by itself and installs as an app of its own, beside the
// whole of biznes.mu. So every page beneath this layout names the section's manifest and no
// other, carries the section's name for an iPhone's home screen, and takes the awning's colour
// for the bar at the top of a phone. Its icon in a browser's tab and its touch icon are the two
// files beside this one (icon.svg, apple-icon.png), drawn by scripts/icons.mjs: Next names them
// in the head of every page of the section in place of the site's.
export const metadata: Metadata = {
  manifest: baz.manifest,
  applicationName: BAZ.name,
  appleWebApp: { capable: true, title: BAZ.name, statusBarStyle: "default" },
  // A page beneath the section is named as one of its own: "Restaurants in Mauritius · Baz Manzer".
  title: { default: `${BAZ.name}: ${BAZ.line.toLowerCase()}`, template: `%s · ${BAZ.name}` },
};

export const viewport: Viewport = { themeColor: BAZ_COLOURS.theme, colorScheme: "light", viewportFit: "cover" };

export default function BazLayout({ children }: { children: React.ReactNode }) {
  return children;
}
