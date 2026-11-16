import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { site } from "@/data/site";
import { pageGraph } from "@/lib/structured";

const title = "Privacy";
const description = "What biznes.mu collects when you send a request, what it is used for, and how to have it removed.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacy" },
  openGraph: { title, description, url: "/privacy" },
};

/**
 * The privacy notice, written new for this site and describing only what the site does. It is on
 * the confirm list for the owner's approval before launch.
 */
export default function Privacy() {
  const { builder, contact } = site;
  const sections: { heading: string; body: string[] }[] = [
    {
      heading: "Who we are",
      body: [`${site.name} is run by ${builder.legalName}, a company registered in Mauritius (BRN ${builder.brn}).`],
    },
    {
      heading: "What we collect",
      body: [
        "When you send a request, we receive what you type into the form: your name, the business you are asking about, a phone number or an email address, and your message if you write one.",
        "If you call, message or email us, we receive what you choose to tell us.",
      ],
    },
    {
      heading: "What we use it for",
      body: ["Only to reply to you about the business you asked about. We do not sell it, and we do not use it for advertising."],
    },
    {
      heading: "What this site does not do",
      body: ["It has no analytics, no advertising and no tracking cookies. Its typefaces are served from this site, not from another company."],
    },
    {
      heading: "Your rights",
      body: [
        `Under the Data Protection Act 2017 of Mauritius you can ask what we hold about you, and ask us to correct it or remove it. Email ${contact.email} and we will do so.`,
      ],
    },
  ];

  return (
    <>
      <JsonLd data={pageGraph({ path: "/privacy", name: title, description, crumbs: [{ name: title, path: "/privacy" }] })} />
      <div className="shell pb-24 pt-16 lg:pt-24">
        <h1 className="heading-1 measure-hero">Privacy</h1>
        <p className="title-2 measure-hero mt-6 text-ink-subtle">What this site collects, what it is used for, and how to have it removed.</p>
        <div className="mt-16 border-t border-line-strong">
          {sections.map((s) => (
            <section key={s.heading} className="grid gap-x-20 gap-y-3 border-b border-line py-8 lg:grid-cols-[0.5fr_1fr]">
              <h2 className="heading-5">{s.heading}</h2>
              <div className="grid gap-3">
                {s.body.map((p) => (
                  <p key={p} className="body-3 measure">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
