import { count } from "@/lib/format";
import { index } from "@/lib/index";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A category of the biznes.mu directory";

/** The card a category shows when its link is pasted somewhere: its name, and how many it holds. */
export default async function Image({ params }: { params: Promise<{ cat: string }> }) {
  const c = index().categoryById.get((await params).cat);
  if (!c) return ogCard({ kicker: "Directory", title: "Businesses and services in Mauritius" });
  return ogCard({ kicker: "Directory", title: `${c.label} in Mauritius`, line: `${count(c.n)} listed across the island, with addresses and telephone numbers where known.` });
}
