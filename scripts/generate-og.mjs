#!/usr/bin/env node
// Generates the default Open Graph card: public/og/default.png (1200x630).
//
//   npm run og
//
// Manual dev tool, like `npm run favicons` — the PNG is committed and the CI
// build never regenerates it, so text rendering only ever depends on the fonts
// of the machine that ran this, not on the runner's font set.
//
// Deliberately language-neutral (brand mark + name + domain, no tagline): one
// card is shared by the English and Spanish pages, so any sentence here would
// be the wrong language on half the site. Pages that want their own card pass
// `ogImage` to BaseLayout.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LOGO = join(ROOT, 'public', 'assets', 'logo.png');
const OUT_DIR = join(ROOT, 'public', 'og');
const OUT = join(OUT_DIR, 'default.png');

const WIDTH = 1200;
const HEIGHT = 630;

// Brand tokens, mirrored from src/styles/tokens.css.
const BG = '#fbf7f1';
const INK = '#2a1a10';
const CAP = '#a0522d';
const LINE = '#e5dbcb';

const LOGO_SIZE = 200;
// Logo + text read as one centred block: social clients crop the edges of a
// 1.91:1 card unpredictably, so nothing important sits near the margins.
const LOGO_X = 250;
const LOGO_Y = (HEIGHT - LOGO_SIZE) / 2;
const TEXT_X = LOGO_X + LOGO_SIZE + 72;

// Font stacks resolved by the renderer against locally installed fonts.
// Newsreader/Inter are web fonts that are not installed system-wide, so the
// card uses their closest ubiquitous relatives to stay visually on-brand.
const DISPLAY = "Georgia, 'Times New Roman', 'Liberation Serif', serif";
const BODY = "'Segoe UI', Inter, Roboto, 'DejaVu Sans', Arial, sans-serif";

function backgroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
  <text x="${TEXT_X}" y="288" font-family="${DISPLAY}" font-size="76" font-weight="500" fill="${INK}">Acorn Juice</text>
  <text x="${TEXT_X}" y="374" font-family="${DISPLAY}" font-size="76" font-weight="500" fill="${INK}">Solutions</text>
  <line x1="${TEXT_X}" y1="418" x2="${TEXT_X + 260}" y2="418" stroke="${LINE}" stroke-width="3"/>
  <text x="${TEXT_X}" y="470" font-family="${BODY}" font-size="30" font-weight="600" fill="${CAP}" letter-spacing="1.5">www.acornjuice.com</text>
  <rect x="0" y="${HEIGHT - 14}" width="${WIDTH}" height="14" fill="${CAP}"/>
</svg>`;
}

async function main() {
  try {
    await readFile(LOGO);
  } catch {
    console.error(`Source logo not found: ${LOGO}`);
    process.exit(1);
  }

  const logo = await sharp(LOGO)
    .resize(LOGO_SIZE, LOGO_SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const png = await sharp(Buffer.from(backgroundSvg()))
    .composite([{ input: logo, left: LOGO_X, top: Math.round(LOGO_Y) }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT, png);

  const { width, height } = await sharp(png).metadata();
  console.log(`public/og/default.png (${width}x${height}, ${png.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
