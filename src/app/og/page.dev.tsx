import Logo from "@/components/Logo";
import Wordmark from "@/components/Wordmark";
import { BUSINESSES } from "@/data/businesses";
import { site } from "@/data/site";
import { brandVars } from "@/lib/brand";

/**
 * The link preview card, drawn with the site's own tokens: the mark, the headline, and the rail of
 * tags. A page only under `next dev` (see pageExtensions in next.config.ts); `npm run og` captures
 * the #og frame to public/og.png at 1200 x 630.
 */
const STRINGS = [40, 16, 56, 24, 48, 20];

export default function OgCard() {
  return (
    <div id="og" className="flex h-[630px] w-[1200px] flex-col justify-between overflow-hidden bg-paper px-16 pt-12">
      <div>
        <Logo />
        <p className="heading-1 mt-10 max-w-3xl">Buy a business that is ready to launch</p>
        <p className="title-1 mt-4 text-ink-subtle">{site.line}, built by {site.builder.name}</p>
      </div>
      <ul className="grid grid-cols-6 border-t border-line-strong">
        {BUSINESSES.map((b, i) => (
          <li key={b.slug} className="px-3">
            <div className="tag-string" style={{ height: STRINGS[i % STRINGS.length] }} />
            <div className="tag" data-ground="brand" style={brandVars(b)}>
              <span className="tag-hole" />
              <div className="flex flex-1 items-center justify-center">
                <Wordmark slug={b.slug} name={b.name} decorative />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
