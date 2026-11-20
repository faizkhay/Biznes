import { Wordmark } from "@/components/Logo";
import { PICTURES } from "@/data/themes";
import { site } from "@/data/site";
import { count } from "@/lib/format";
import { index } from "@/lib/index";

/**
 * The link preview card, as a page: the name and the line on the lagoon picture, at 1200 by 630.
 * It exists only under `next dev` (its file ends .dev.tsx), where scripts/og.mjs captures it into
 * public/og.jpg. The card always shows the everyday picture, whatever the season.
 */
export default function OgCard() {
  const { meta, guides } = index();
  return (
    <div id="og" className="relative flex flex-col overflow-hidden px-16 py-12" style={{ width: 1200, height: 630, backgroundImage: `linear-gradient(to bottom, rgb(253 249 236 / 0.9), rgb(253 249 236 / 0.55) 42%, transparent 70%), url(${PICTURES.lagoon.src})`, backgroundSize: "cover", backgroundPosition: "center bottom" }}>
      <p className="text-ink *:h-12 *:w-auto">
        <Wordmark />
      </p>
      <p className="display-1 mt-10 max-w-4xl" style={{ fontSize: "5rem" }}>
        {site.line}.
      </p>
      <p className="pill-note body-1 mt-6 self-start font-semibold">
        {count(meta.listings.all)} businesses and services, {count(meta.towns)} towns and villages, {count(guides.length)} articles
      </p>
    </div>
  );
}
