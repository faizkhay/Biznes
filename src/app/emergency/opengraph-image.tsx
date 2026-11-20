import { emergency } from "@/lib/emergency";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Emergency numbers in Mauritius";

/** The card the emergency numbers show when their link is pasted somewhere: the first of them, as the official pages give them. */
export default function Image() {
  const first = emergency()?.groups[0]?.items ?? [];
  return ogCard({ kicker: "Who to call", title: "Emergency numbers in Mauritius", line: first.length ? `${first.map((i) => `${i.name} ${i.number}`).join(". ")}.` : "Each number from an official page." });
}
