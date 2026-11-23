import { HOME } from "@/data/site";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = HOME.title;

/** The card the Home page shows when its link is pasted somewhere: its name, and what it sets out. */
export default function Image() {
  return ogCard({ kicker: HOME.label, title: HOME.card, line: HOME.lede });
}
