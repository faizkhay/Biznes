import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import BazView, { readView, viewHref, viewMeta, type Asked } from "@/components/baz/view";
import { baz } from "@/lib/baz";

type Props = { params: Promise<{ kind: string }>; searchParams: Promise<Asked> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const view = readView({ type: (await params).kind }, await searchParams);
  return view ? viewMeta(view) : {};
}

/** A kind of place to eat across the island: restaurants, snacks and takeaways, cafés, bakeries, bars. */
export default async function BazKindPage({ params, searchParams }: Props) {
  const { kind } = await params;
  const view = readView({ type: kind }, await searchParams);
  if (!view) notFound();
  // A town or a kind of food given as a parameter has an address of its own: the list is shown there.
  const at = viewHref(view, { page: view.page });
  if (at.split("?")[0] !== baz.kind(kind)) permanentRedirect(at);
  return <BazView view={view} />;
}
