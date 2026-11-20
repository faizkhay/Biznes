import { count } from "@/lib/format";
import { index } from "@/lib/index";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A town of Mauritius on biznes.mu";

/** The card a town shows when its link is pasted somewhere: its name, and how many are listed there. */
export default async function Image({ params }: { params: Promise<{ place: string }> }) {
  const p = index().placeBySlug.get((await params).place);
  if (!p) return ogCard({ kicker: "Places", title: "Towns and villages of Mauritius" });
  return ogCard({ kicker: p.kind === "area" ? "Neighbourhood" : "Town", title: `Businesses in ${p.name}`, line: `${count(p.n)} businesses and services listed${p.district && p.district !== p.name ? `, ${p.district} district` : ""}.` });
}
