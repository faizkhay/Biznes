import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import BusinessPage from "@/components/BusinessPage";
import { claimOf } from "@/lib/accounts/owned";
import { showcaseOf } from "@/lib/accounts/showcase";
import { index, listingFromSlug, whereOf, type Listing } from "@/lib/index";

type Props = { params: Promise<{ slug: string }> };

// Seven thousand pages are not built ahead: each is made the first time it is asked for, then kept.
export const generateStaticParams = () => [];

function describe(l: Listing): string {
  const category = index().categoryById.get(l.cat);
  const where = whereOf(l);
  return `${l.name}: ${(category?.one ?? "listing").toLowerCase()}${where ? ` in ${where}` : ""}, Mauritius. ${[l.street, l.phone?.[0]].filter(Boolean).join(". ")}`.trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = listingFromSlug((await params).slug);
  if (!l) return {};
  const title = `${l.name}${l.place ? `, ${l.place}` : ""}`;
  return { title, description: describe(l), alternates: { canonical: `/b/${l.slug}` }, openGraph: { title, description: describe(l), url: `/b/${l.slug}` } };
}

/** A listing from the open index, with what its owner has added if they have claimed it. */
export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const l = listingFromSlug(slug);
  if (!l) notFound();
  if (slug !== l.slug) permanentRedirect(`/b/${l.slug}`);
  // The live business that has claimed this listing, if one has. Always undefined with accounts off.
  const claim = await claimOf(l.id);
  return <BusinessPage listing={l} owned={claim} showcase={claim ? await showcaseOf(claim.id) : undefined} />;
}
