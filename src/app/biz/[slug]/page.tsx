import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import BusinessPage from "@/components/BusinessPage";
import { owned, type Owned } from "@/lib/accounts/owned";
import { showcaseOf } from "@/lib/accounts/showcase";
import { index } from "@/lib/index";

type Props = { params: Promise<{ slug: string }> };

// A business's page is made the first time it is asked for and then kept, as a listing's is. It is
// made again when an admin or the owner changes the business (the read is tagged), and at the
// latest five minutes after.
export const generateStaticParams = () => [];

/** A live business listed by its owner that is not in the open index. One that claimed a listing lives on the listing's page. */
async function find(slug: string): Promise<Owned | undefined> {
  return (await owned()).bySlug.get(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await find((await params).slug);
  if (!b || b.listingId) return {};
  const { placeBySlug, categoryById } = index();
  const [category, town] = [categoryById.get(b.category), placeBySlug.get(b.town)];
  const title = `${b.name}${town ? `, ${town.name}` : ""}`;
  const description = `${b.name}: ${(category?.one ?? "business").toLowerCase()}${town ? ` in ${town.name}` : ""}, Mauritius. ${[b.address, b.phone].filter(Boolean).join(". ")}`.trim();
  return { title, description, alternates: { canonical: b.path }, openGraph: { title, description, url: b.path } };
}

/** A business its owner listed, shown on the same page a listing from the index has. */
export default async function OwnedBusinessPage({ params }: Props) {
  const b = await find((await params).slug);
  if (!b) notFound();
  // One business, one page: a claimed listing is shown on the listing's own.
  if (b.listingId) redirect(b.path);
  return <BusinessPage owned={b} showcase={await showcaseOf(b.id)} />;
}
