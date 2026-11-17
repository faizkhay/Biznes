/**
 * Whether this browser can run the stage. three.js (r163 and later) needs WebGL 2, so a WebGL 1
 * device gets the stand-in. The test context is lost straight away, so it does not count against the
 * browser's cap on live contexts. `?no3d` forces the answer to no, for checking the fallback.
 *
 * Call it in an effect, never during render: the server cannot know.
 *
 * KOS kit. From KYÔ (Stage.tsx, hasWebGL) and DHE (?no3d).
 */
export function hasWebGL(): boolean {
  if (new URLSearchParams(window.location.search).has("no3d")) return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}
