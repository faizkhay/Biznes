import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import BusinessPage from "@/components/BusinessPage";
import { BAZ } from "@/data/site";
import { claimOf, owned, type Owned } from "@/lib/accounts/owned";
import { showcaseOf } from "@/lib/accounts/showcase";
import { baz } from "@/lib/baz";
import { food } from "@/lib/food";
import { index, listingFromSlug, whereOf, type Category, type Listing } from "@/lib/index";
import { pageMeta } from "@/lib/meta";

type Props = { params: Promise<{ slug: string }> };

// As a listing's own page is: made the first time it is asked for, then kept.
export const generateStaticParams = () => [];

/** A place to eat by the end of its address: a listing of the index in one of the eating categories, or an outlet its owner listed outside the index. */
async function find(slug: string): Promise<{ listing?: Listing; own?: Owned } | undefined> {
  const { ids } = food();
  const listing = listingFromSlug(slug);
  if (listing) return ids.has(listing.cat) ? { listing } : undefined;
  const own = (await owned()).bySlug.get(slug);
  return own && !own.listingId && ids.has(own.category) ? { own } : undefined;
}

/** The section's path to a place: Baz Manzer, its kind of place, and that kind in its town. */
function pathTo(category: Category | undefined, town?: { slug: string; name: string }) {
  return [{ href: baz.home, label: BAZ.name }, ...(category ? [{ href: baz.kind(category.id), label: category.label }] : []), ...(category && town ? [{ href: baz.kind(category.id, town.slug), label: town.name }] : [])];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await find((await params).slug);
  if (!found) return {};
  const { categoryById, placeBySlug } = index();
  // The place has one address for a search engine, and it is not this one: its page in the
  // directory, or its own page for a business listed by its owner. So nothing is counted twice.
  if (found.listing) {
    const l = found.listing;
    const where = whereOf(l);
    return pageMeta({ title: `${l.name}${l.place ? `, ${l.place}` : ""}`, description: `${l.name}: ${(categoryById.get(l.cat)?.one ?? "place to eat").toLowerCase()}${where ? ` in ${where}` : ""}, Mauritius. ${[l.street, l.phone?.[0]].filter(Boolean).join(". ")}`.trim(), path: `/b/${l.slug}`, drawn: true });
  }
  const o = found.own!;
  const town = placeBySlug.get(o.town);
  return pageMeta({ title: `${o.name}${town ? `, ${town.name}` : ""}`, description: `${o.name}: ${(categoryById.get(o.category)?.one ?? "place to eat").toLowerCase()}${town ? ` in ${town.name}` : ""}, Mauritius. ${[o.address, o.phone].filter(Boolean).join(". ")}`.trim(), path: o.path, drawn: true });
}

/**
 * A place to eat, inside Baz Manzer: the same page the rest of the site shows for it (the one
 * BusinessPage), with the section's own path at its head and its neighbours' pages inside the
 * section too. An installed Baz Manzer so never leaves itself when a restaurant is opened.
 */
export default async function BazPlacePage({ params }: Props) {
  const { slug } = await params;
  const found = await find(slug);
  if (!found) notFound();
  const { categoryById, placeBySlug } = index();
  const place = (l: Listing) => baz.place(l.slug);
  if (found.listing) {
    const l = found.listing;
    // A listing's id alone leads to its full address, here as in the directory.
    if (slug !== l.slug) permanentRedirect(baz.place(l.slug));
    const category = categoryById.get(l.cat);
    // The live business that has claimed this listing, if one has. Always undefined with accounts off.
    const claim = await claimOf(l.id);
    const town = l.placeSlug && l.place ? { slug: l.placeSlug, name: l.place } : undefined;
    return <BusinessPage listing={l} owned={claim} showcase={claim ? await showcaseOf(claim.id) : undefined} within={{ path: pathTo(category, town), listing: place, all: category && town ? baz.kind(category.id, town.slug) : undefined }} />;
  }
  const o = found.own!;
  const town = placeBySlug.get(o.town);
  return <BusinessPage owned={o} showcase={await showcaseOf(o.id)} within={{ path: pathTo(categoryById.get(o.category), town), listing: place }} />;
}
