"use client";

import { useId, useState } from "react";
import { PICTURE_BYTES, PICTURE_RULE, PICTURE_TYPES } from "@/lib/accounts/config";
import { Alert } from "../Icons";

/**
 * A form that sends one picture. It is a plain form posted to a route of this site, so it works
 * with script off, and a picture of three megabytes fits (a server action takes one). With script,
 * the picture is looked at before it is sent: one that is too large or of the wrong kind is said
 * so at once, on its own field, and the button says when it is uploading.
 *
 * `problem` is what the route answered last time, in words; it is shown on the field, which then
 * takes the focus.
 */
export default function UploadForm({
  to,
  label,
  button,
  problem,
  hint = PICTURE_RULE,
  children,
  quiet = false,
}: {
  /** The route the form posts to. */
  to: string;
  label: string;
  button: string;
  problem?: string;
  hint?: string;
  /** More fields, set above the picture: what kind it is, a name for it. */
  children?: React.ReactNode;
  /** A quiet button, where another form on the page holds the filled one. */
  quiet?: boolean;
}) {
  const id = useId();
  const [wrong, setWrong] = useState("");
  const [busy, setBusy] = useState(false);
  const error = wrong || problem;

  function looked(input: HTMLInputElement) {
    const file = input.files?.[0];
    const said = !file ? "" : file.size > PICTURE_BYTES ? "That picture is over 3 MB. Save it smaller, or choose another." : !PICTURE_TYPES[file.type] ? "That is not a JPEG, a PNG or a WebP picture." : "";
    setWrong(said);
    if (said) input.value = "";
  }

  return (
    <form method="post" action={to} encType="multipart/form-data" className="grid gap-4" onSubmit={() => setBusy(true)}>
      {children}
      <div>
        <label htmlFor={id} className="title-2 block">
          {label}
        </label>
        <p id={`${id}-hint`} className="caption-1 mt-1 text-ink-faint">
          {hint}
        </p>
        <input
          id={id}
          name="file"
          type="file"
          required
          accept={Object.keys(PICTURE_TYPES).join(",")}
          className="field mt-2"
          aria-invalid={error ? true : undefined}
          aria-describedby={[`${id}-hint`, error ? `${id}-error` : ""].filter(Boolean).join(" ")}
          // A problem the route answered with is this field's: it takes the focus when the page opens.
          autoFocus={Boolean(problem)}
          onChange={(e) => looked(e.currentTarget)}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="caption-1 mt-2 flex items-start gap-2 text-alert">
            <Alert className="mt-0.5 size-4 flex-none" />
            {error}
          </p>
        )}
      </div>
      <div>
        <button type="submit" className={`btn button-md ${quiet ? "btn-quiet" : "btn-ink"}`} disabled={busy} aria-disabled={busy || undefined}>
          {busy ? "Uploading" : button}
        </button>
      </div>
    </form>
  );
}
