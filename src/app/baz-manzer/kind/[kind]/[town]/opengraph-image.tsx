import { BAZ } from "@/data/site";
import { food, inTown } from "@/lib/food";
import { count } from "@/lib/format";
import { index } from "@/lib/index";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A kind of place to eat in a town, on Baz Manzer";

/** The card a kind of place in a town shows when its link is pasted somewhere. */
export default async function Image({ params }: { params: Promise<{ kind: string; town: string }> }) {
  const { kind, town } = await params;
  const { typeById, listings } = food();
  const type = typeById.get(kind);
  const place = index().placeBySlug.get(town);
  if (!type || !place) return ogCard({ kicker: BAZ.name, title: BAZ.line });
  return ogCard({ kicker: BAZ.name, title: `${type.label} in ${place.name}`, line: `${count(listings.filter((l) => l.cat === type.id && inTown(l, place.slug)).length)} listed, with numbers and hours where known.` });
}
