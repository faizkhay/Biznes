"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useReady } from "@/lib/saved";
import { MapIcon } from "./Icons";

// The street map and the library that draws it are fetched only when a visitor asks for the map.
const StreetMapView = dynamic(() => import("./StreetMapView"), {
  ssr: false,
  loading: () => (
    <div className="street wait" role="status">
      <span className="sr-only">The street map is loading.</span>
    </div>
  ),
});

/**
 * The island, and a way to change it for a map with streets. The island of dots is the site's own
 * picture and is what the page shows; a visitor who wants streets, to pan and zoom and to tap a
 * marker presses "Open the street map", and only then is any map code or tile fetched. The same
 * button brings the island back. Without script there is no button, and the island stands.
 */
export default function MapSwitch({
  lit,
  focus,
  children,
  back = "Back to the island",
}: {
  /** Positions in the chart's points to light on the street map, as on the island. */
  lit?: number[];
  /** One listing to centre on and mark. */
  focus?: { lon: number; lat: number; name: string };
  /** The island and its caption. With none, the button alone stands where the map will open. */
  children?: React.ReactNode;
  /** What the button says once the map is open. */
  back?: string;
}) {
  const [open, setOpen] = useState(false);
  const ready = useReady();
  return (
    <div className="map-switch">
      {children && <div hidden={open}>{children}</div>}
      {open && <StreetMapView lit={lit} focus={focus} />}
      {/* The button's room is kept before the page's script has loaded, so nothing under it moves when it comes. */}
      <p className={children || open ? "map-switch-act mt-3" : "map-switch-act"}>
        {ready && (
          <button type="button" className="btn btn-quiet btn-sm button-sm" onClick={() => setOpen(!open)}>
            <MapIcon /> {open ? back : "Open the street map"}
          </button>
        )}
      </p>
    </div>
  );
}
