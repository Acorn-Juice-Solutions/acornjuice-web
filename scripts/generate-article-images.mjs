#!/usr/bin/env node
// Generates the responsive WebP renditions of article images.
//
//   npm run article-images
//
// Manual dev tool, like `npm run og` — the WebP files are committed and the CI
// build never regenerates them.
//
// Masters live in src/assets/articles/<name>.png, rendered at 2x (2400px for a
// square figure) so the largest rendition is downscaled, never upscaled. Each
// master becomes public/assets/articles/<name>-<width>.webp for every width in
// WIDTHS, which the article references through srcset/sizes.
//
// Why not Astro's own image pipeline: articles are plain .md, where Astro can
// optimise an image but cannot emit a srcset without switching the image
// layout for the whole site. Shipping a fixed set of widths keeps the change
// local to the articles and lets Lighthouse see a correctly sized, modern
// format image ("uses-responsive-images", "modern-image-formats").

import { mkdir, readdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC_DIR = join(ROOT, 'src', 'assets', 'articles');
const OUT_DIR = join(ROOT, 'public', 'assets', 'articles');

// The article column is capped at 40rem (640px, --reading-max in tokens.css):
// 640 covers 1x screens, 1280 covers 2x, and 960 is the step in between for
// 1.5x screens and narrow layouts.
const WIDTHS = [640, 960, 1280];
const WEBP = { quality: 82, effort: 6 };

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

async function main() {
  let files;
  try {
    files = (await readdir(SRC_DIR)).filter((f) => extname(f).toLowerCase() === '.png');
  } catch {
    throw new Error(`no masters directory at ${SRC_DIR}`);
  }
  if (files.length === 0) {
    throw new Error(`no .png masters in ${SRC_DIR}`);
  }

  await mkdir(OUT_DIR, { recursive: true });

  for (const file of files.sort()) {
    const name = basename(file, extname(file));
    if (!/^[a-z0-9-]+$/.test(name)) {
      throw new Error(`${file}: master names must be lowercase kebab-case`);
    }

    const master = join(SRC_DIR, file);
    const { width } = await sharp(master).metadata();
    const largest = WIDTHS[WIDTHS.length - 1];
    if (!width || width < largest) {
      throw new Error(
        `${file}: master is ${width ?? '?'}px wide, needs at least ${largest}px — render it at 2x`,
      );
    }

    for (const w of WIDTHS) {
      const out = join(OUT_DIR, `${name}-${w}.webp`);
      const info = await sharp(master)
        .resize({ width: w, withoutEnlargement: true })
        .webp(WEBP)
        .toFile(out);
      console.log(`${GREEN}✓${RESET} ${name}-${w}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
    }
  }
}

main().catch((err) => {
  console.error(`${RED}${err.message}${RESET}`);
  process.exit(1);
});
