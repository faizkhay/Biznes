import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Bits";
import ListingList from "@/components/ListingList";
import { count } from "@/lib/format";
import { index, listingsIn } from "@/lib/index";
import { pageMeta } from "@/lib/meta";

type Props = { params: Promise<{ cat: string }>; searchParams: Promise<{ page?: string; phone?: string; web?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = index().categoryById.get((await params).cat);
  if (!c) return {};
  return pageMeta({ title: `${c.label} in Mauritius`, description: `${count(c.n)} ${c.label.toLowerCase()} listed across Mauritius and Rodrigues, with addresses, telephone numbers and opening hours where known.`, path: `/directory/${c.id}`, drawn: true });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const data = index();
  const c = data.categoryById.get((await params).cat);
  if (!c) notFound();
  const listings = listingsIn({ cat: c.id });

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
        here={`/directory/${c.id}`}
        path={[{ href: "/directory", label: "Directory" }, { label: c.label }]}
        title={`${c.label} in Mauritius`}
        lede={`${count(listings.length)} listed. ${c.group === "health" ? "Those with a telephone number on record come first, then the fullest." : "The fullest listings come first."}`}
      />
      <ListingList name={`${c.label} in Mauritius`} listings={listings} path={`/directory/${c.id}`} params={await searchParams} narrow={narrow} narrowLabel="Narrow to a town" says={`A chart of Mauritius with the ${count(listings.length)} ${c.label.toLowerCase()} listed lit.`} />
    </>
  );
}
