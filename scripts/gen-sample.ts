import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createSite, createSampleSite } from "../src/lib/sample";
import { TEMPLATE_ORDER } from "../src/lib/templates";
import { buildSiteFiles } from "../src/lib/render";

// Generate sample exports for every template so humans (and AI) can inspect
// exactly what a user would download. Default = restaurant.
const outRoot = join(process.cwd(), "sample-output");
mkdirSync(outRoot, { recursive: true });

writeSampleDir("default", createSampleSite());
for (const tid of TEMPLATE_ORDER) {
  writeSampleDir(tid, createSite(tid));
}

function writeSampleDir(dir: string, site: ReturnType<typeof createSite>) {
  const outDir = join(outRoot, dir);
  mkdirSync(outDir, { recursive: true });
  const files = buildSiteFiles(site);
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(outDir, name), content);
  }
  console.log(
    `wrote ${Object.keys(files).join(", ")} → sample-output/${dir}`
  );
}