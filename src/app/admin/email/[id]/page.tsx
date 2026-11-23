import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminNav from "@/components/account/AdminNav";
import { Notice, PartHead, Stat, Stats } from "@/components/account/Bits";
import CopyBox from "@/components/account/CopyBox";
import { ActionForm, Check, Chips, Field, Submit, TextArea } from "@/components/account/Form";
import MailPreview from "@/components/account/MailPreview";
import SendRun from "@/components/account/SendRun";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { site } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { guideFacts } from "@/lib/accounts/email/guide";
import { frameOf, messageOf } from "@/lib/accounts/email/message";
import { AUDIENCE_NAMES, KIND_NAMES } from "@/lib/accounts/email/names";
import { render, toDocument, toText } from "@/lib/accounts/email/render";
import { batchSize } from "@/lib/accounts/email/sender";
import { currentSender, emailSettings, notYet } from "@/lib/accounts/email/store";
import { AUDIENCES, BLOCK_LIMITS, BLOCK_NAMES, BLOCK_TYPES, CAMPAIGN_STATUS_NAMES, RECIPIENT_STATE_NAMES, reasonSays, soundBlocks, soundProgress, type AudienceCounts, type Block, type Campaign, type Recipient, type RecipientState } from "@/lib/accounts/email/types";
import { UUID } from "@/lib/accounts/form";
import { db } from "@/lib/accounts/server";
import { requireAdmin } from "@/lib/accounts/session";
import { when } from "@/lib/accounts/types";
import { count } from "@/lib/format";
import { monthName } from "@/lib/shop";
import { markByHand, queueCampaign, removeCampaign, retryFailed, saveCampaign, sendBatch, sendTestMessage, stepCampaign } from "../actions";

export const metadata: Metadata = { title: "A message to the list", robots: { index: false, follow: false } };

/** How many of a campaign's addresses one page shows. The file holds them all. */
const SHOWN = 200;
const STATES: RecipientState[] = ["sent", "failed", "skipped", "queued", "sending"];

/** One part of a message, in the form that writes it. */
function Part({ block, i, last }: { block: Block; i: number; last: boolean }) {
  const n = i + 1;
  return (
    <div role="group" aria-labelledby={`part-${i}`} className="mail-part grid gap-4" data-part={block.type}>
      <p id={`part-${i}`} className="title-2">
        Part {n}: {BLOCK_NAMES[block.type].toLowerCase()}
      </p>
      <input type="hidden" name={`b${i}.type`} value={block.type} />
      {block.type === "heading" && <Field name={`b${i}.text`} label="The heading" defaultValue={block.text} hint={`Up to ${BLOCK_LIMITS.heading} characters.`} />}
      {block.type === "paragraph" && <TextArea name={`b${i}.text`} label="The paragraph" rows={4} maxLength={BLOCK_LIMITS.paragraph} defaultValue={block.text} hint="Plain words. A new line here is a new line in the message." />}
      {block.type === "button" && (
        <>
          <Field name={`b${i}.label`} label="What the button says" defaultValue={block.label} hint={`Up to ${BLOCK_LIMITS.label} characters.`} />
          <Field name={`b${i}.href`} label="Where it leads" defaultValue={block.href} hint="A page of this site, such as /shop, or a full address that begins https://" />
        </>
      )}
      {block.type === "line" && <p className="caption-1 text-ink-faint">A thin line across the message, to set what follows apart.</p>}
      <div className="flex flex-wrap gap-2">
        {i > 0 && (
          <Submit name="do" value={`up:${i}`} className="btn btn-quiet btn-sm button-sm" busy="Moving">
            Move up<span className="sr-only">: part {n}</span>
          </Submit>
        )}
        {!last && (
          <Submit name="do" value={`down:${i}`} className="btn btn-quiet btn-sm button-sm" busy="Moving">
            Move down<span className="sr-only">: part {n}</span>
          </Submit>
        )}
        <Submit name="do" value={`remove:${i}`} className="btn btn-quiet btn-sm button-sm" busy="Taking out">
          Take out<span className="sr-only">: part {n}</span>
        </Submit>
      </div>
    </div>
  );
}

export default async function CampaignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ go?: string; show?: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Email" />;
  const { id } = await params;
  const viewer = await requireAdmin(`/admin/email/${id}`);
  if (!UUID.test(id)) notFound();
  const { go, show } = await searchParams;
  const shown = STATES.includes(show as RecipientState) ? (show as RecipientState) : undefined;
  const supabase = await db();
  const [{ data: row }, settings, sender] = await Promise.all([supabase.from("email_campaigns").select("*").eq("id", id).maybeSingle(), emailSettings(supabase), currentSender()]);
  if (!row) notFound();
  const campaign = row as Campaign;
  const { status, kind } = campaign;
  const own = kind === "confirm";
  const started = campaign.started_at !== null;
  const list = supabase.from("email_recipients").select("id, email, state, reason, unsure, provider_id, done_at").eq("campaign_id", id).order("id").limit(SHOWN);
  const [{ data: progressRow }, { data: countsRow }, { data: recipientRows }, { data: who }, facts] = await Promise.all([
    supabase.rpc("email_progress", { campaign: id }),
    !started && !own ? supabase.rpc("email_audience_counts", { campaign: id, by_hand: !sender.connected }) : Promise.resolve({ data: null }),
    started ? (shown ? list.eq("state", shown) : list) : Promise.resolve({ data: [] }),
    supabase.from("profiles").select("id, name, email").in("id", [campaign.created_by, campaign.started_by].filter((p): p is string => Boolean(p))),
    kind === "guide" && campaign.edition && !started ? guideFacts(campaign.edition) : null,
  ]);
  const progress = soundProgress(progressRow);
  const counts = (countsRow ?? { to_send: 0, suppressed: 0, unconfirmed: 0 }) as AudienceCounts;
  const recipients = (recipientRows ?? []) as Pick<Recipient, "id" | "email" | "state" | "reason" | "unsure" | "provider_id" | "done_at">[];
  const names = new Map((who ?? []).map((p) => [p.id as string, (p.name as string) || (p.email as string)]));
  const missing = notYet(settings);
  const blocks = soundBlocks(campaign.blocks);
  const title = own ? KIND_NAMES.confirm : campaign.subject || "A message with no subject yet";

  // The message as it will look. With a sender each reader has their own link to leave; sent by
  // hand to many at once, the message tells them to reply. The page shows the one that applies.
  const message = messageOf(campaign);
  const postal = settings.postal_address || "The sender's postal address is printed here once it is set.";
  const linked = sender.connected || (started && !campaign.by_hand);
  const drawn = render(message, frameOf(campaign.audience, { ...settings, postal_address: postal }, linked ? "your-own-link" : null));
  const byHand = frameOf(campaign.audience, { ...settings, postal_address: postal }, null);
  const retriable = progress.failed - progress.unsure;
  const leftOut = [counts.suppressed ? `${count(counts.suppressed)} kept from being written to` : "", counts.unconfirmed ? `${count(counts.unconfirmed)} not confirmed` : ""].filter(Boolean).join(" and ");

  // The message itself, to look at. Before it is sent it stands between writing and sending; once
  // sending has begun, how far it has got comes first and this last.
  const look = (
    <section aria-labelledby="look" className={`${(status === "draft" && !own) || started || status === "cancelled" ? "mt-12" : ""} scroll-mt-24`}>
      <PartHead
        id="look"
        title={started ? "What was sent" : "How it will look"}
        line={
          own
            ? "The site writes this message itself: it asks an address to confirm, with that reader's own link, and says nothing else."
            : status === "draft"
              ? "The message as it is saved, drawn as a mail program draws it. Save the draft to see a change here."
              : "Drawn as a mail program draws it."
        }
      />
      <dl className="facts body-3 mt-6 max-w-2xl">
        <dt>Subject</dt>
        <dd data-subject>{message.subject || "None yet"}</dd>
        <dt>After the subject</dt>
        <dd>{message.preheader || "Nothing: a mail program shows the first words of the message."}</dd>
        <dt>From</dt>
        <dd className="break-all">{settings.from_email ? `${settings.from_name} <${settings.from_email}>` : "Not set yet"}</dd>
      </dl>
      {blocks.length === 0 && !own ? (
        <p className="note body-3 mt-6 max-w-2xl">There is nothing to look at yet.</p>
      ) : (
        <div className="mt-6 grid gap-6">
          <MailPreview mark={drawn.light} label="The message as it will look" />
          <details className="max-w-2xl">
            <summary className="body-3 inline-flex min-h-11 items-center text-link underline">In a mail program set to dark</summary>
            <div className="mt-3">
              <MailPreview mark={drawn.dark} label="The message as it will look in a mail program set to dark" />
            </div>
          </details>
          <div>
            <h3 className="title-2">As plain text</h3>
            <p className="caption-1 mt-1 text-ink-faint">The twin that goes with it, for a mail program that shows no HTML.</p>
            <pre className="mail-text body-3 mt-3" data-plain-text tabIndex={0} aria-label="The message as plain text">
              {drawn.text}
            </pre>
          </div>
        </div>
      )}
    </section>
  );

  return (
    <>
      <PageHead title={title} path={[{ href: "/admin", label: "Admin" }, { href: "/admin/email", label: "Email" }, { label: own ? KIND_NAMES.confirm : "A message" }]} lede={`${KIND_NAMES[kind]}. To: ${AUDIENCE_NAMES[campaign.audience].toLowerCase()}.`}>
        <p className="caption-1 mt-4 flex flex-wrap items-center gap-2 text-ink-subtle">
          <span className={`tag ${status === "sent" || status === "sending" ? "tag-lit" : ""}`} data-status={status}>
            {CAMPAIGN_STATUS_NAMES[status]}
            {status === "sent" && campaign.by_hand ? ", by hand" : ""}
          </span>
          <span>
            Begun by {names.get(campaign.created_by ?? "") ?? "someone no longer here"}, {when(campaign.created_at)}.
            {campaign.started_at ? ` ${campaign.by_hand ? "Marked as sent" : "Sent"} by ${names.get(campaign.started_by ?? "") ?? "someone no longer here"}, ${when(campaign.started_at)}.` : ""}
          </span>
        </p>
      </PageHead>
      <div className="shell">
        <AdminNav role={viewer.role} current="/admin/email" />

        {started && (
          <Stats>
            <Stat label="Sent" figure={count(progress.sent)} href="?show=sent#record" />
            <Stat label="Waiting" figure={count(progress.queued + progress.sending)} href="?show=queued#record" />
            <Stat label="Failed" figure={count(progress.failed)} note={progress.unsure ? `${count(progress.unsure)} may have gone.` : undefined} href="?show=failed#record" />
            <Stat label="Left out" figure={count(progress.skipped)} href="?show=skipped#record" />
          </Stats>
        )}

        {status === "draft" && !own && (
          <section aria-labelledby="write" className="max-w-3xl scroll-mt-24">
            <PartHead id="write" title="Write it" line="A subject, the line a mail program shows after it, and the parts of the message in order. No HTML: each part is plain words." />
            {facts && (
              <div className="note body-3 mt-6" data-guide-facts>
                <p className="title-2">What the site knows of the {facts.month} edition today</p>
                <p className="mt-1">
                  {facts.terms} Its sponsors have paid Rs {count(facts.raised)} so far. {facts.built ? "Its file has been made." : `Its file has not been made yet: the site is showing the ${monthName(facts.showing)} edition.`} If the message says otherwise, change the message.
                </p>
              </div>
            )}
            <div className="card mt-6">
              <ActionForm action={saveCampaign}>
                {/* The first button of the form: pressing Enter in a field saves, and never moves or takes out a part. */}
                <button type="submit" name="do" value="save" hidden tabIndex={-1} />
                <input type="hidden" name="campaign" value={campaign.id} />
                {/* The fields are made again whenever the draft is saved, so each begins with what is kept; the form's own answer stays. */}
                <div key={campaign.updated_at} className="contents">
                  <input type="hidden" name="count" value={blocks.length} />
                  <Chips name="audience" legend="Who it goes to" defaultValue={campaign.audience} choices={AUDIENCES.map((value) => ({ value, label: AUDIENCE_NAMES[value] }))} />
                  <Field name="subject" label="The subject" defaultValue={campaign.subject} hint={`Up to ${BLOCK_LIMITS.subject} characters.`} />
                  <Field name="preheader" label="The line after the subject" optional defaultValue={campaign.preheader} hint="A mail program shows it beside the subject, before the message is opened." />
                  {blocks.length === 0 && <p className="note body-3">The message has no parts yet. Add one below.</p>}
                  {blocks.map((block, i) => (
                    <Part key={i} block={block} i={i} last={i === blocks.length - 1} />
                  ))}
                  <fieldset>
                    <legend className="title-2">Add a part at the end</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {BLOCK_TYPES.map((type) => (
                        <Submit key={type} name="do" value={`add:${type}`} className="btn btn-quiet btn-sm button-sm" busy="Adding">
                          {BLOCK_NAMES[type]}
                        </Submit>
                      ))}
                    </div>
                  </fieldset>
                  <div>
                    <Submit name="do" value="save">
                      Save the draft
                    </Submit>
                  </div>
                </div>
              </ActionForm>
            </div>
          </section>
        )}

        {!started && look}

        {status === "draft" && !own && (
          <section aria-labelledby="ready" className="mt-12 max-w-3xl scroll-mt-24">
            <PartHead id="ready" title="When it is written" line="Calling it ready changes nothing for its readers: it says the words are final, and opens the way to send it. It can be made a draft again until it is sent." />
            <div className="mt-6 flex flex-wrap items-start gap-3">
              <ActionForm action={stepCampaign} className="grid gap-3">
                <input type="hidden" name="campaign" value={campaign.id} />
                <input type="hidden" name="to" value="ready" />
                <div>
                  <Submit busy="One moment">It is ready</Submit>
                </div>
              </ActionForm>
              <ActionForm action={removeCampaign} className="grid gap-3">
                <input type="hidden" name="campaign" value={campaign.id} />
                <div>
                  <Submit className="btn btn-quiet button-md" busy="Taking it out">
                    Take this message out
                  </Submit>
                </div>
              </ActionForm>
            </div>
          </section>
        )}

        {status === "ready" && (
          <section aria-labelledby="send" className="mt-12 max-w-3xl scroll-mt-24">
            <PartHead id="send" title="Send it" />
            <div className="mt-6 grid gap-6">
              <p className="body-2" data-audience>
                Today it would go to <strong className="data-1">{count(counts.to_send)}</strong> {counts.to_send === 1 ? "address" : "addresses"}
                {leftOut ? `, with ${leftOut} left out` : ""}.
              </p>
              {missing.length > 0 && (
                <Notice bad>
                  It cannot be sent yet: {missing.join(", ")} {missing.length === 1 ? "is" : "are"} not set. {viewer.role === "superadmin" ? "Set them on the Email page, under “Who a message is from”." : "The superadmin sets them on the Email page."}
                </Notice>
              )}
              {sender.connected ? (
                <>
                  <Notice>{sender.says} Each address is sent its own copy, with its own link to leave.</Notice>
                  <div className="flex flex-wrap items-start gap-3">
                    <ActionForm action={queueCampaign} className="grid gap-3">
                      <input type="hidden" name="campaign" value={campaign.id} />
                      <div>
                        <Submit busy="Queueing">Send</Submit>
                      </div>
                    </ActionForm>
                    <ActionForm action={sendTestMessage} className="grid gap-3">
                      <input type="hidden" name="campaign" value={campaign.id} />
                      <div>
                        <Submit className="btn btn-ink button-md" busy="Sending">
                          Send me a test message
                        </Submit>
                      </div>
                      <p className="caption-1 text-ink-faint">One copy, to {viewer.email}.</p>
                    </ActionForm>
                  </div>
                  <p className="caption-1 text-ink-faint">Send writes one row for each address, then this page sends them {count(batchSize())} at a time. You can stop and carry on; no address is written to twice.</p>
                </>
              ) : (
                <div className="grid gap-6" data-by-hand>
                  <Notice bad>{sender.says}</Notice>
                  <p className="body-3 text-ink-subtle">
                    So this message goes out by hand: from your own mail program, to the addresses in the file, with every address in the hidden-copy line (Bcc) so that no reader sees another&rsquo;s. Its foot tells readers to reply to {byHand.leave && "reply" in byHand.leave ? byHand.leave.reply : site.contact.email} to leave the list; take those addresses off on the Subscribers page. To connect a sender instead, set EMAIL_PROVIDER and the service&rsquo;s own variables on the server: the Email page lists them.
                  </p>
                  {missing.includes("the sender's postal address") ? null : (
                    <>
                      <p className="flex flex-wrap gap-3">
                        <a href={`/admin/email/${campaign.id}/export?as=csv`} className="btn btn-ink button-md" download>
                          Take its addresses as a file
                        </a>
                        <a href={`/admin/email/${campaign.id}/export?as=html`} className="btn btn-quiet button-md" download>
                          The message as an HTML file
                        </a>
                        <a href={`/admin/email/${campaign.id}/export?as=txt`} className="btn btn-quiet button-md" download>
                          As a text file
                        </a>
                      </p>
                      <CopyBox label="The subject" value={message.subject} rows={1} />
                      <CopyBox label="The message as HTML" value={toDocument(message, byHand)} rows={8} hint="For a mail program that takes HTML. It is the message drawn above." />
                      <CopyBox label="The message as plain text" value={toText(message, byHand)} rows={8} />
                      <div className="card card-panel">
                        <h3 className="title-1">Once it has gone</h3>
                        <p className="body-3 mt-1 text-ink-subtle">Marking it writes the addresses the file holds today into the record as sent, so take the file and mark the message on the same day.</p>
                        <ActionForm action={markByHand} className="mt-4 grid gap-3">
                          <input type="hidden" name="campaign" value={campaign.id} />
                          <Check name="sure" label="It has gone from my own mail program" />
                          <div>
                            <Submit busy="Marking">Mark as sent by hand</Submit>
                          </div>
                        </ActionForm>
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-start gap-3 border-t border-line pt-6">
                <ActionForm action={stepCampaign} className="grid gap-3" quiet>
                  <input type="hidden" name="campaign" value={campaign.id} />
                  <input type="hidden" name="to" value="draft" />
                  <div>
                    <Submit className="btn btn-quiet button-md" busy="One moment">
                      Make it a draft again
                    </Submit>
                  </div>
                </ActionForm>
                <ActionForm action={stepCampaign} className="grid gap-3" quiet>
                  <input type="hidden" name="campaign" value={campaign.id} />
                  <input type="hidden" name="to" value="cancelled" />
                  <div>
                    <Submit className="btn btn-quiet button-md" busy="Cancelling">
                      Cancel this message
                    </Submit>
                  </div>
                </ActionForm>
              </div>
            </div>
          </section>
        )}

        {status === "sending" && (
          <section aria-labelledby="send" className="mt-8 max-w-3xl scroll-mt-24">
            <PartHead id="send" title="Sending" line={`${count(batchSize())} addresses a batch. Each batch is one request to the server; the record below grows as they go.`} />
            <div className="card mt-6">
              <SendRun action={sendBatch} campaign={campaign.id} start={{ progress, said: "", stopped: false, batches: 0 }} go={go === "1"} />
            </div>
            <div className="mt-6">
              <ActionForm action={stepCampaign} className="grid gap-3">
                <input type="hidden" name="campaign" value={campaign.id} />
                <input type="hidden" name="to" value="cancelled" />
                <div>
                  <Submit className="btn btn-quiet button-md" busy="Cancelling">
                    Cancel the rest
                  </Submit>
                </div>
                <p className="caption-1 text-ink-faint">Nobody still waiting is written to. What has gone has gone, and stays on the record.</p>
              </ActionForm>
            </div>
          </section>
        )}

        {(status === "sent" || status === "cancelled") && (
          <section aria-labelledby="after" className={`${started ? "mt-8" : ""} max-w-3xl scroll-mt-24`}>
            <PartHead id="after" title={status === "sent" ? (campaign.by_hand ? "Sent by hand" : "Sent") : "Cancelled"} />
            <div className="mt-6 grid gap-4">
              {status === "sent" && (
                <Notice>
                  {campaign.by_hand ? "It went from your own mail program to" : "It went to"} {count(progress.sent)} {progress.sent === 1 ? "address" : "addresses"}
                  {progress.skipped ? `, with ${count(progress.skipped)} left out` : ""}
                  {progress.failed ? ` and ${count(progress.failed)} that failed` : ""}. {campaign.finished_at ? `Finished ${when(campaign.finished_at)}.` : ""}
                </Notice>
              )}
              {status === "cancelled" && <Notice>{started ? `Cancelled after ${count(progress.sent)} ${progress.sent === 1 ? "address" : "addresses"}. Nobody who was still waiting was written to.` : "Cancelled before it was sent to anyone."}</Notice>}
              {status === "sent" && !campaign.by_hand && retriable > 0 && (
                <ActionForm action={retryFailed} className="grid gap-3">
                  <input type="hidden" name="campaign" value={campaign.id} />
                  <p className="body-3 text-ink-subtle">
                    {count(retriable)} {retriable === 1 ? "address was" : "addresses were"} plainly refused by the mail service, and did not get the message. Put right what it said, then queue them again.
                    {progress.unsure ? ` The ${count(progress.unsure)} whose batch got no plain answer may have had it, and are left as they are.` : ""}
                  </p>
                  <div>
                    <Submit className="btn btn-ink button-md" busy="Queueing">
                      Queue the refused again
                    </Submit>
                  </div>
                </ActionForm>
              )}
              {status === "cancelled" && !started && (
                <div className="flex flex-wrap items-start gap-3">
                  <ActionForm action={stepCampaign} className="grid gap-3">
                    <input type="hidden" name="campaign" value={campaign.id} />
                    <input type="hidden" name="to" value="draft" />
                    <div>
                      <Submit className="btn btn-ink button-md" busy="One moment">
                        Make it a draft again
                      </Submit>
                    </div>
                  </ActionForm>
                  <ActionForm action={removeCampaign} className="grid gap-3">
                    <input type="hidden" name="campaign" value={campaign.id} />
                    <div>
                      <Submit className="btn btn-quiet button-md" busy="Taking it out">
                        Take this message out
                      </Submit>
                    </div>
                  </ActionForm>
                </div>
              )}
            </div>
          </section>
        )}

        {started && (
          <section aria-labelledby="record" className="mt-12 scroll-mt-24">
            <PartHead id="record" title="Who it went to" line="One row for each address, as it was when the message was queued, with how it went. An address is here once.">
              <a href={`/admin/email/${campaign.id}/export?as=record`} className="btn btn-quiet btn-sm button-sm" download>
                The record as a file
              </a>
            </PartHead>
            <nav aria-label="Narrow these addresses" className="filters mt-6">
              <Link prefetch={false} href={`/admin/email/${campaign.id}#record`} className="filter body-3" aria-current={shown ? undefined : "true"}>
                All
              </Link>
              {STATES.filter((s) => s !== "sending").map((s) => (
                <Link prefetch={false} key={s} href={`/admin/email/${campaign.id}?show=${s}#record`} className="filter body-3" aria-current={shown === s ? "true" : undefined}>
                  {RECIPIENT_STATE_NAMES[s]}
                </Link>
              ))}
            </nav>
            {recipients.length === 0 ? (
              <p className="note body-3 mt-4 max-w-xl">{shown ? "No address stands that way." : "No address yet."}</p>
            ) : (
              <>
                <p className="caption-1 mt-4 text-ink-faint" role="status">
                  {count(recipients.length)} {recipients.length === 1 ? "address" : "addresses"}
                  {shown ? `: ${RECIPIENT_STATE_NAMES[shown].toLowerCase()}` : ""}.{recipients.length === SHOWN ? ` Only the first ${count(SHOWN)} are shown: the file holds them all.` : ""}
                </p>
                <div className="table-wrap mt-3" tabIndex={0} role="region" aria-label="Who it went to">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Email address</th>
                        <th scope="col">How it went</th>
                        <th scope="col">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map((r) => (
                        <tr key={r.id} data-state={r.state}>
                          <th scope="row" className="break-all">
                            {r.email}
                          </th>
                          <td data-label="How it went">
                            <span className={`tag ${r.state === "sent" ? "tag-lit" : ""}`}>{RECIPIENT_STATE_NAMES[r.state]}</span>
                            {reasonSays(r) && <span className="mt-1 block text-ink-subtle">{reasonSays(r)}</span>}
                          </td>
                          <td data-label="When" className="whitespace-nowrap">
                            {r.done_at ? when(r.done_at) : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        {started && look}
      </div>
    </>
  );
}
