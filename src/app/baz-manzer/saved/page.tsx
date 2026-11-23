import type { Metadata } from "next";
import Link from "next/link";
import BazSaved from "@/components/baz/BazSaved";
import { Crumbs } from "@/components/Bits";
import { BAZ } from "@/data/site";
import { baz } from "@/lib/baz";
import { food } from "@/lib/food";
import { index } from "@/lib/index";
import { pageMeta } from "@/lib/meta";

const [, , , , way] = BAZ.ways;

// A shortlist is one visitor's own, or one they were sent: never a page to index.
export const metadata: Metadata = pageMeta({ title: "Saved places to eat", description: "The places to eat you have saved on Baz Manzer, kept in this browser, or a list of places someone has sent you.", path: baz.saved, index: false });

/**
 * The saved places: the visitor's shortlist narrowed to places to eat, read from their browser.
 * `?ids=` shows a list someone sent, narrowed the same way.
 */
export default async function BazSavedPage({ searchParams }: { searchParams: Promise<{ ids?: string | string[] }> }) {
  const { byId } = index();
  const { ids } = food();
  // An address may give `ids` twice, which arrives as a list: either way it is read as one list of ids.
  const wanted = String((await searchParams).ids ?? "").slice(0, 6000).split(",").filter(Boolean).slice(0, 200);
  const shared = wanted.filter((id) => byId.has(id) && ids.has(byId.get(id)!.cat));
  const sent = wanted.length > 0;
  return (
    <div className="shell pt-8 pb-8 lg:pt-12">
      <Crumbs path={[{ href: baz.home, label: BAZ.name }, { label: way.label }]} />
      <h1 className="heading-1 mt-4 max-w-4xl">{sent ? "Places to eat, shared with you" : "Saved places"}</h1>
      <p className="body-1 measure mt-4 text-ink-subtle">{sent ? "Someone sent you these places to eat. Keep them on your own list, or open any one." : "The places to eat you have saved, kept in this browser. Share the list as a link, or take anything off it."}</p>
      <div className="mt-10 max-w-4xl">
        <BazSaved shared={sent ? shared : undefined} />
        {/* Without script the shared list is still readable: the same places, as plain links. */}
        <noscript>
          {sent ? (
            <ul className="rows">
              {shared.map((id) => {
                const l = byId.get(id)!;
                return (
                  <li key={id}>
                    <p className="row">
                      <Link href={baz.place(l.slug)} className="row-title title-1">
                        {l.name}
                      </Link>
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="note body-3">The saved list is kept by this page&apos;s script, in your browser. With script off there is nothing to show here; every place to eat is still on Baz Manzer.</p>
          )}
        </noscript>
        {sent && (
          <p className="body-3 mt-8 text-ink-subtle">
            <Link href={baz.saved}>Your own saved places</Link>
          </p>
        )}
      </div>
    </div>
  );
}
