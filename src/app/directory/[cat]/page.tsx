import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Bits";
import ListingList from "@/components/ListingList";
import { count } from "@/lib/format";
import { index, listingsIn } from "@/lib/index";
import { PAGE_SIZE } from "@/lib/search";

type Props = { params: Promise<{ cat: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = index().categoryById.get((await params).cat);
  if (!c) return {};
  return { title: `${c.label} in Mauritius`, description: `${count(c.n)} ${c.label.toLowerCase()} listed across Mauritius and Rodrigues, with addresses, telephone numbers and opening hours where known.`, alternates: { canonical: `/directory/${c.id}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const data = index();
  const c = data.categoryById.get((await params).cat);
  if (!c) notFound();
  const listings = listingsIn({ cat: c.id });
  const page = Math.min(Math.max(1, Number((await searchParams).page) || 1), Math.max(1, Math.ceil(listings.length / PAGE_SIZE)));

  // The towns that have the most of this category: the ways to narrow the list.
  const byPlace = new Map<string, number>();
  for (const l of listings) if (l.placeSlug) byPlace.set(l.placeSlug, (byPlace.get(l.placeSlug) ?? 0) + 1);
  const narrow = [...byPlace]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([slug, n]) => ({ href: `/directory/${c.id}/${slug}`, label: data.placeBySlug.get(slug)?.name ?? slug, n }));

  return (
    <>
      <PageHead
        path={[{ href: "/directory", label: "Directory" }, { label: c.label }]}
        title={`${c.label} in Mauritius`}
        lede={`${count(listings.length)} listed. The fullest listings come first.`}
      />
      <ListingList listings={listings} page={page} href={(n) => `/directory/${c.id}${n > 1 ? `?page=${n}` : ""}`} narrow={narrow} narrowLabel="Narrow to a town" says={`A chart of Mauritius with the ${count(listings.length)} ${c.label.toLowerCase()} listed lit.`} />
    </>
  );
}
