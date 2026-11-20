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
  const { places, districts, meta, placeBySlug } = index();
  const towns = places.filter((p) => p.kind === "town");
  const areas = places.filter((p) => p.kind === "area");
  const elsewhere = towns.filter((p) => !p.district);
  return (
    <>
      <PageHead
        title="Towns and villages"
        lede={`${count(meta.towns)} towns and villages with something listed, district by district, and ${count(areas.length)} neighbourhoods within them. A town is its council area as the map draws it; a neighbourhood is listed where it has eight listings or more, and its listings are counted in its town's too.`}
      />
      <div className="shell">
        {districts
          .filter((d) => d.n > 0)
          .sort((a, b) => b.n - a.n)
          .map((d) => {
            const within = areas.filter((p) => p.district === d.name).sort((a, b) => a.name.localeCompare(b.name));
            return (
              <section key={d.slug} aria-labelledby={`d-${d.slug}`} className="grid gap-x-12 gap-y-4 border-t border-line py-10 md:grid-cols-12">
                <h2 id={`d-${d.slug}`} className="heading-2 md:col-span-4">
                  {d.name}
                  <span className="caption-1 mt-2 block font-sans text-ink-faint">District. {count(d.n)} listed</span>
                </h2>
                <div className="md:col-span-8">
                  <div className="index-cols lg:columns-2">
                    {towns
                      .filter((p) => p.district === d.name)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => (
                        <IndexItem key={p.slug} href={`/places/${p.slug}`} label={p.name} n={p.n} />
                      ))}
                  </div>
                  {within.length > 0 && (
                    <>
                      <h3 className="label-1 mt-8 text-ink-faint">Neighbourhoods</h3>
                      <div className="index-cols lg:columns-2">
                        {within.map((p) => {
                          const town = p.within ? placeBySlug.get(p.within)?.name : undefined;
                          return <IndexItem key={p.slug} href={`/places/${p.slug}`} label={town && town !== p.name ? `${p.name}, ${town}` : p.name} n={p.n} />;
                        })}
                      </div>
                    </>
                  )}
                </div>
              </section>
            );
          })}
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
