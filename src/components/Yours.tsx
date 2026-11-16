import { YOURS } from "@/data/pack";
import Reveal from "./Reveal";

/**
 * The honest half, on night: what we prepare beside what stays with the buyer, and the plain
 * statement that no income is promised. Trust comes before the ask.
 */
export default function Yours() {
  return (
    <section data-ground="night" aria-labelledby="yours-heading">
      <div className="shell section-y grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <Reveal className="reveal-mask">
            <h2 id="yours-heading" className="heading-2 measure-hero">
              {YOURS.heading}
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="title-2 measure mt-6 text-ink-subtle">{YOURS.line}</p>
          </Reveal>
        </div>
        <Reveal className="grid gap-10 sm:grid-cols-2 sm:gap-8">
          <div>
            <h3 className="title-3 border-b border-line-strong pb-3">We prepare</h3>
            <ul>
              {YOURS.ours.map((t) => (
                <li key={t} className="body-3 border-b border-line py-3">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="title-3 border-b border-line-strong pb-3">You bring</h3>
            <ul>
              {YOURS.yours.map((t) => (
                <li key={t} className="body-3 border-b border-line py-3">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
