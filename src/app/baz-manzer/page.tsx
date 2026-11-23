import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import BazView, { readView, viewHref, viewMeta, type Asked } from "@/components/baz/view";
import { baz } from "@/lib/baz";

type Props = { searchParams: Promise<Asked> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return viewMeta(readView({}, await searchParams)!);
}

/**
 * Baz Manzer, Kreol for a place to eat: the front of the section, and every place to eat in the
 * directory. It is browsed by kind of place, by kind of food (the map's own word for a listing's
 * cuisine, where it gives one) and by town, each at an address of its own beneath this one;
 * narrowed by what a listing has on record; and shown on the island and, on request, on a street
 * map.
 *
 * Until Round 7 a kind, a kind of food and a town were parameters of this page
 * ("/baz-manzer?food=chinese&town=port-louis"). Those addresses are led, for good, to the one
 * address each list now has.
 */
export default async function BazManzerPage({ searchParams }: Props) {
  const view = readView({}, await searchParams)!;
  const at = viewHref(view, { page: view.page });
  if (at.split("?")[0] !== baz.home) permanentRedirect(at);
  return <BazView view={view} />;
}
