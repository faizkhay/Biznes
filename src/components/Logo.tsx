// The biznes.mu mark: a small shopfront (a roof, its fringe, a door) beside the name as real text,
// so the name is read aloud, found by search and selectable. The shopfront is the site's signature
// shape at its smallest.
export default function Logo({ className }: { className?: string }) {
  return (
    <span className={["inline-flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <svg viewBox="0 0 24 24" className="size-7 flex-none" aria-hidden focusable="false">
        <path d="M2 4h20v5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0z" fill="var(--palette-saffron)" />
        <path d="M4 12.5h16V21H4z" fill="var(--palette-saffron)" />
        <path d="M9.5 15h5v6h-5z" fill="var(--palette-dusk-deep)" />
      </svg>
      <span className="heading-5 normal-case tracking-normal">
        biznes<span className="text-ink-subtle">.mu</span>
      </span>
    </span>
  );
}
