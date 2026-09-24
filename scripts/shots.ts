/**
 * TEMP/one-off asset pipeline (kept in repo: regenerates the landing-page
 * screenshots). Requires the dev server on :5173 and the samples generated
 * (`npm run gen:sample`).
 *
 *   npx tsx scripts/shots.ts
 *
 * Screenshots each exported template (the real export, not the preview) and
 * writes compressed .webp files into landing/shots/.
 */
import { mkdirSync, existsSync, rmSync, readdirSync } from "fs";
import { execFileSync } from "child_process";
import { join } from "path";
import sharp from "sharp";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:5173/sample-output";
const OUT = "landing/shots";
const TMP = join(process.env.TEMP || ".", "sf-shots");

const TEMPLATES = [
  "restaurant",
  "portfolio",
  "profile",
  "business",
  "modern",
  "clinic",
  "bank",
  "shop",
  "films",
  "hr",
  "agency",
  "newsroom",
  "dashboard",
  "fitness",
  "saas",
  "law",
];

/** Chrome writes the file itself; these flags make it deterministic. */
function shoot(url: string, out: string, width: number, height: number) {
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--user-data-dir=${join(TMP, "profile")}`,
      "--virtual-time-budget=8000",
      `--window-size=${width},${height}`,
      `--screenshot=${out}`,
      url,
    ],
    { stdio: "ignore", timeout: 90_000 }
  );
}

async function main() {
  if (!existsSync("sample-output")) {
    console.error("run `npm run gen:sample` first");
    process.exit(1);
  }
  mkdirSync(OUT, { recursive: true });
  mkdirSync(TMP, { recursive: true });

  for (const t of TEMPLATES) {
    const src = join(TMP, `${t}.png`);
    shoot(`${BASE}/${t}/index.html`, src, 1280, 860);
    // Trim the empty tail many pages have, then compress hard for the web.
    const img = sharp(src).resize({ width: 1000, withoutEnlargement: true });
    await img.webp({ quality: 68, effort: 5 }).toFile(join(OUT, `${t}.webp`));
    rmSync(src, { force: true });
    console.log("shot:", t);
  }

  // Two mobile shots so the page shows it isn't a desktop-only tool.
  for (const [t, name] of [
    ["shop", "mobile-shop"],
    ["fitness", "mobile-fitness"],
  ] as const) {
    const src = join(TMP, `${name}.png`);
    shoot(`${BASE}/${t}/index.html`, src, 420, 860);
    await sharp(src)
      .webp({ quality: 68, effort: 5 })
      .toFile(join(OUT, `${name}.webp`));
    rmSync(src, { force: true });
    console.log("shot:", name);
  }

  rmSync(TMP, { recursive: true, force: true });
  const files = readdirSync(OUT);
  console.log(`${files.length} shots in ${OUT}`);
}

void main();
