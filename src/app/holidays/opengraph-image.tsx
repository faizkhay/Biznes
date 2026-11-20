import { holidays, longDay } from "@/lib/holidays";
import { OG_SIZE, ogCard } from "@/lib/og";
import { todayInMauritius } from "@/lib/theme";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Public holidays in Mauritius";
// The next holiday changes with the day, so the card is drawn again at most once an hour.
export const revalidate = 3600;

/** The card the public holidays show when their link is pasted somewhere: the years they cover, and the next one. */
export default function Image() {
  const data = holidays();
  const today = todayInMauritius();
  const next = Object.values(data?.years ?? {})
    .flat()
    .sort((a, b) => a.date.localeCompare(b.date))
    .find((h) => h.date >= today);
  return ogCard({ kicker: Object.keys(data?.years ?? {}).sort().join(" and ") || "Calendar", title: "Public holidays in Mauritius", line: next ? `Next: ${next.name}, ${longDay(next.date)}.` : "Every date, with the day of the week it falls on." });
}
