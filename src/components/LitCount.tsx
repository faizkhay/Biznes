"use client";

import { useEffect, useState } from "react";
import { count } from "@/lib/format";
import { CHART_EVENT, type ChartLit } from "./ChartLive";

/** How many points the chart has lit for the question being typed. Says nothing until there is one. */
export default function LitCount() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const on = (event: Event) => setN((event as CustomEvent<ChartLit>).detail.points.length);
    window.addEventListener(CHART_EVENT, on);
    return () => window.removeEventListener(CHART_EVENT, on);
  }, []);
  return (
    <span className="data-2 text-signal" role="status">
      {n > 0 ? `${count(n)} lit for your question` : ""}
    </span>
  );
}
