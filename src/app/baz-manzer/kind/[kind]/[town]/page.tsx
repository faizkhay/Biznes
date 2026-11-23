import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import BazView, { readView, viewHref, viewMeta, type Asked } from "@/components/baz/view";
import { baz } from "@/lib/baz";

type Props = { params: Promise<{ kind: string; town: string }>; searchParams: Promise<Asked> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { kind, town } = await params;
  const view = readView({ type: kind, town }, await searchParams);
  return view ? viewMeta(view) : {};
}

/** A kind of place to eat in one town or village: the restaurants of Grand Baie. */
export default async function BazKindTownPage({ params, searchParams }: Props) {
  const { kind, town } = await params;
  const view = readView({ type: kind, town }, await searchParams);
  if (!view) notFound();
  const at = viewHref(view, { page: view.page });
  if (at.split("?")[0] !== baz.kind(kind, town)) permanentRedirect(at);
  return <BazView view={view} />;
}
