import type { Business } from "@/data/businesses";
import Tag from "./Tag";

/**
 * The rail: every business hanging in a row, each on its own string. This is the site's organising
 * image, so it is the first thing on the home page. On a phone the tags hang two to a rail.
 */
export default function Rail({ businesses, label }: { businesses: Business[]; label: string }) {
  return (
    <ul aria-label={label} className="rail-hang grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {businesses.map((b, i) => (
        <Tag key={b.slug} business={b} index={i} />
      ))}
    </ul>
  );
}
