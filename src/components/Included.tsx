import { INCLUDED } from "@/data/pack";
import Reveal from "./Reveal";

/** What every business comes with: six rows divided by hairlines, numbered as the ring's tags are. */
export default function Included() {
  return (
    <ol className="border-t border-line-strong">
      {INCLUDED.map((item, i) => (
        <Reveal as="li" key={item.title} delay={i * 60} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-line py-6 sm:grid-cols-[4rem_1fr]">
          <span className="caption-4 pt-1 text-ink-subtle" aria-hidden>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="title-1">{item.title}</h3>
            <p className="body-3 measure mt-1 text-ink-subtle">{item.line}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
