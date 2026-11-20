import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import SavedList from "@/components/SavedList";
import { index } from "@/lib/index";

// A shortlist is one visitor's own, or one they were sent: never a page to index.
export const metadata: Metadata = { title: "Saved", robots: { index: false, follow: true } };

export default async function SavedPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { byId } = index();
  const wanted = ((await searchParams).ids ?? "").split(",").filter(Boolean).slice(0, 200);
  const shared = wanted.filter((id) => byId.has(id));
  const sent = wanted.length > 0;
  return (
    <>
      <PageHead
        title={sent ? "A shortlist, shared with you" : "Saved"}
        path={[{ label: "Saved" }]}
        lede={sent ? "Someone sent you these listings. Keep them on your own list, or open any one." : "The listings you have saved, kept in this browser. Share the list as a link, or take anything off it."}
      />
      <div className="shell max-w-4xl pb-8">
        <SavedList shared={sent ? shared : undefined} />
        {/* Without script the shared list is still readable: the same listings, as plain links. */}
        <noscript>
          {sent ? (
            <ul className="rows">
              {shared.map((id) => {
                const l = byId.get(id)!;
                return (
                  <li key={id}>
                    <p className="row">
                      <Link href={`/b/${l.slug}`} className="row-title title-1">
                        {l.name}
                      </Link>
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="note body-3">The saved list is kept by this page&apos;s script, in your browser. With script off there is nothing to show here; every listing is still in the directory.</p>
          )}
        </noscript>
        {sent && (
          <p className="body-3 mt-8 text-ink-subtle">
            <Link href="/saved">Your own saved list</Link>
          </p>
        )}
      </div>
    </>
  );
}
