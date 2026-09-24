/**
 * Dev helper: writes seed-site.html, which seeds localStorage with a given
 * template's sample site and then redirects to the app. Handy for testing the
 * builder against a known configuration (delete the file afterwards).
 *   npx tsx scripts/seed-site.ts clinic   →  http://localhost:5173/seed-site.html
 */
import { writeFileSync } from "fs";
import { createSite } from "../src/lib/sample";
import { isTemplateId } from "../src/lib/templates";

const tpl = process.argv[2];
if (!isTemplateId(tpl)) {
  console.error("usage: seed-site.ts <template>");
  process.exit(1);
}
const site = createSite(tpl);
const json = JSON.stringify(site);
const html = `<!doctype html><html><head><meta charset="utf-8"><title>seeding ${tpl}</title></head><body><p>seeding…</p><script>
try { localStorage.setItem("siteforge:site:v1", ${JSON.stringify(json)}); } catch (e) {}
location.replace("/");
</script></body></html>`;
writeFileSync("seed-site.html", html);
console.log(`wrote seed-site.html (${tpl}, ${json.length} bytes)`);