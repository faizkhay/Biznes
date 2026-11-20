import type { Metadata } from "next";
import { PageHead } from "@/components/Bits";
import { Out } from "@/components/Icons";
import { count, shortUrl } from "@/lib/format";
import { index } from "@/lib/index";
import { pageMeta } from "@/lib/meta";

export const metadata: Metadata = pageMeta({
  title: "Official pages for business in Mauritius",
  description: "The government pages, registers and forms a business in Mauritius needs, by the body that publishes them: registration, tax, licences, permits, support.",
  path: "/official",
});

export default function OfficialPage() {
  const { official } = index();
  const publishers = [...new Set(official.map((o) => o.publisher))].sort((a, b) => a.localeCompare(b));
  return (
    <>
      <PageHead here="/official" title="Official pages" lede={`${count(official.length)} pages, registers and forms from the bodies a business in Mauritius deals with. Each was read when a guide was written; the search finds them by what they are for.`} />
      <div className="shell">
        {official.length === 0 && <p className="body-2 text-ink-subtle">The list is gathered from the guides, which are being written.</p>}
        {publishers.map((publisher) => (
          <section key={publisher} aria-label={publisher} className="grid gap-x-12 gap-y-4 border-t border-line py-10 md:grid-cols-12">
            <h2 className="heading-3 md:col-span-4">{publisher}</h2>
            <ul className="rows border-t-0 md:col-span-8">
              {official
                .filter((o) => o.publisher === publisher)
                .map((o) => (
                  <li key={o.url}>
                    <div className="row pt-0 pb-4 not-first:pt-4">
                      <a href={o.url} rel="noopener" className="row-title title-2 inline-flex items-baseline gap-2">
                        {o.title} <Out className="size-4 shrink-0 self-center text-ink-faint" />
                      </a>
                      <p className="body-3 mt-1 max-w-prose text-ink-subtle">{o.what}</p>
                      <p className="data-2 mt-2 break-all text-ink-faint">{shortUrl(o.url)}</p>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
