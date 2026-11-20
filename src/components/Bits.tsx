import Link from "next/link";
import { count } from "@/lib/format";

/** The path to a page: each step a link but the last, which is where you are. */
export function Crumbs({ path }: { path: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="You are here">
      <ol className="crumbs caption-1">
        {path.map((step, i) => (
          <li key={i} aria-current={step.href ? undefined : "page"}>
            {step.href ? <Link prefetch={false} href={step.href}>{step.label}</Link> : <span>{step.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Earlier and later pages of a long list. `href(n)` is the address of page n. */
export function Pager({ page, pages, href }: { page: number; pages: number; href: (n: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className="pager">
      {page > 1 ? (
        <Link prefetch={false} href={href(page - 1)} rel="prev" className="btn btn-quiet button-sm">
          Earlier
        </Link>
      ) : (
        <span />
      )}
      <p className="data-2 text-ink-faint">
        Page {count(page)} of {count(pages)}
      </p>
      {page < pages ? (
        <Link prefetch={false} href={href(page + 1)} rel="next" className="btn btn-quiet button-sm">
          More
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

/** A name and how many it holds, for an index. */
export function IndexItem({ href, label, n }: { href: string; label: string; n: number }) {
  return (
    <Link prefetch={false} href={href} className="index-item body-3">
      <span>{label}</span>
      <span className="n data-2">{count(n)}</span>
    </Link>
  );
}

/** A page's opening: where it is, what it is, and a sentence about it. */
export function PageHead({ path, title, lede, children }: { path?: { href?: string; label: string }[]; title: string; lede?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="shell pt-8 pb-10 lg:pt-12">
      {path && <Crumbs path={path} />}
      <h1 className={`heading-1 max-w-4xl ${path ? "mt-4" : ""}`}>{title}</h1>
      {lede && <p className="body-1 measure mt-4 text-ink-subtle">{lede}</p>}
      {children}
    </div>
  );
}
