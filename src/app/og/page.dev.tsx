import Logo from "@/components/Logo";
import Wordmark from "@/components/Wordmark";
import type { CSSProperties } from "react";
import { BUSINESSES, STATUS_LABEL } from "@/data/businesses";
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
        <p className="heading-1 mt-10">
          Buy a business
          <br />
          ready to launch
        </p>
        <p className="title-1 mt-4 text-ink-subtle">
          {site.line}, built by {site.builder.name}
        </p>
      </div>
      <ul className="grid grid-cols-6 border-t border-line-strong">
        {BUSINESSES.map((b, i) => (
          <li key={b.slug} className="hang px-3" style={{ "--string": `${STRINGS[i % STRINGS.length]}px` } as CSSProperties}>
            <div className="tag" data-ground="brand" style={brandVars(b)}>
              <span className="tag-hole" />
              <div className="flex flex-1 items-center justify-center">
                <Wordmark slug={b.slug} name={b.name} decorative />
              </div>
              {/* A sample is marked on the card too: this is the picture that travels. */}
              <div className="caption-4 flex justify-between px-3 pb-3">
                <span>No. {b.number}</span>
                <span>{b.sample ? "Sample" : STATUS_LABEL[b.status]}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
