"use client";

import { useId, useRef, useState } from "react";

/**
 * Words to copy: a box that holds them and a button that copies them. With script off the box is
 * still there to select and copy by hand. One row is one line: a subject.
 */
export default function CopyBox({ label, value, rows = 8, hint }: { label: string; value: string; rows?: number; hint?: string }) {
  const id = useId();
  const box = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const [said, setSaid] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setSaid("Copied.");
    } catch {
      // No clipboard to write to: the words are selected, for the keyboard's own copy.
      box.current?.select();
      setSaid("Selected. Copy it with your keyboard.");
    }
  }
  return (
    <div>
      <label htmlFor={id} className="title-2 block">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="caption-1 mt-1 text-ink-faint">
          {hint}
        </p>
      )}
      {rows === 1 ? (
        <input ref={box} id={id} type="text" readOnly value={value} aria-describedby={hint ? `${id}-hint` : undefined} className="field data-2 mt-2 bg-panel" />
      ) : (
        <textarea ref={box} id={id} readOnly rows={rows} value={value} aria-describedby={hint ? `${id}-hint` : undefined} className="field data-2 mt-2 bg-panel" spellCheck={false} />
      )}
      <p className="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-quiet btn-sm button-sm" onClick={copy}>
          Copy<span className="sr-only">: {label}</span>
        </button>
        <span className="caption-1 text-ink-faint" role="status">
          {said}
        </span>
      </p>
    </div>
  );
}
