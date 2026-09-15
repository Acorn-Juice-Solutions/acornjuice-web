#!/usr/bin/env node
// Structural validation of favicon assets:
//  1. All expected favicon files exist in public/ with the correct dimensions.
//  2. Every built HTML page under dist/ declares them via <link rel="icon"> /
//     <link rel="apple-touch-icon"> so Google (and browsers) can find them.

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC = join(ROOT, 'public');
const DIST = join(ROOT, 'dist');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

// Expected files. PNG dimensions are read from the IHDR chunk; ICO is validated
// by header + entry list.
const EXPECTED_PNG = [
  { file: 'favicon-32.png', width: 32, height: 32 },
  { file: 'favicon-192.png', width: 192, height: 192 },
  { file: 'apple-touch-icon.png', width: 180, height: 180 },
];
const EXPECTED_ICO_SIZES = [16, 32, 48];

const REQUIRED_LINKS = [
  { attr: 'rel="icon"', hrefIncludes: '/favicon.ico' },
  { attr: 'rel="icon"', hrefIncludes: '/favicon.svg' },
  { attr: 'rel="icon"', hrefIncludes: '/favicon-32.png' },
  { attr: 'rel="icon"', hrefIncludes: '/favicon-192.png' },
  { attr: 'rel="apple-touch-icon"', hrefIncludes: '/apple-touch-icon.png' },
];

async function readPngDimensions(path) {
  const buf = await readFile(path);
  // PNG signature is 8 bytes, then an IHDR chunk starting with length(4) + type(4)
  // followed by width(4) and height(4) big-endian. Ref: https://www.w3.org/TR/png/#11IHDR
  if (
    buf.length < 24 ||
    buf.readUInt32BE(0) !== 0x89504e47 ||
    buf.readUInt32BE(4) !== 0x0d0a1a0a
  ) {
    throw new Error(`Not a PNG: ${path}`);
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function readIcoSizes(path) {
  const buf = await readFile(path);
  if (buf.length < 6 || buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) {
    throw new Error(`Not an ICO: ${path}`);
  }
  const count = buf.readUInt16LE(4);
  const sizes = [];
  for (let i = 0; i < count; i++) {
    const base = 6 + i * 16;
    // 0 means 256 in the spec, but we never emit >= 256 so a raw read is fine.
    const w = buf.readUInt8(base);
    sizes.push(w === 0 ? 256 : w);
  }
  return sizes.sort((a, b) => a - b);
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

async function main() {
  const errors = [];

  // Assets check
  for (const { file, width, height } of EXPECTED_PNG) {
    const full = join(PUBLIC, file);
    try {
      const dims = await readPngDimensions(full);
      if (dims.width !== width || dims.height !== height) {
        errors.push(
          `public/${file}: expected ${width}x${height}, got ${dims.width}x${dims.height}`,
        );
      }
    } catch (e) {
      errors.push(`public/${file}: ${e.message}`);
    }
  }

  const icoPath = join(PUBLIC, 'favicon.ico');
  try {
    const sizes = await readIcoSizes(icoPath);
    for (const expected of EXPECTED_ICO_SIZES) {
      if (!sizes.includes(expected)) {
        errors.push(`favicon.ico missing ${expected}px entry (got ${sizes.join(',')})`);
      }
    }
  } catch (e) {
    errors.push(`public/favicon.ico: ${e.message}`);
  }

  // HTML declarations check — only runs if dist/ exists (dev safety: skip cleanly).
  let distExists = true;
  try {
    await stat(DIST);
  } catch {
    distExists = false;
  }

  if (distExists) {
    const files = await collectHtml(DIST);
    if (files.length === 0) {
      errors.push('dist/ contains no HTML — run `npm run build` first.');
    }
    for (const path of files) {
      const html = await readFile(path, 'utf8');
      const rel = relative(ROOT, path).replace(/\\/g, '/');
      // Grab the whole <head> once, then look for each declaration inside it.
      const head = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? html;
      for (const { attr, hrefIncludes } of REQUIRED_LINKS) {
        const linkRe = new RegExp(
          `<link[^>]+${attr.replace(/"/g, '["\']')}[^>]+href=["'][^"']*${hrefIncludes.replace(
            /[.\-]/g,
            '\\$&',
          )}[^"']*["']`,
          'i',
        );
        const swappedRe = new RegExp(
          `<link[^>]+href=["'][^"']*${hrefIncludes.replace(
            /[.\-]/g,
            '\\$&',
          )}[^"']*["'][^>]+${attr.replace(/"/g, '["\']')}`,
          'i',
        );
        if (!linkRe.test(head) && !swappedRe.test(head)) {
          errors.push(`${rel}: missing <link ${attr} href="…${hrefIncludes}">`);
        }
      }
    }
  }

  if (errors.length) {
    console.error(`${RED}FAIL${RESET} check-favicons`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`${GREEN}OK${RESET} check-favicons`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
