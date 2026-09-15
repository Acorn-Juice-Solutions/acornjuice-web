#!/usr/bin/env node
// Generates favicon.ico + PNG icons from public/assets/logo.png.
// Idempotent: safe to run whenever the source logo changes.
//
//   npm run favicons
//
// Outputs (written to public/):
//   favicon.ico            — multi-size (16/32/48), PNG-encoded inside ICO
//   favicon-32.png         — declared as sizes="32x32"
//   favicon-192.png        — declared as sizes="192x192" (Android)
//   apple-touch-icon.png   — 180x180 for iOS home-screen and some crawlers

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = join(ROOT, 'public', 'assets', 'logo.png');
const PUBLIC = join(ROOT, 'public');

const ICO_SIZES = [16, 32, 48];
const PNG_OUTPUTS = [
  { size: 32, name: 'favicon-32.png' },
  { size: 192, name: 'favicon-192.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

async function resizePng(src, size) {
  return sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// Build an .ico file whose entries wrap PNG payloads (Vista+ format, universally
// supported by modern browsers and Googlebot). Ref: https://en.wikipedia.org/wiki/ICO_(file_format)
function buildIco(entries) {
  const HEADER_SIZE = 6;
  const DIR_ENTRY_SIZE = 16;
  const dataOffsetStart = HEADER_SIZE + DIR_ENTRY_SIZE * entries.length;

  const header = Buffer.alloc(HEADER_SIZE);
  header.writeUInt16LE(0, 0);              // reserved
  header.writeUInt16LE(1, 2);              // type: 1 = icon
  header.writeUInt16LE(entries.length, 4); // image count

  const dir = Buffer.alloc(DIR_ENTRY_SIZE * entries.length);
  let offset = dataOffsetStart;
  entries.forEach((entry, i) => {
    const base = i * DIR_ENTRY_SIZE;
    // Sizes >= 256 are encoded as 0; we only emit <= 48 so this is a straight write.
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, base + 0); // width
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, base + 1); // height
    dir.writeUInt8(0, base + 2);            // color palette count (0 = truecolor)
    dir.writeUInt8(0, base + 3);            // reserved
    dir.writeUInt16LE(1, base + 4);         // color planes
    dir.writeUInt16LE(32, base + 6);        // bits per pixel
    dir.writeUInt32LE(entry.data.length, base + 8);  // bytes in resource
    dir.writeUInt32LE(offset, base + 12);   // offset from file start
    offset += entry.data.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.data)]);
}

async function main() {
  try {
    await readFile(SOURCE);
  } catch {
    console.error(`Source logo not found: ${SOURCE}`);
    process.exit(1);
  }

  const icoEntries = await Promise.all(
    ICO_SIZES.map(async (size) => ({ size, data: await resizePng(SOURCE, size) })),
  );
  const ico = buildIco(icoEntries);
  await writeFile(join(PUBLIC, 'favicon.ico'), ico);
  console.log(`favicon.ico (${ICO_SIZES.join('/')} px, ${ico.length} bytes)`);

  for (const { size, name } of PNG_OUTPUTS) {
    const buf = await resizePng(SOURCE, size);
    await writeFile(join(PUBLIC, name), buf);
    console.log(`${name} (${size}x${size}, ${buf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
