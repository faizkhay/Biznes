"use client";

import { useEffect, useState } from "react";

/**
 * True while the viewport is phone-or-tablet width.
 *
 * Every 3D stage needs this. A subject framed beside a text column on a 1440-wide window sits
 * wrongly once the same camera looks at a 390-wide one: the vertical field of view is fixed, so a
 * narrow viewport sees less width, not less height, and on a phone the words sit under the subject
 * rather than beside it. The stage also drops geometry detail and particle counts.
 *
 * Starts false so the server and the first client paint agree, then corrects on mount. A stage that
 * must not flash the wrong framing should wait for `ready` before mounting its canvas.
 *
 * KOS kit. Shared by KYÔ, Aqua Springs and Details.
 */
export default function useNarrow(query = "(max-width: 1023px)") {
  const [narrow, setNarrow] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setNarrow(mq.matches);
    sync();
    setReady(true);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);

  return { narrow, ready };
}
