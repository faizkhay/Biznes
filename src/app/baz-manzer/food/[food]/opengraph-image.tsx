import { BAZ } from "@/data/site";
import { food } from "@/lib/food";
import { count } from "@/lib/format";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A kind of food on Baz Manzer";

/** The card a kind of food shows when its link is pasted somewhere. */
export default async function Image({ params }: { params: Promise<{ food: string }> }) {
  const cuisine = food().cuisineById.get((await params).food);
  if (!cuisine) return ogCard({ kicker: BAZ.name, title: BAZ.line });
  return ogCard({ kicker: `${BAZ.name}: kind of food`, title: cuisine.label, line: `${count(cuisine.n)} ${cuisine.n === 1 ? "place" : "places"} to eat in Mauritius, by kind of place and by town.` });
}
