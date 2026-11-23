// What the senders share: one message ready to hand over, who a batch is from, and how each
// message went. Kept apart from sender.ts so each sender can read it without reading the others.

/** One message to one address, ready to hand over. `ref` is the queue's own number for the row, to answer by. */
export type Letter = { ref: number; to: string; subject: string; html: string; text: string; headers: Record<string, string> };
/** Who a batch is from, and a name for the batch that is the same if it is handed over twice. */
export type Envelope = { from: string; replyTo?: string; key: string };
/** How one message went. `unsure`: no plain answer came, so it may or may not have gone. */
export type Outcome = { ref: number; ok: true; id: string } | { ref: number; ok: false; why: string; unsure: boolean };

export type SenderName = "none" | "resend" | "mailgun" | "local";
export interface Sender {
  name: SenderName;
  /** True when messages can leave by it. */
  connected: boolean;
  /** Where things stand, in a sentence for the admin's page. */
  says: string;
  /** What is still to set, by the variable's name, when it is not connected. */
  missing: string[];
  /** Hand a batch over. It never throws: a failure is an outcome, with what the service said. */
  send(envelope: Envelope, letters: Letter[]): Promise<Outcome[]>;
}

export type Env = Record<string, string | undefined>;
export type Fetch = typeof fetch;

/** How long a mail service is given to answer one request. */
export const PATIENCE_MS = 20_000;
