import { PLANS } from "@/data/site";
import { count } from "@/lib/format";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "List your business on biznes.mu";

/** The card the plans show when their link is pasted somewhere: the three plans and their prices. */
export default function Image() {
  return ogCard({ kicker: "For business", title: "List your business", line: PLANS.map((plan) => `${plan.name}${plan.price ? ` Rs ${count(plan.price)}` : " free"}`).join(". ") + " a month." });
}
