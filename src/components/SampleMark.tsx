/** The mark a placeholder listing wears wherever it appears, in words, never by colour alone. */
export default function SampleMark({ className }: { className?: string }) {
  return (
    <span className={["caption-4 inline-flex items-center rounded-full border border-line-strong px-2 py-0.5", className].filter(Boolean).join(" ")}>
      Sample listing
    </span>
  );
}
