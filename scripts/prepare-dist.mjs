/**
 * Assembles the deployable site in dist/:
 *
 *   dist/index.html      the landing page        (copied from landing/)
 *   dist/styles.css      landing styles
 *   dist/shots/*.webp    real template screenshots
 *   dist/og.jpg          social preview image
 *   dist/app/            the builder app         (written by vite build)
 *   dist/examples/<tpl>/ the exported sample sites (from sample-output/)
 *
 * Run after `vite build` and `npm run gen:sample`:
 *   npm run prepare:site
 */
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const LANDING = "landing";
const SAMPLES = "sample-output";

function fail(msg) {
  console.error(`prepare:site — ${msg}`);
  process.exit(1);
}

if (!existsSync(join(DIST, "app", "index.html"))) {
  fail("dist/app/index.html missing — run `vite build` (npm run build) first.");
}
if (!existsSync(SAMPLES)) {
  fail("sample-output missing — run `npm run gen:sample` first.");
}

// 1. landing page at the site root.
for (const entry of readdirSync(LANDING)) {
  if (statSync(join(LANDING, entry)).isDirectory()) {
    cpSync(join(LANDING, entry), join(DIST, entry), { recursive: true });
  } else {
    cpSync(join(LANDING, entry), join(DIST, entry));
  }
}

// 2. every exported sample site, browsable at /examples/<template>/.
rmSync(join(DIST, "examples"), { recursive: true, force: true });
mkdirSync(join(DIST, "examples"), { recursive: true });
let count = 0;
for (const entry of readdirSync(SAMPLES)) {
  if (!statSync(join(SAMPLES, entry)).isDirectory()) continue;
  cpSync(join(SAMPLES, entry), join(DIST, "examples", entry), { recursive: true });
  count++;
}

console.log(`prepare:site — landing page + ${count} example sites ready in dist/`);
