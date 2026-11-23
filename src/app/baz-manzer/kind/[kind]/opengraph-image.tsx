import { BAZ } from "@/data/site";
import { food } from "@/lib/food";
import { count } from "@/lib/format";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A kind of place to eat on Baz Manzer";

/** The card a kind of place shows when its link is pasted somewhere. */
export default async function Image({ params }: { params: Promise<{ kind: string }> }) {
  const { typeById, listings } = food();
  const type = typeById.get((await params).kind);
  if (!type) return ogCard({ kicker: BAZ.name, title: BAZ.line });
  return ogCard({ kicker: BAZ.name, title: `${type.label} in Mauritius`, line: `${count(listings.filter((l) => l.cat === type.id).length)} listed, by town and by kind of food.` });
}
