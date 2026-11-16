import Link from "next/link";
import { ACTIONS, NAV, site } from "@/data/site";
import { Arrow, Chat, Mail, Phone } from "./Icons";
import Logo from "./Logo";

/**
 * The footer is the last page of the story: night, the one invitation again, then every way to
 * reach us with the numbers written out, and the credit.
 */
export default function SiteFooter() {
  const { contact, builder } = site;
  return (
    <footer id="site-footer" data-ground="night">
      <div className="shell section-y">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <h2 className="heading-2 measure-hero">Find the one that is yours</h2>
            <p className="title-2 measure mt-4 text-ink-subtle">Each business is sold once, to one owner.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:justify-end">
            <Link href="/businesses" className="btn btn-filled button-md">
              {ACTIONS.browse}
            </Link>
            <Link href="/enquire" className="arrow-link button-md">
              {ACTIONS.send}
              <Arrow />
            </Link>
          </div>
        </div>

        <div className="rail mt-16" aria-hidden />

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.6fr_1fr]">
          <div>
            <Logo />
            <p className="body-3 measure mt-4 text-ink-subtle">
              {site.line}. Each one is built by {builder.name} and sold to one owner.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid gap-1">
              {[...NAV, { href: "/enquire", label: ACTIONS.enquire }, { href: "/privacy", label: "Privacy" }].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="body-3 inline-flex min-h-10 items-center underline decoration-transparent transition-colors duration-300 ease-out hover:decoration-current">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="grid gap-1">
            <li>
              <a href={contact.phoneHref} className="body-3 inline-flex min-h-10 items-center gap-3 underline decoration-transparent transition-colors duration-300 ease-out hover:decoration-current">
                <Phone className="size-5 flex-none" />
                <span>
                  {ACTIONS.call}: <span className="tabular whitespace-nowrap">{contact.phone}</span>
                </span>
              </a>
            </li>
            <li>
              <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="body-3 inline-flex min-h-10 items-center gap-3 underline decoration-transparent transition-colors duration-300 ease-out hover:decoration-current">
                <Chat className="size-5 flex-none" />
                <span>
                  {ACTIONS.whatsapp}: <span className="tabular whitespace-nowrap">{contact.phone}</span>
                </span>
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="body-3 inline-flex min-h-10 items-center gap-3 underline decoration-transparent transition-colors duration-300 ease-out hover:decoration-current">
                <Mail className="size-5 flex-none" />
                <span>{contact.email}</span>
              </a>
            </li>
            <li className="caption-2 mt-2 text-ink-subtle">{contact.hours}</li>
          </ul>
        </div>

        <div className="rail mt-12" aria-hidden />

        <div className="caption-2 mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 text-ink-subtle">
          <p>
            {site.name} is a {builder.legalName} project. BRN {builder.brn}.
          </p>
          <a href={builder.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center text-ink-subtle underline decoration-transparent transition-colors duration-300 ease-out hover:decoration-current">
            <span>
              A Digital Experience by <strong className="font-semibold text-ink">Khay Digital</strong>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
