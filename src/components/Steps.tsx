import { STEPS } from "@/data/pack";
import Reveal from "./Reveal";

/**
 * The sale in the order the buyer lives it: four steps, numbered because the order is the point.
 * On a wide screen they stand in a row under one line; on a phone they run down the page.
 */
export default function Steps() {
  return (
    <ol className="grid gap-y-10 md:grid-cols-4 md:gap-x-8 md:border-t md:border-line-strong md:pt-8">
      {STEPS.map((step, i) => (
        <Reveal as="li" key={step.title} delay={i * 90}>
          <p className="heading-2" aria-hidden>
            {i + 1}
          </p>
          <h3 className="heading-5 mt-2">
            <span className="sr-only">Step {i + 1}: </span>
            {step.title}
          </h3>
          <p className="body-3 mt-2 text-ink-subtle">{step.line}</p>
        </Reveal>
      ))}
    </ol>
  );
}
