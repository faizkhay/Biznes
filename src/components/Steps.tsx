import { STEPS } from "@/data/pack";
import Reveal from "./Reveal";

/**
 * The sale in the order the buyer lives it. On a wide screen the four steps hang from one rail,
 * each from its own ring; on a phone they run down the page with the rail at their side.
 */
export default function Steps({ detailed = false }: { detailed?: boolean }) {
  return (
    <ol className="grid gap-y-10 md:grid-cols-4 md:gap-y-0 md:border-t md:border-line-strong">
      {STEPS.map((step, i) => (
        <Reveal as="li" key={step.title} delay={i * 90} className="relative border-l border-line-strong pl-6 md:border-l-0 md:pl-0 md:pr-8 md:pt-10">
          {/* The ring this step hangs from, sitting on the rail. */}
          <span aria-hidden className="absolute -left-2 top-0 size-4 rounded-full border border-ink bg-paper md:-top-2 md:left-0" />
          <p className="caption-4 text-ink-subtle">Step {i + 1}</p>
          <h3 className={detailed ? "heading-3 mt-2" : "heading-5 mt-2"}>{step.title}</h3>
          <p className="body-3 mt-2 text-ink-subtle">{step.line}</p>
        </Reveal>
      ))}
    </ol>
  );
}
