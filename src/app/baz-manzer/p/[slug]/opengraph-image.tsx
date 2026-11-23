import { owned } from "@/lib/accounts/owned";
import { index, listingFromSlug, whereOf } from "@/lib/index";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A place to eat on Baz Manzer";

/** The card a place to eat shows when its address inside Baz Manzer is pasted somewhere: what it is, where, and its name. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { categoryById, placeBySlug } = index();
  const l = listingFromSlug(slug);
  if (l) {
    const where = whereOf(l);
    return ogCard({ kicker: categoryById.get(l.cat)?.one ?? "Place to eat", title: l.name, line: where ? `${where}, Mauritius` : "Mauritius" });
  }
  const o = (await owned()).bySlug.get(slug);
  if (!o) return ogCard({ kicker: "Baz Manzer", title: "Where to eat in Mauritius" });
  const town = placeBySlug.get(o.town);
  return ogCard({ kicker: categoryById.get(o.category)?.one ?? "Place to eat", title: o.name, line: town ? `${town.name}, Mauritius` : "Mauritius" });
}
