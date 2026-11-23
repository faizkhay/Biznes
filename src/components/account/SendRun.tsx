"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { RunState } from "@/app/admin/email/actions";
import { count } from "@/lib/format";
import { Alert, Tick } from "../Icons";

type Action = (state: RunState, data: FormData) => Promise<RunState>;

/**
 * Sends a campaign a batch at a time. Each batch is one request to the server (a form posted to
 * a server action), so no request is long, and the page says how far it has got after each.
 *
 * With script on, pressing the button once is enough: the batches follow one another until none
 * is left, or until "Stop" is pressed, or until a batch is refused. Stopping is safe at any
 * moment: the batch on its way finishes, and the addresses not yet taken wait in the database,
 * where "Carry on sending" finds them again. With script off the same button sends one batch
 * each time it is pressed.
 */
export default function SendRun({ action, campaign, start, go = false }: { action: Action; campaign: string; start: RunState; /** Begin at once: the page was opened by pressing Send. */ go?: boolean }) {
  const [state, send, pending] = useActionState(action, start);
  const [running, setRunning] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const began = useRef(false);
  // The answer the last batch was asked from: a new one means that batch has come back.
  const askedFrom = useRef<RunState | null>(null);
  const { progress } = state;
  const left = progress.queued;
  const done = progress.total - progress.queued - progress.sending;
  const finished = left === 0;

  function next() {
    askedFrom.current = state;
    form.current?.requestSubmit();
  }

  // Opened by pressing Send: the first batch goes by itself, once.
  useEffect(() => {
    if (!go || began.current || finished) return;
    began.current = true;
    // Once only: the address loses its mark, so the page opened again later begins nothing by itself.
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.hash}`);
    setRunning(true);
    next();
  }, [go, finished]);

  // When a batch comes back: the next, while the run is on and there is something left.
  useEffect(() => {
    if (!running || pending || askedFrom.current === state) return;
    if (finished || state.stopped) setRunning(false);
    else next();
  }, [running, pending, finished, state]);

  return (
    <form ref={form} action={send} className="grid gap-4">
      <input type="hidden" name="campaign" value={campaign} />
      <div>
        <label htmlFor="send-progress" className="title-2 block">
          {finished ? "Every address has been dealt with" : running ? "Sending" : "Sending has stopped"}
        </label>
        <progress id="send-progress" className="progress mt-2" max={Math.max(progress.total, 1)} value={done} />
        <p className="data-2 mt-2 text-ink-subtle" role="status">
          {count(progress.sent)} sent, {count(left)} waiting, {count(progress.failed)} failed, {count(progress.skipped)} left out, of {count(progress.total)}.
        </p>
      </div>
      {state.said && (
        <p role={state.stopped ? "alert" : "status"} className="note body-3 flex items-start gap-2">
          {state.stopped ? <Alert className="mt-0.5 size-5 flex-none text-alert" /> : <Tick className="mt-0.5 size-5 flex-none text-link" />}
          <span>{state.said}</span>
        </p>
      )}
      {!finished && (
        <div className="flex flex-wrap items-center gap-3">
          {running ? (
            <button key="stop" type="button" className="btn btn-ink button-md" onClick={() => setRunning(false)}>
              Stop
            </button>
          ) : (
            // With script on, the press begins a run and the batch is asked for here; with script off the button posts the form itself.
            <button
              key="go"
              type="submit"
              className="btn btn-filled button-md"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                setRunning(true);
                next();
              }}
            >
              {pending ? "Sending a batch" : state.batches > 0 || progress.sent > 0 || progress.failed > 0 ? "Carry on sending" : "Send the first batch"}
            </button>
          )}
          <p className="caption-1 text-ink-faint">{running ? "The batch on its way finishes; the rest wait." : "The batches follow one another until you press Stop. Nothing is sent twice."}</p>
        </div>
      )}
    </form>
  );
}
