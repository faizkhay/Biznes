import Link from "next/link";
import { BROWSE } from "@/data/site";
import { count } from "@/lib/format";
import { breadcrumbs } from "@/lib/schema";
import JsonLd from "./JsonLd";

/**
 * The path to a page: each step a link but the last, which is where you are. Given the page's own
 * address (`here`), the same path is also written out for machines, as a BreadcrumbList.
 */
export function Crumbs({ path, here }: { path: { href?: string; label: string }[]; here?: string }) {
  return (
    <nav aria-label="You are here">
      {here && <JsonLd data={breadcrumbs(path, here)} />}
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

/**
 * A page's opening: where it is, what it is, and a sentence about it. Every page has its path, so
 * every title sits at the same height.
 */
export function PageHead({ path, here, title, lede, children }: { path?: { href?: string; label: string }[]; /** The page's own address, for its path to be written out for machines too. */ here?: string; title: string; lede?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="shell pt-8 pb-10 lg:pt-12">
      <Crumbs here={here} path={[{ href: "/", label: "Home" }, ...(path ?? [{ label: title }])]} />
      <h1 className="heading-1 mt-4 max-w-4xl">{title}</h1>
      {lede && <p className="body-1 measure mt-4 text-ink-subtle">{lede}</p>}
      {children}
    </div>
  );
}

/**
 * The directory, both ways round: the same businesses by what they do, or by where they are. It
 * stands at the head of both pages, so the towns are one press from the categories and back.
 */
export function BrowseTabs({ here }: { here: (typeof BROWSE)[number]["href"] }) {
  return (
    <nav aria-label="Ways to browse the directory" className="tabs mt-6">
      {BROWSE.map((way) => (
        <Link key={way.href} href={way.href} className="tab title-2" aria-current={way.href === here ? "page" : undefined}>
          {way.label}
        </Link>
      ))}
    </nav>
  );
}
