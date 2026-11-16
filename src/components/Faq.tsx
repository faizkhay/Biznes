import { FAQS } from "@/data/pack";
import { Plus } from "./Icons";

/** The questions, as native details: keyboard-ready, found by the browser's search, no script. */
export default function Faq() {
  return (
    <div className="border-t border-line-strong">
      {FAQS.map((f) => (
        <details key={f.q} className="faq group border-b border-line">
          <summary className="title-1 flex min-h-16 items-center justify-between gap-6 py-4">
            {f.q}
            <Plus className="faq-mark size-6 flex-none" />
          </summary>
          <p className="body-3 measure pb-6 text-ink-subtle">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
