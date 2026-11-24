import { Arrival } from "@/components/Motion";

/**
 * Made afresh for every page that is reached, which is what a template is for: it marks the page
 * as arrived at, so its parts rise into place (src/components/Motion.tsx). It draws nothing of
 * its own, so a page's blocks stay the direct children of <main>, as the styles expect.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Arrival />
      {children}
    </>
  );
}
