// The biznes.mu mark: a tag with its punched hole, beside the name as real text, so the name is read
// aloud, found by search and selectable. The tag is the site's signature shape at its smallest.
export default function Logo({ className }: { className?: string }) {
  return (
    <span className={["inline-flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <svg viewBox="0 0 24 24" className="size-6 flex-none" aria-hidden focusable="false">
        <rect x="5" y="2" width="14" height="20" rx="3.5" fill="var(--palette-primary)" />
        <circle cx="12" cy="6.5" r="1.75" fill="var(--color-paper)" />
      </svg>
      <span className="body-1">
        biznes<span className="text-ink-subtle">.mu</span>
      </span>
    </span>
  );
}
