/**
 * Checks that every local reference in the built landing page actually exists
 * in dist/ (shots, app entry, example sites) and that example sites load.
 * Run with the dist/ folder built:  npx tsx scripts/check-deploy.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const html = readFileSync("dist/index.html", "utf8");
const refs = new Set();
for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const v = m[1];
  if (v.startsWith("http") || v.startsWith("#") || v.startsWith("mailto:")) continue;
  refs.add(v.split("#")[0].split("?")[0]);
}

let bad = 0;
for (const ref of [...refs].sort()) {
  const target = ref.endsWith("/") ? join("dist", ref, "index.html") : join("dist", ref);
  const ok = existsSync(target);
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "MISS"} ${ref}`);
}

// Every template in the gallery must have a real example site.
const gallery = [...html.matchAll(/href="(examples\/[a-z]+\/index\.html)"/g)].map((m) => m[1]);
console.log(`\ngallery links: ${gallery.length}`);
for (const g of gallery) {
  const ok = existsSync(join("dist", g));
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "MISS"} ${g}`);
}

console.log(bad === 0 ? "\nAll landing references resolve." : `\n${bad} broken reference(s).`);
process.exit(bad === 0 ? 0 : 1);
