import { BAZ } from "@/data/site";
import { food } from "@/lib/food";
import { count } from "@/lib/format";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Baz Manzer: where to eat in Mauritius";

/** The card Baz Manzer shows when its link is pasted somewhere. */
export default function Image() {
  return ogCard({ kicker: BAZ.kicker, title: BAZ.name, line: `${BAZ.line}: ${count(food().listings.length)} places, by kind of food and by town.` });
}
