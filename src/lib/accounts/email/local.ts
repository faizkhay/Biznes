// A sender for the checks, and for nothing else. It posts each batch as JSON to an address on
// this machine, where the browser check listens (scripts/accounts-e2e.mjs), so a campaign can be
// proved end to end with no mail service and no message leaving. An address that is not on this
// machine is refused when the variables are read, so it cannot be pointed anywhere by mistake.
//
// The listener answers {"results": [{"ref": 12, "ok": true, "id": "..."}, {"ref": 13, "ok":
// false, "why": "...", "unsure": false}]} to say how each went, or anything else that is a 2xx to
// say all went. While nothing answers at the address the sender counts as not connected: the
// check uses that to see the site with no sender and with one, in one run.
import type { Envelope, Fetch, Letter, Outcome, Sender } from "./letter";

/** The address, if it is one on this machine; nothing otherwise. */
export function localUrl(address: string | undefined): string | undefined {
  try {
    const url = new URL((address ?? "").trim());
    return url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost") ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** True while something answers at the address. */
export async function localAnswers(url: string, fetcher: Fetch = fetch): Promise<boolean> {
  try {
    return (await fetcher(url, { method: "GET", signal: AbortSignal.timeout(800), cache: "no-store" })).ok;
  } catch {
    return false;
  }
}

export function localSender(url: string, fetcher: Fetch): Sender {
  return {
    name: "local",
    connected: true,
    says: "A local sender is connected, for the checks: messages go to this machine and nowhere else.",
    missing: [],
    async send(envelope: Envelope, letters: Letter[]): Promise<Outcome[]> {
      const all = (why: string, unsure: boolean): Outcome[] => letters.map((l) => ({ ref: l.ref, ok: false, why, unsure }));
      let response: Response;
      try {
        response = await fetcher(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...envelope, letters }), signal: AbortSignal.timeout(10_000) });
      } catch {
        return all("The local sender did not answer.", true);
      }
      let answer: { results?: { ref?: number; ok?: boolean; id?: string; why?: string; unsure?: boolean }[]; message?: string } = {};
      try {
        answer = (await response.json()) as typeof answer;
      } catch {
        // Any 2xx with no list means every message went.
      }
      if (!response.ok) return all(`The local sender said: ${answer.message ?? response.statusText}`.slice(0, 280), response.status >= 500);
      const said = new Map((answer.results ?? []).map((r) => [r.ref, r]));
      return letters.map((l) => {
        const r = said.get(l.ref);
        if (!r || r.ok !== false) return { ref: l.ref, ok: true, id: r?.id ?? `local-${l.ref}` };
        return { ref: l.ref, ok: false, why: `The local sender said: ${r.why ?? "no reason given"}`.slice(0, 280), unsure: Boolean(r.unsure) };
      });
    },
  };
}
