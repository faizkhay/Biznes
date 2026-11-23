import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BazView, { readView, viewMeta, type Asked } from "@/components/baz/view";

type Props = { params: Promise<{ food: string }>; searchParams: Promise<Asked> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const view = readView({ food: (await params).food }, await searchParams);
  return view ? viewMeta(view) : {};
}

/**
 * A kind of food: every place to eat whose cuisine the map records under this word. It can be
 * narrowed by kind of place and by town, which stay parameters of this address.
 */
export default async function BazFoodPage({ params, searchParams }: Props) {
  const view = readView({ food: (await params).food }, await searchParams);
  if (!view) notFound();
  return <BazView view={view} />;
}
