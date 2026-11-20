import { PUBLICATIONS } from "@/data/site";
import { OG_SIZE, ogCard } from "@/lib/og";
import { monthName, products } from "@/lib/shop";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "The biznes.mu Pocket Guide";

/** The card the pocket guide shows when its link is pasted somewhere: its name, this month's edition, and its line. */
export default function Image() {
  const guide = products()[0];
  return ogCard({ kicker: guide?.built ? `${monthName(guide.built.edition)} edition` : "Pocket Guide", title: PUBLICATIONS.guide.name, line: guide?.line ?? "Mauritius, place by place, on your phone." });
}
