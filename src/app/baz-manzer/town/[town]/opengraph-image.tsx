import { BAZ } from "@/data/site";
import { food } from "@/lib/food";
import { count } from "@/lib/format";
import { index } from "@/lib/index";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Where to eat in a town, on Baz Manzer";

/** The card a town shows when its link is pasted somewhere. */
export default async function Image({ params }: { params: Promise<{ town: string }> }) {
  const { town } = await params;
  const place = index().placeBySlug.get(town);
  if (!place) return ogCard({ kicker: BAZ.name, title: BAZ.line });
  const eats = food().townBySlug.get(town)?.eats ?? 0;
  return ogCard({ kicker: BAZ.name, title: `Where to eat in ${place.name}`, line: `${count(eats)} ${eats === 1 ? "place" : "places"} to eat and drink, by kind of place and by kind of food.` });
}
