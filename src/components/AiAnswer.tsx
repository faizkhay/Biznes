"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AI } from "@/data/ai";

type Found = { text: string; sources: { title: string; href: string }[] };

/**
 * The AI answer, at the head of a page of results: a short answer a machine wrote from this
 * site's own articles, with the articles named and a plain word that it may be wrong.
 *
 * The results page draws it only where an answer is likely (src/lib/ai/answer.ts, `aiLikely`), as
 * a card that is waiting, so nothing on the page moves when the answer comes. The answer is
 * fetched after the page is drawn: the page never waits on the model, and a reader that runs no
 * script never causes it to be asked. Without script the card is not shown at all (the style in
 * <noscript>), and the page is whole without it. Where the model has no answer the card goes.
 */
export default function AiAnswer({ q }: { q: string }) {
  const [state, setState] = useState<{ q: string; found: Found | null } | null>(null);

  useEffect(() => {
    const asking = new AbortController();
    fetch(`/api/answer?q=${encodeURIComponent(q)}`, { signal: asking.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { answer?: Found | null } | null) => setState({ q, found: data?.answer ?? null }))
      .catch((error) => {
        if (error?.name !== "AbortError") setState({ q, found: null });
      });
    return () => asking.abort();
  }, [q]);

  // What is held is for another question: this one is still being asked.
  const settled = state?.q === q ? state : null;
  if (settled && !settled.found) return null;
  const found = settled?.found;
  return (
    <section className="ai-answer mt-4" aria-labelledby="ai-title" aria-busy={!found}>
      <noscript>
        <style>{".ai-answer{display:none}"}</style>
      </noscript>
      <h2 id="ai-title" className="label-1 ai-label">
        {AI.label}
      </h2>
      <div aria-live="polite">
        {found ? (
          <div className="ai-said">
            <p className="body-1">{found.text}</p>
            <p className="body-3 mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-subtle">
              <span>{AI.from}</span>
              {found.sources.map((source) => (
                <Link key={source.href} prefetch={false} href={source.href} className="title-2 text-link">
                  {source.title}
                </Link>
              ))}
            </p>
            <p className="caption-1 mt-3 max-w-prose text-ink-faint">{AI.note}</p>
          </div>
        ) : (
          <div className="ai-waiting" role="status">
            <span className="sr-only">{AI.waiting}</span>
            {/* Lines that wait, as many as a short answer has: three at a desk, six on a phone, where lines are short. */}
            {[0, 1, 2, 3, 4, 5].map((line) => (
              <i key={line} className="wait" aria-hidden />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
