import { owned } from "@/lib/accounts/owned";
import { index } from "@/lib/index";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A business on biznes.mu";

/** The card a business its owner listed shows when its link is pasted somewhere: what it is, where, and its name. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const b = (await owned()).bySlug.get((await params).slug);
  if (!b) return ogCard({ kicker: "Directory", title: "Businesses and services in Mauritius" });
  const { categoryById, placeBySlug } = index();
  const town = placeBySlug.get(b.town)?.name;
  return ogCard({ kicker: categoryById.get(b.category)?.one ?? "Business", title: b.name, line: town ? `${town}, Mauritius` : "Mauritius" });
}
