import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Bits";
import ListingList from "@/components/ListingList";
import { count } from "@/lib/format";
import { index, listingsIn } from "@/lib/index";

type Props = { params: Promise<{ cat: string; place: string }>; searchParams: Promise<{ page?: string; phone?: string; web?: string }> };


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cat, place } = await params;
  const data = index();
  const c = data.categoryById.get(cat);
  const p = data.placeBySlug.get(place);
  if (!c || !p) return {};
  const n = listingsIn({ cat, place }).length;
  return { title: `${c.label} in ${p.name}`, description: `${count(n)} ${c.label.toLowerCase()} listed in ${p.name}, Mauritius, with addresses, telephone numbers and opening hours where known.`, alternates: { canonical: `/directory/${c.id}/${p.slug}` } };
}

export default async function CategoryPlacePage({ params, searchParams }: Props) {
  const { cat, place } = await params;
  const data = index();
  const c = data.categoryById.get(cat);
  const p = data.placeBySlug.get(place);
  if (!c || !p) notFound();
  const listings = listingsIn({ cat, place });
  if (!listings.length) notFound();

  // What else this town has, most first.
  const others = new Map<string, number>();
  for (const l of listingsIn({ place })) if (l.cat !== cat) others.set(l.cat, (others.get(l.cat) ?? 0) + 1);
  const narrow = [...others]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, n]) => ({ href: `/directory/${id}/${p.slug}`, label: data.categoryById.get(id)?.label ?? id, n }));

  return (
    <>
      <PageHead
        path={[{ href: "/directory", label: "Directory" }, { href: `/directory/${c.id}`, label: c.label }, { label: p.name }]}
        title={`${c.label} in ${p.name}`}
        lede={`${count(listings.length)} listed in ${p.name}${p.district && p.district !== p.name ? `, ${p.district} district` : ""}.`}
      />
      <ListingList listings={listings} path={`/directory/${c.id}/${p.slug}`} params={await searchParams} narrow={narrow} narrowLabel={`Also in ${p.name}`} says={`A chart of Mauritius with the ${count(listings.length)} ${c.label.toLowerCase()} listed in ${p.name} lit.`} />
    </>
  );
}
