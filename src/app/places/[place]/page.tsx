import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Bits";
import ListingList from "@/components/ListingList";
import { count } from "@/lib/format";
import { index, listingsIn } from "@/lib/index";

type Props = { params: Promise<{ place: string }>; searchParams: Promise<{ page?: string; phone?: string; web?: string }> };


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = index().placeBySlug.get((await params).place);
  if (!p) return {};
  return { title: `Businesses in ${p.name}`, description: `${count(p.n)} businesses and services listed in ${p.name}, Mauritius: shops, restaurants, health, banks, garages and more.`, alternates: { canonical: `/places/${p.slug}` } };
}

export default async function PlacePage({ params, searchParams }: Props) {
  const data = index();
  const p = data.placeBySlug.get((await params).place);
  if (!p) notFound();
  const listings = listingsIn({ place: p.slug });

  const cats = new Map<string, number>();
  for (const l of listings) cats.set(l.cat, (cats.get(l.cat) ?? 0) + 1);
  const narrow = [...cats]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([id, n]) => ({ href: `/directory/${id}/${p.slug}`, label: data.categoryById.get(id)?.label ?? id, n }));

  return (
    <>
      <PageHead
        path={[{ href: "/places", label: "Places" }, { label: p.name }]}
        title={`Businesses in ${p.name}`}
        lede={`${count(listings.length)} listed${p.district && p.district !== p.name ? ` in ${p.name}, ${p.district} district` : ""}${p.kind === "area" ? `. A neighbourhood${p.within && data.placeBySlug.get(p.within) ? ` of ${data.placeBySlug.get(p.within)!.name}` : ""}, as named on the map` : ""}.`}
      />
      <ListingList listings={listings} path={`/places/${p.slug}`} params={await searchParams} narrow={narrow} narrowLabel="Narrow to a kind of business" says={`A chart of Mauritius with the ${count(listings.length)} listings in ${p.name} lit.`} />
    </>
  );
}
