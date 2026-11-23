import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import BazView, { readView, viewHref, viewMeta, type Asked } from "@/components/baz/view";
import { baz } from "@/lib/baz";

type Props = { params: Promise<{ town: string }>; searchParams: Promise<Asked> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const view = readView({ town: (await params).town }, await searchParams);
  return view ? viewMeta(view) : {};
}

/** Where to eat in one town, village or neighbourhood, with the towns nearest it. */
export default async function BazTownPage({ params, searchParams }: Props) {
  const { town } = await params;
  const view = readView({ town }, await searchParams);
  if (!view) notFound();
  // A kind of place or of food given as a parameter has an address of its own: the list is shown there.
  const at = viewHref(view, { page: view.page });
  if (at.split("?")[0] !== baz.town(town)) permanentRedirect(at);
  return <BazView view={view} />;
}
