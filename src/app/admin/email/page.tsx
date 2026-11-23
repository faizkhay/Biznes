import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/account/AdminNav";
import { Empty, Notice, PartHead, Stat, Stats } from "@/components/account/Bits";
import { ActionForm, Chips, Field, Select, Submit, TextArea } from "@/components/account/Form";
import { Mail } from "@/components/account/Icons";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { PUBLICATIONS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { editions, guideFacts } from "@/lib/accounts/email/guide";
import { AUDIENCE_NAMES, KIND_NAMES } from "@/lib/accounts/email/names";
import { currentSender, emailSettings, emailStatus, notYet } from "@/lib/accounts/email/store";
import { CAMPAIGN_STATUS_NAMES, NO_STATUS, WRITE_TO, WRITE_TO_NAMES, type Campaign } from "@/lib/accounts/email/types";
import { db } from "@/lib/accounts/server";
import { requireAdmin } from "@/lib/accounts/session";
import { when } from "@/lib/accounts/types";
import { count } from "@/lib/format";
import { monthName } from "@/lib/shop";
import { askConfirm, saveEmailSettings, startCampaign, startGuide } from "./actions";

export const metadata: Metadata = { title: "Email", robots: { index: false, follow: false } };

const SENDER_NAMES = { none: "None", resend: "Resend", mailgun: "Mailgun", local: "Local, for the checks" } as const;
const SAID: Record<string, string> = { removed: "The message is taken out." };

/** What to set to connect a sender, by the variable's own name. The README's "Email" has the whole of it. */
const TO_SET = [
  { name: "Resend", sets: ["EMAIL_PROVIDER=resend", "RESEND_API_KEY", "RESEND_WEBHOOK_SECRET"] },
  { name: "Mailgun", sets: ["EMAIL_PROVIDER=mailgun", "MAILGUN_API_KEY", "MAILGUN_DOMAIN", "MAILGUN_REGION (eu, for a domain made in the EU region)", "MAILGUN_WEBHOOK_SIGNING_KEY"] },
];

export default async function EmailPage({ searchParams }: { searchParams: Promise<{ said?: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Email" />;
  const viewer = await requireAdmin("/admin/email");
  const { said } = await searchParams;
  const supabase = await db();
  const offered = editions();
  const [sender, settings, counted, { data: rows, error }, facts] = await Promise.all([
    currentSender(),
    emailSettings(supabase),
    emailStatus(supabase),
    supabase.from("email_campaigns").select("*").order("created_at", { ascending: false }).limit(100),
    offered ? guideFacts(offered.coming) : null,
  ]);
  const status = counted ?? NO_STATUS;
  const campaigns = (rows ?? []) as Campaign[];
  const missing = notYet(settings);
  const superadmin = viewer.role === "superadmin";
  const sentCount = campaigns.filter((c) => c.status === "sent").length;

  return (
    <>
      <PageHead
        title="Email"
        path={[{ href: "/admin", label: "Admin" }, { label: "Email" }]}
        lede={`Messages to the list: each edition of the ${PUBLICATIONS.guide.short}, the ${PUBLICATIONS.magazine.short} when it begins, a note. They are written here, looked at here, and sent from here once a sender is connected. Until then they go out by hand, and the record still holds.`}
      />
      <div className="shell">
        <AdminNav role={viewer.role} current="/admin/email" />
        {said && SAID[said] && <Notice className="mb-8">{SAID[said]}</Notice>}
        {(error || !counted) && (
          <Notice bad className="mb-8">
            The email tables could not be read. If the database has not had part 14 of the migrations applied, apply it; otherwise try again in a moment.
          </Notice>
        )}
        <Stats>
          <Stat label="Sender" figure={<span className="heading-3">{SENDER_NAMES[sender.name]}</span>} note={sender.connected ? "The site sends its own email." : "Nothing leaves the site."} href="#stand" />
          <Stat label="On the list" figure={count(status.subscribers)} note={`${count(status.confirmed)} confirmed.`} href="/admin/subscribers" />
          <Stat label="Not written to" figure={count(status.suppressed)} note="Bounced, complained, or asked us." href="/admin/subscribers#suppressed" />
          <Stat label="Messages sent" figure={count(sentCount)} href="#messages" />
        </Stats>

        <section aria-labelledby="stand" className="mt-12 max-w-3xl scroll-mt-24">
          <PartHead id="stand" title="Where things stand" />
          <div className="mt-6 grid gap-4">
            <Notice bad={!sender.connected}>{sender.says}</Notice>
            {!sender.connected && (
              <>
                <p className="body-3 text-ink-subtle">
                  Until a sender is connected: people still join the list, and each address is kept as not confirmed, because no message can ask it to confirm. A message is written and looked at here as it will be later. To send it, take its addresses as a file and its HTML and text from its own page, send it from your own mail program, and mark it as sent by hand.
                </p>
                <div>
                  <h3 className="title-2">To connect a sender, set these on the server</h3>
                  <dl className="facts body-3 mt-3">
                    {TO_SET.map((service) => (
                      <div key={service.name} className="contents">
                        <dt>{service.name}</dt>
                        <dd>
                          <ul className="grid gap-1">
                            {service.sets.map((line) => (
                              <li key={line} className="data-2 break-all">
                                {line}
                              </li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="caption-1 mt-3 text-ink-faint">One service, not both. The README&rsquo;s part on email has each step, the DNS records each service asks for, and the address to give it for what it says afterwards.</p>
                </div>
              </>
            )}
            {missing.length > 0 && (
              <Notice bad>
                No message may be sent yet: {missing.join(", ")} {missing.length === 1 ? "is" : "are"} not set. {superadmin ? "Set them below." : "The superadmin sets them."}
              </Notice>
            )}
            {sender.connected && !status.proof && (
              <Notice bad>
                The database does not hold the hash of the site&rsquo;s word (README, &ldquo;Setting up the project&rdquo;, step 8). Until it does, nobody who joins is sent a link to confirm, and nothing a mail service says afterwards about a bounce or a complaint is believed.
              </Notice>
            )}
            {status.to_ask > 0 && (
              <div className="card card-panel">
                <h3 className="title-1">
                  {count(status.to_ask)} {status.to_ask === 1 ? "address has" : "addresses have"} never been asked to confirm
                </h3>
                <p className="body-3 mt-1 text-ink-subtle">
                  {sender.connected
                    ? "They joined before the site could write to them. Ask them once: each is sent one message with a link, and is not asked again. Those who press it are confirmed."
                    : "They joined while the site could not write to them. Once a sender is connected they can be asked, once, from here."}
                </p>
                {sender.connected && missing.length === 0 && (
                  <ActionForm action={askConfirm} className="mt-4 grid gap-3">
                    <div>
                      <Submit className="btn btn-ink button-md" busy="Queueing">
                        Ask them to confirm
                      </Submit>
                    </div>
                  </ActionForm>
                )}
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="begin" className="mt-12 scroll-mt-24">
          <PartHead id="begin" title="Begin a message" line="A message begins as a draft. Nothing is sent until you have looked at it and pressed Send on its own page." />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="card">
              <h3 className="title-1">The {PUBLICATIONS.guide.short}</h3>
              {offered && facts ? (
                <>
                  <p className="body-3 mt-1 text-ink-subtle">
                    Begun with what the site knows: the month, the guide&rsquo;s name and where it is, and whether the edition is free or sold. For {facts.month}: {facts.terms}
                  </p>
                  <ActionForm action={startGuide} className="mt-4 grid gap-4">
                    <Select name="edition" label="The edition" choices={offered.all.map((m) => ({ value: m, label: m === offered.coming ? `${monthName(m)}, the coming one` : monthName(m) }))} defaultValue={offered.coming} />
                    <div>
                      <Submit busy="Starting">Start the {PUBLICATIONS.guide.short}&rsquo;s message</Submit>
                    </div>
                  </ActionForm>
                </>
              ) : (
                <p className="body-3 mt-1 text-ink-subtle">The guide has not been made yet, so there is no edition to announce.</p>
              )}
            </div>
            <div className="card">
              <h3 className="title-1">Another message</h3>
              <p className="body-3 mt-1 text-ink-subtle">It begins empty: you write its subject and its parts.</p>
              <ActionForm action={startCampaign} className="mt-4 grid gap-4">
                <Chips
                  name="kind"
                  legend="What it is for"
                  defaultValue="note"
                  choices={[
                    { value: "note", label: KIND_NAMES.note },
                    { value: "magazine", label: KIND_NAMES.magazine },
                    { value: "guide", label: KIND_NAMES.guide },
                  ]}
                />
                <div>
                  <Submit className="btn btn-ink button-md" busy="Starting">
                    Start a message
                  </Submit>
                </div>
              </ActionForm>
            </div>
          </div>
        </section>

        <section aria-labelledby="messages" className="mt-12 scroll-mt-24">
          <PartHead id="messages" title="Messages" line="The latest first. Each opens on its own page: to write it, to look at it, to send it, and to see who it went to." />
          {campaigns.length === 0 ? (
            <div className="mt-6">
              <Empty icon={<Mail />} title="No message yet">
                Begin one above. It stays a draft until you call it ready.
              </Empty>
            </div>
          ) : (
            <ul className="rows mt-6">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <article className="row listing" data-campaign={c.id}>
                    <span className="listing-icon listing-icon-quiet" aria-hidden>
                      <Mail />
                    </span>
                    <div className="min-w-0">
                      <p className="caption-1 flex flex-wrap items-center gap-2 text-ink-faint">
                        <span className={`tag ${c.status === "sent" || c.status === "sending" ? "tag-lit" : ""}`}>
                          {CAMPAIGN_STATUS_NAMES[c.status]}
                          {c.status === "sent" && c.by_hand ? ", by hand" : ""}
                        </span>
                        <span>{KIND_NAMES[c.kind]}</span>
                      </p>
                      <h3 className="title-1 mt-2">
                        <Link prefetch={false} href={`/admin/email/${c.id}`} className="row-title">
                          {c.kind === "confirm" ? KIND_NAMES.confirm : c.subject || "A message with no subject yet"}
                        </Link>
                      </h3>
                      <p className="body-3 mt-1 text-ink-subtle">
                        To: {AUDIENCE_NAMES[c.audience].toLowerCase()}. {c.finished_at ? `Finished ${when(c.finished_at)}.` : c.started_at ? `Begun ${when(c.started_at)}.` : `Last changed ${when(c.updated_at)}.`}
                      </p>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="settings" className="mt-12 max-w-3xl scroll-mt-24">
          <PartHead id="settings" title="Who a message is from" line="Every message ends with who sent it, why its reader has it, the way to leave the list, and the sender's postal address. None may be sent while that address is empty." />
          {superadmin ? (
            <div className="card mt-6">
              <ActionForm action={saveEmailSettings}>
                <Field name="from_name" label="The name it comes from" defaultValue={settings.from_name} hint="As a reader's inbox shows it." />
                <Field name="from_email" label="The address it comes from" type="email" inputMode="email" defaultValue={settings.from_email} hint="An address at the domain you have verified with the mail service." />
                <Field name="reply_to" label="The address replies go to" type="email" inputMode="email" optional defaultValue={settings.reply_to} hint="Someone reads it. A message sent by hand tells its readers to reply to leave the list." />
                <TextArea name="postal_address" label="The sender's postal address" rows={3} maxLength={300} defaultValue={settings.postal_address} hint="Where the sender can be written to by post, a line to a line. It is printed at the foot of every message." />
                <Chips name="write_to" legend="Who is written to" defaultValue={settings.write_to} choices={WRITE_TO.map((value) => ({ value, label: WRITE_TO_NAMES[value] }))} />
                <p className="caption-1 max-w-prose text-ink-faint">
                  The first is how the site begins: while no sender is connected nobody can be asked to confirm, so a message sent by hand goes to every address that is not kept from being written to; once the site sends for itself, only confirmed addresses are written to. An address that bounced, complained or asked us is never written to, whichever you choose.
                </p>
                <div>
                  <Submit>Save these</Submit>
                </div>
              </ActionForm>
            </div>
          ) : (
            <dl className="facts body-3 mt-6">
              <dt>From</dt>
              <dd className="break-all">{settings.from_email ? `${settings.from_name} <${settings.from_email}>` : "Not set"}</dd>
              <dt>Replies go to</dt>
              <dd className="break-all">{settings.reply_to || "Not set"}</dd>
              <dt>Postal address</dt>
              <dd className="whitespace-pre-line">{settings.postal_address || "Not set"}</dd>
              <dt>Who is written to</dt>
              <dd>{WRITE_TO_NAMES[settings.write_to]}</dd>
            </dl>
          )}
          <p className="caption-1 mt-4 text-ink-faint">{superadmin ? (settings.updated_at ? `Last changed ${when(settings.updated_at)}. Every change is on the record.` : "Every change is on the record.") : "The superadmin changes these."}</p>
        </section>
      </div>
    </>
  );
}
