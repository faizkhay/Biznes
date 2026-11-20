import { count } from "@/lib/format";
import { index, listingsIn } from "@/lib/index";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A category of the biznes.mu directory, in one town";

/** The card a category in a town shows when its link is pasted somewhere. */
export default async function Image({ params }: { params: Promise<{ cat: string; place: string }> }) {
  const { cat, place } = await params;
  const data = index();
  const c = data.categoryById.get(cat);
  const p = data.placeBySlug.get(place);
  if (!c || !p) return ogCard({ kicker: "Directory", title: "Businesses and services in Mauritius" });
  return ogCard({ kicker: "Directory", title: `${c.label} in ${p.name}`, line: `${count(listingsIn({ cat, place }).length)} listed in ${p.name}, Mauritius.` });
}
