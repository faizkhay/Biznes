import { index, listingFromSlug, whereOf } from "@/lib/index";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A business on biznes.mu";

/** The card a business shows when its link is pasted somewhere: what it is, where, and its name. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const l = listingFromSlug((await params).slug);
  if (!l) return ogCard({ kicker: "Directory", title: "Businesses and services in Mauritius" });
  const category = index().categoryById.get(l.cat);
  const where = whereOf(l);
  return ogCard({ kicker: category?.one ?? "Business", title: l.name, line: where ? `${where}, Mauritius` : "Mauritius" });
}
