import type { Metadata } from "next";
import Link from "next/link";
import EnquiryForm from "@/components/EnquiryForm";
import { Chat, Mail, Phone } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import { ACTIONS, site } from "@/data/site";
import { pageGraph } from "@/lib/structured";

const title = "Enquire";
const description = "Ask about a ready-to-launch business on biznes.mu: send a request, or call, WhatsApp or email Khay Digital in Mauritius.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/enquire" },
  openGraph: { title, description, url: "/enquire" },
};

/**
 * Every way to ask about a business: the request form, and the quicker routes beside it. On a phone
 * the quick routes come first, because a call or a message is one tap and the form is not.
 */
export default function Enquire() {
  const { contact } = site;
  return (
    <>
      <JsonLd data={pageGraph({ type: "ContactPage", path: "/enquire", name: title, description, crumbs: [{ name: title, path: "/enquire" }] })} />
      <div className="shell pb-12 pt-16 lg:pb-16 lg:pt-24">
        <h1 className="heading-2 measure-hero">Ask about a business</h1>
        <p className="title-1 measure-hero mt-6 text-ink-subtle">Send a request and we will reply the way you choose. Or reach us directly. Asking costs nothing.</p>
      </div>

      <div className="shell grid gap-x-20 gap-y-16 pb-24 lg:grid-cols-[1.15fr_0.85fr]">
        <section aria-label="Send a request">
          <EnquiryForm />
        </section>

        <aside aria-labelledby="direct-heading" className="order-first lg:order-last lg:border-l lg:border-line-strong lg:pl-12">
          <h2 id="direct-heading" className="heading-5">
            Reach us directly
          </h2>
          <ul className="mt-6 grid gap-3">
            <li>
              <a href={contact.phoneHref} className="btn btn-quiet button-md w-full justify-between">
                <span className="inline-flex items-center gap-3">
                  <Phone className="size-5" />
                  {ACTIONS.call}
                </span>
                <span className="tabular">{contact.phone}</span>
              </a>
            </li>
            <li>
              <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-quiet button-md w-full justify-between">
                <span className="inline-flex items-center gap-3">
                  <Chat className="size-5" />
                  {ACTIONS.whatsapp}
                </span>
                <span className="tabular">{contact.phone}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="btn btn-quiet button-md w-full justify-between">
                <span className="inline-flex items-center gap-3">
                  <Mail className="size-5" />
                  {ACTIONS.email}
                </span>
                <span>{contact.email}</span>
              </a>
            </li>
          </ul>
          <p className="caption-2 mt-6 text-ink-subtle">{contact.hours}.</p>
          <p className="caption-2 measure mt-6 text-ink-subtle">
            You will be speaking to {site.builder.name}, the agency that builds every business sold here. What you send is covered by our{" "}
            <Link href="/privacy" className="text-ink underline">
              privacy notice
            </Link>
            .
          </p>
        </aside>
      </div>
    </>
  );
}
