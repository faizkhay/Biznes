import { INCLUDED } from "@/data/pack";

/**
 * The ring: one loop, and a small tag hanging from it for each thing a business comes with, numbered
 * as the list beside it is. A drawing, not information: the list carries every word, so this is
 * hidden from assistive technology. The loop draws itself once as it enters the screen (globals.css).
 *
 * The strings leave the lower arc of the loop and fan out to tags spaced evenly across the drawing,
 * the way keys fan from a ring held up by one finger. Coordinates are worked out with trigonometry
 * and rounded, so the server and the browser print the same digits. The numbers are set at 13 units,
 * so they stay above 12px when the drawing is scaled down on a 360px screen.
 */
export default function Ring({ className }: { className?: string }) {
  const n = INCLUDED.length;
  const cx = 160;
  const cy = 62;
  const r = 50;
  const round = (v: number) => Math.round(v * 100) / 100;
  const tags = Array.from({ length: n }, (_, i) => {
    // Where the string leaves the loop: evenly along its lower arc, left to right.
    const angle = Math.PI * (0.8 - (0.6 * i) / (n - 1));
    const fromX = round(cx + r * Math.cos(angle));
    const fromY = round(cy + r * Math.sin(angle));
    // Where its tag hangs: evenly across the drawing, alternating two lengths.
    const x = 35 + i * 50;
    const y = 168 + (i % 2) * 34;
    return { fromX, fromY, x, y, label: String(i + 1).padStart(2, "0") };
  });

  return (
    <svg viewBox="0 0 320 262" className={className} fill="none" aria-hidden focusable="false">
      {/* Tags first, then their holes, then the strings on top, so each string is seen to run down the
          face of its tag and through the hole to its centre. */}
      {tags.map((t) => (
        <g key={t.label}>
          <rect x={t.x - 19} y={t.y} width="38" height="52" rx="7" fill="var(--palette-primary)" />
          <circle cx={t.x} cy={t.y + 9} r="3.5" fill="var(--color-paper)" />
          <text
            x={t.x}
            y={t.y + 37}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="13"
            fontWeight="500"
            fill="var(--palette-on-primary)"
          >
            {t.label}
          </text>
        </g>
      ))}
      {tags.map((t) => (
        <path key={`s${t.label}`} d={`M${t.fromX} ${t.fromY}L${t.x} ${t.y + 9}`} stroke="var(--color-line-strong)" strokeWidth="1" />
      ))}
      <circle className="ring-path" cx={cx} cy={cy} r={r} pathLength={1} stroke="var(--color-ink)" strokeWidth="1.5" />
    </svg>
  );
}
