/**
 * Generates the social preview image (landing/og.jpg) and the favicon
 * (landing/favicon.svg) from the real template screenshot, so the Reddit /
 * social card shows the product instead of a grey box.
 *
 *   npx tsx scripts/og-image.ts
 */
import sharp from "sharp";
import { existsSync, writeFileSync } from "fs";

const SHOT = "landing/shots/restaurant.webp";

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#A3E635"/>
  <path d="M18.2 3 8.5 17.6h5.6L12.8 29l10.2-15.2h-5.9L18.2 3Z" fill="#101507"/>
</svg>
`;

async function main() {
  if (!existsSync(SHOT)) {
    console.error("run `npx tsx scripts/shots.ts` first");
    process.exit(1);
  }

  // 1200x630 social card: wordmark + headline on top, product shot as a band below.
  const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1090" height="290">
    <style>
      .t { font-family: ui-sans-serif, system-ui, 'Segoe UI', Helvetica, Arial, sans-serif; }
    </style>
    <text x="0" y="42" class="t" font-size="28" font-weight="800" fill="#A3E635" letter-spacing="-0.4">SiteForge</text>
    <text x="0" y="128" class="t" font-size="64" font-weight="850" fill="#F1F4EA" letter-spacing="-2.4">A real website,</text>
    <text x="0" y="194" class="t" font-size="64" font-weight="850" fill="#F1F4EA" letter-spacing="-2.4">built in minutes.</text>
    <text x="0" y="240" class="t" font-size="25" font-weight="500" fill="#9BA58D">16 templates · 12 page types · live preview · ZIP of plain HTML</text>
    <text x="0" y="276" class="t" font-size="25" font-weight="750" fill="#A3E635">Free · no signup · no server</text>
  </svg>`);

  // Crop the top band of the real export and use it as the product shot.
  const meta = await sharp(SHOT).metadata();
  const bandH = Math.min(250, meta.height || 250);
  const band = await sharp(SHOT)
    .extract({ left: 0, top: 0, width: meta.width || 1000, height: bandH })
    .resize({ width: 1000 })
    .toBuffer();
  const bandMeta = await sharp(band).metadata();
  const drawW = 1000;
  const drawH = Math.round((bandMeta.height || bandH) * (drawW / (bandMeta.width || 1000)));
  const top = 630 - drawH - 30;

  await sharp({
    create: { width: 1200, height: 630, channels: 3, background: "#0b0d0a" },
  })
    .composite([
      { input: text, top: 44, left: 55 },
      { input: band, top, left: Math.round((1200 - drawW) / 2) },
    ])
    .jpeg({ quality: 86, progressive: true })
    .toFile("landing/og.jpg");

  writeFileSync("landing/favicon.svg", FAVICON);
  console.log("wrote landing/og.jpg");
  console.log("wrote landing/favicon.svg");
}

void main();
