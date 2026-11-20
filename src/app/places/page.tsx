import type { Metadata } from "next";
import { IndexItem, PageHead } from "@/components/Bits";
import { count } from "@/lib/format";
import { index } from "@/lib/index";

export const metadata: Metadata = {
  title: "Towns and villages",
  description: "Businesses and services in Mauritius by town and village, district by district, and in Rodrigues.",
  alternates: { canonical: "/places" },
};

export default function PlacesPage() {
  const { places, districts } = index();
  const elsewhere = places.filter((p) => !p.district);
  return (
    <>
      <PageHead title="Towns and villages" lede={`${count(places.length)} places with something listed, district by district. A town is its council area as the map draws it; a neighbourhood is listed where it has eight listings or more.`} />
      <div className="shell">
        {districts
          .filter((d) => d.n > 0)
          .sort((a, b) => b.n - a.n)
          .map((d) => (
            <section key={d.slug} aria-labelledby={`d-${d.slug}`} className="grid gap-x-12 gap-y-4 border-t border-line py-10 md:grid-cols-12">
              <h2 id={`d-${d.slug}`} className="heading-2 md:col-span-4">
                {d.name}
                <span className="data-2 mt-2 block text-ink-faint">{count(d.n)} listed</span>
              </h2>
              <div className="index-cols md:col-span-8 lg:columns-2">
                {places
                  .filter((p) => p.district === d.name)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p) => (
                    <IndexItem key={p.slug} href={`/places/${p.slug}`} label={p.name} n={p.n} />
                  ))}
              </div>
            </section>
          ))}
        {elsewhere.length > 0 && (
          <section aria-labelledby="d-else" className="grid gap-x-12 gap-y-4 border-t border-line py-10 md:grid-cols-12">
            <h2 id="d-else" className="heading-2 md:col-span-4">
              Elsewhere
            </h2>
            <div className="index-cols md:col-span-8 lg:columns-2">
              {elsewhere.map((p) => (
                <IndexItem key={p.slug} href={`/places/${p.slug}`} label={p.name} n={p.n} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
