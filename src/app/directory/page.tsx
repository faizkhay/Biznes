import type { Metadata } from "next";
import { IndexItem, PageHead } from "@/components/Bits";
import { count } from "@/lib/format";
import { index } from "@/lib/index";

export const metadata: Metadata = {
  title: "Business directory",
  description: "Every kind of business and service listed in Mauritius, by category: shops, restaurants, hotels, health, banks, garages, trades, offices and public services.",
  alternates: { canonical: "/directory" },
};

export default function DirectoryPage() {
  const { groups, categories, meta } = index();
  return (
    <>
      <PageHead title="The directory" lede={`${count(meta.listings.all)} businesses and services in ${count(categories.length)} categories. Choose a category, then narrow it to a town.`} />
      <div className="shell">
        {groups.map((g) => (
          <section key={g.id} aria-labelledby={`g-${g.id}`} className="grid gap-x-12 gap-y-4 border-t border-line py-10 md:grid-cols-12">
            <h2 id={`g-${g.id}`} className="heading-2 md:col-span-4">
              {g.label}
              <span className="data-2 mt-2 block text-ink-faint">{count(g.n)} listed</span>
            </h2>
            <div className="index-cols md:col-span-8 lg:columns-2">
              {categories
                .filter((c) => c.group === g.id)
                .sort((a, b) => b.n - a.n)
                .map((c) => (
                  <IndexItem key={c.id} href={`/directory/${c.id}`} label={c.label} n={c.n} />
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
