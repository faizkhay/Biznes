import { SHELVES } from "@/data/site";
import { index } from "@/lib/index";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "An article on biznes.mu";

/** The card an article shows when its link is pasted somewhere: its shelf and its own title. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const g = index().guideBySlug.get((await params).slug);
  if (!g) return ogCard({ kicker: "Article", title: "Articles about Mauritius" });
  return ogCard({ kicker: SHELVES.find((shelf) => shelf.id === (g.shelf ?? "business"))?.label ?? "Article", title: g.title });
}
