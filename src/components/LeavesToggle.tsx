"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "./Icons";

/** Where a visitor's choice to hold the leaves still is kept, in their own browser. */
const KEY = "biznes:leaves";

/**
 * The control for what falls over the landing page, and the script that lets it fall at all.
 *
 * Nothing moves until this has run: it marks the page (data-leaves on .landing) only for a visitor
 * who has not asked their device for less motion, so without script, and for that visitor, there
 * is neither a leaf nor a button. The button holds every piece where it is and lets them go
 * again, and the choice is remembered in this browser. `name` is the season's word for what
 * falls: petals, leaves, cane flowers.
 */
export default function LeavesToggle({ name }: { name: string }) {
  const button = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<"off" | "on" | "paused">("off");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let kept: string | null = null;
    try {
      kept = window.localStorage.getItem(KEY);
    } catch {
      // A browser that keeps nothing: they fall, and the choice lasts for this visit.
    }
    setState(kept === "paused" ? "paused" : "on");
  }, []);

  // The mark is changed in place and never taken off between two states: a layer that stopped
  // being shown for a moment would start every piece again from the top.
  useEffect(() => {
    if (state !== "off") button.current?.closest(".landing")?.setAttribute("data-leaves", state);
  }, [state]);

  const paused = state === "paused";
  const label = paused ? `Let the ${name} fall again` : `Pause the falling ${name}`;
  const toggle = () => {
    const next = paused ? "on" : "paused";
    setState(next);
    try {
      if (next === "paused") window.localStorage.setItem(KEY, next);
      else window.localStorage.removeItem(KEY);
    } catch {
      // Nothing to keep it in.
    }
  };
  return (
    <button ref={button} type="button" className="leaves-toggle" hidden={state === "off"} aria-label={label} title={label} onClick={toggle}>
      {paused ? <Play /> : <Pause />}
    </button>
  );
}
