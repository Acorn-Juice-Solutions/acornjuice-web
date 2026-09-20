#!/usr/bin/env node
// Guards the Open Graph card against the failure it is fixing:
//  1. public/og/default.png exists, is a real PNG at 1200x630, and is small
//     enough for every major social client to fetch it.
//  2. Every built page declares og:image and twitter:image as absolute URLs.
//  3. Every image those tags point at resolves to a file that actually shipped
//     in dist/. The previous default pointed at /og/default.png, which 404'd on
//     all 22 pages for weeks without anything failing — nothing was checking.

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC = join(ROOT, 'public');
const DIST = join(ROOT, 'dist');
const SITE_URL = 'https://www.acornjuice.com';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const EXPECTED = { file: 'og/default.png', width: 1200, height: 630 };
// X and LinkedIn both reject cards over 5 MB; staying well under keeps the
// fetch fast enough that crawlers with short timeouts still get it.
const MAX_BYTES = 1_500_000;

async function readPngDimensions(path) {
  const buf = await readFile(path);
  if (
    buf.length < 24 ||
    buf.readUInt32BE(0) !== 0x89504e47 ||
    buf.readUInt32BE(4) !== 0x0d0a1a0a
  ) {
    throw new Error(`Not a PNG: ${path}`);
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bytes: buf.length,
  };
}

async function collectHtml(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await collectHtml(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function metaContent(head, matcher) {
  const re = new RegExp(
    `<meta[^>]+${matcher}=["'][^"']+["'][^>]+content=["']([^"']+)["']`,
    'i',
  );
  const flipped = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${matcher}=["'][^"']+["']`,
    'i',
  );
  return re.exec(head)?.[1] ?? flipped.exec(head)?.[1] ?? null;
}

async function main() {
  const errors = [];

  // 1. The asset itself
  try {
    const { width, height, bytes } = await readPngDimensions(
      join(PUBLIC, EXPECTED.file),
    );
    if (width !== EXPECTED.width || height !== EXPECTED.height) {
      errors.push(
        `public/${EXPECTED.file}: expected ${EXPECTED.width}x${EXPECTED.height}, got ${width}x${height}`,
      );
    }
    if (bytes > MAX_BYTES) {
      errors.push(
        `public/${EXPECTED.file}: ${bytes} bytes exceeds the ${MAX_BYTES} byte budget`,
      );
    }
  } catch (e) {
    errors.push(`public/${EXPECTED.file}: ${e.message} — run \`npm run og\``);
  }

  // 2 + 3. The tags, and whether what they point at shipped
  let distExists = true;
  try {
    await stat(DIST);
  } catch {
    distExists = false;
  }

  if (!distExists) {
    errors.push('dist/ not found — run `npm run build` first.');
  } else {
    const files = await collectHtml(DIST);
    if (files.length === 0) errors.push('dist/ contains no HTML.');

    for (const path of files) {
      const html = await readFile(path, 'utf8');
      const rel = relative(DIST, path).replace(/\\/g, '/');
      const head = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? html;

      for (const [label, matcher] of [
        ['og:image', 'property'],
        ['twitter:image', 'name'],
      ]) {
        const re = new RegExp(
          `<meta[^>]+${matcher}=["']${label}["'][^>]*>`,
          'i',
        );
        const tag = re.exec(head)?.[0];
        if (!tag) {
          errors.push(`${rel}: missing <meta ${matcher}="${label}">`);
          continue;
        }
        const url = metaContent(tag, matcher);
        if (!url) {
          errors.push(`${rel}: ${label} has no content attribute`);
          continue;
        }
        if (!url.startsWith(`${SITE_URL}/`)) {
          errors.push(
            `${rel}: ${label} must be an absolute ${SITE_URL} URL, got "${url}"`,
          );
          continue;
        }
        const assetPath = url.slice(SITE_URL.length).replace(/^\//, '');
        try {
          await stat(join(DIST, assetPath));
        } catch {
          errors.push(`${rel}: ${label} points at ${url}, which is not in dist/`);
        }
      }
    }
  }

  if (errors.length) {
    console.error(`${RED}FAIL${RESET} check-og (${errors.length})`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`${GREEN}OK${RESET} check-og`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
