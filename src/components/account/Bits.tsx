import Link from "next/link";
import { Crumbs } from "@/components/Bits";
import { Alert, Tick } from "@/components/Icons";
import { Mark } from "@/components/Logo";

// The pieces the account pages are made of, in the site's own manner: a card to sign in at, a
// tile that leads somewhere, a figure that sums something up, a list that is still empty, and a
// word the page says after something was done.

/**
 * The card a person signs in at: the b on its saffron tile, a title, a line, the form, and the
 * other way in as a quiet line beneath. It stands in the middle of the sheet.
 */
export function AuthCard({ title, line, children, foot, path }: { title: string; line: string; children: React.ReactNode; foot?: React.ReactNode; path?: { href?: string; label: string }[] }) {
  return (
    <div className="shell pt-8 pb-8 lg:pt-12">
      <div className="mx-auto max-w-md">
        <Crumbs path={[{ href: "/", label: "Home" }, ...(path ?? [{ label: title }])]} />
        <div className="card mt-6 p-6 sm:p-8">
          <span className="account-mark" aria-hidden>
            <Mark />
          </span>
          <h1 className="heading-2 mt-6">{title}</h1>
          <p className="body-2 mt-2 text-ink-subtle">{line}</p>
          <div className="mt-8">{children}</div>
        </div>
        {foot && <div className="body-3 mt-6 text-center text-ink-subtle">{foot}</div>}
      </div>
    </div>
  );
}

/** A way in, as a tile: an icon on an ink tile, a title and a line. On a phone the tiles stand two abreast as small cards. */
export function WayIn({ href, icon, title, line, count }: { href: string; icon: React.ReactNode; title: string; line: string; count?: number }) {
  return (
    <Link prefetch={false} href={href} className="tile h-full">
      <span className="tile-icon">{icon}</span>
      <span className="min-w-0">
        <span className="title-2 flex flex-wrap items-center gap-2">
          {title}
          {count ? <span className="tag tag-lit data-2">{count}</span> : null}
        </span>
        <span className="caption-1 mt-0.5 block text-ink-subtle">{line}</span>
      </span>
    </Link>
  );
}

/** A figure that sums something up, with what it counts above it and a word beneath. A link when it leads to the thing counted. */
export function Stat({ label, figure, note, href }: { label: string; figure: React.ReactNode; note?: React.ReactNode; href?: string }) {
  const inside = (
    <>
      <span className="label-1 text-ink-faint">{label}</span>
      <span className="stat-figure">{figure}</span>
      {note && <span className="caption-1 text-ink-subtle">{note}</span>}
    </>
  );
  return href ? (
    <Link prefetch={false} href={href} className="stat">
      {inside}
    </Link>
  ) : (
    <div className="stat">{inside}</div>
  );
}

/** A row of figures: two abreast on a phone, four on a desk, or five where a page counts five things. */
export function Stats({ children, five = false }: { children: React.ReactNode; five?: boolean }) {
  return <div className={`grid grid-cols-2 gap-3 ${five ? "sm:grid-cols-3 lg:grid-cols-5" : "lg:grid-cols-4"}`}>{children}</div>;
}

/** A list with nothing in it yet: what the thing is, and how to begin. */
export function Empty({ icon, title, children, action }: { icon: React.ReactNode; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card card-panel max-w-xl">
      <span className="tile-icon bg-paper text-ink">{icon}</span>
      <h3 className="heading-3 mt-4">{title}</h3>
      <p className="body-2 mt-2 text-ink-subtle">{children}</p>
      {action && <p className="mt-6 flex flex-wrap gap-3">{action}</p>}
    </div>
  );
}

/** What the page says after something was done, or could not be: one sentence in a quiet panel. */
export function Notice({ children, bad = false, className = "" }: { children: React.ReactNode; bad?: boolean; className?: string }) {
  return (
    <p role={bad ? "alert" : "status"} className={`note body-3 flex items-start gap-2 ${className}`}>
      {bad ? <Alert className="mt-0.5 size-5 flex-none text-alert" /> : <Tick className="mt-0.5 size-5 flex-none text-link" />}
      <span>{children}</span>
    </p>
  );
}

/** The head of a part of a page: its title, a line about it, and what can be done there. */
export function PartHead({ id, title, line, children }: { id: string; title: string; line?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h2 id={id} className="heading-2">
          {title}
        </h2>
        {line && <p className="body-3 mt-2 max-w-prose text-ink-subtle">{line}</p>}
      </div>
      {children}
    </div>
  );
}
