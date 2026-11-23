// Lets plain Node run the site's own TypeScript, with no build, for a test or a measurement.
//
//   node --experimental-strip-types --import ./scripts/ts-paths.mjs scripts/search-measure.mjs
//
// Node strips the types by itself. What it does not know is how the site names its files: "@/x" is
// src/x (tsconfig.json), and one file names another without its ending ("./index" is index.ts).
// These hooks resolve both, and nothing else. The engine (src/lib/engine.ts) needs neither, which
// is why its own test runs without them.
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, join, resolve as path } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const src = path(dirname(fileURLToPath(import.meta.url)), "..", "src");

registerHooks({
  resolve(specifier, context, next) {
    const from = context.parentURL?.startsWith("file:") ? dirname(fileURLToPath(context.parentURL)) : undefined;
    const base = specifier.startsWith("@/") ? join(src, specifier.slice(2)) : from && /^\.\.?\//.test(specifier) && !/\.[a-z]+$/.test(specifier) ? path(from, specifier) : undefined;
    if (base) for (const file of [`${base}.ts`, join(base, "index.ts"), base]) if (existsSync(file) && !file.endsWith("/")) return next(pathToFileURL(file).href, context);
    return next(specifier, context);
  },
});
