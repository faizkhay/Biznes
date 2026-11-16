import { type Business, STATUS_LABEL } from "@/data/businesses";
import { brandVars } from "@/lib/brand";
import Wordmark from "./Wordmark";

/**
 * A business's tag at full size, at the head of its page: hanging by its string from its own short
 * rail, with its ground, its lettering, the punched hole, and what is written along its foot.
 * `small` is the plate in a catalogue row, which lies flat in the ledger and has no hole.
 */
export default function Plate({ business: b, small = false, className }: { business: Business; small?: boolean; className?: string }) {
  if (small) {
    return (
      <div data-ground="brand" style={brandVars(b)} className={["flex aspect-[16/10] items-center justify-center rounded-xl", className].filter(Boolean).join(" ")}>
        <Wordmark slug={b.slug} name={b.name} decorative scale={1.1} />
      </div>
    );
  }
  return (
    <div className={["hang border-t border-line-strong", className].filter(Boolean).join(" ")}>
      <div data-ground="brand" style={brandVars(b)} className="tag tag-plate">
        <span className="tag-hole" aria-hidden />
        <div className="flex flex-1 items-center justify-center">
          <Wordmark slug={b.slug} name={b.name} scale={1.15} />
        </div>
        <div className="caption-4 flex items-end justify-between gap-4 px-6 pb-6">
          <span>No. {b.number}</span>
          <span>{b.sample ? "Sample listing" : STATUS_LABEL[b.status]}</span>
        </div>
      </div>
    </div>
  );
}
