#!/usr/bin/env node
// Verifies hreflang tags on the built site:
//  1. Every non-noindex HTML page has exactly 3 <link rel="alternate" hreflang>
//     tags (en, es, x-default).
//  2. The alternates are checked against what shipped in dist/, not against
//     the pairs declared in src/utils/hreflang.ts. That is the stronger
//     property: article pairs are derived from the content collection, so a
//     declaration can be right while the build is wrong.
//  3. Reciprocity: if /about/ points to /es/sobre/, then /es/sobre/ points
//     back to /about/. Broken pairs are the #1 hreflang issue in the wild.

import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const SITE_URL = 'https://www.acornjuice.com';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

async function collectHtml(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await collectHtml(full)));
    } else if (entry.isFile() && entry.name === 'index.html') {
      out.push(full);
    }
  }
  return out;
}

const HREFLANG_RE =
  /<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["']/g;
const HREFLANG_RE_FLIPPED =
  /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["']/g;
const ROBOTS_NOINDEX_RE =
  /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i;

function pathFromFile(file) {
  const rel = relative(DIST, file).replaceAll('\\', '/');
  // dist/index.html → /
  // dist/about/index.html → /about/
  const dir = rel === 'index.html' ? '' : rel.slice(0, -'index.html'.length);
  return '/' + dir;
}

function extractAlternates(html) {
  const alt = new Map();
  for (const re of [HREFLANG_RE, HREFLANG_RE_FLIPPED]) {
    let m;
    while ((m = re.exec(html)) !== null) {
      // decide which group is which based on the regex used
      const [hreflang, href] =
        re === HREFLANG_RE ? [m[1], m[2]] : [m[2], m[1]];
      alt.set(hreflang, href);
    }
    re.lastIndex = 0;
  }
  return alt;
}

async function main() {
  let files;
  try {
    files = await collectHtml(DIST);
  } catch (err) {
    console.error(
      `${RED}Cannot read ${DIST}. Did you run \`npm run build\` first?${RESET}`,
    );
    console.error(err);
    process.exit(1);
  }

  const alternatesByPath = new Map();
  const errors = [];

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const path = pathFromFile(file);
    const noindex = ROBOTS_NOINDEX_RE.test(html);

    if (noindex) {
      // noindex pages are exempt from hreflang requirements
      continue;
    }

    const alt = extractAlternates(html);
    alternatesByPath.set(path, alt);

    if (alt.size !== 3) {
      errors.push(
        `${path}: expected 3 hreflang alternates, got ${alt.size} (${[...alt.keys()].join(', ')})`,
      );
      continue;
    }
    for (const required of ['en', 'es', 'x-default']) {
      if (!alt.has(required)) {
        errors.push(`${path}: missing hreflang="${required}"`);
      }
    }
  }

  // Reciprocity: for each page, its en/es alternates must resolve to pages
  // that also list this page as their alternate.
  for (const [path, alt] of alternatesByPath) {
    const en = alt.get('en');
    const es = alt.get('es');
    const self = SITE_URL + path;

    if (en === self) {
      // this page IS the EN variant → its es alternate should point back here
      if (es) {
        const esPath = es.replace(SITE_URL, '');
        const otherAlt = alternatesByPath.get(esPath);
        if (!otherAlt) {
          errors.push(`${path}: es alternate ${esPath} not built or noindex`);
        } else if (otherAlt.get('en') !== self) {
          errors.push(
            `${path}: broken reciprocity — ${esPath} does not point back (got en=${otherAlt.get('en') ?? 'none'})`,
          );
        }
      }
    } else if (es === self) {
      // this page IS the ES variant → its en alternate should point back here
      if (en) {
        const enPath = en.replace(SITE_URL, '');
        const otherAlt = alternatesByPath.get(enPath);
        if (!otherAlt) {
          errors.push(`${path}: en alternate ${enPath} not built or noindex`);
        } else if (otherAlt.get('es') !== self) {
          errors.push(
            `${path}: broken reciprocity — ${enPath} does not point back (got es=${otherAlt.get('es') ?? 'none'})`,
          );
        }
      }
    } else {
      errors.push(
        `${path}: neither en nor es alternate points to self (en=${en}, es=${es})`,
      );
    }
  }

  if (errors.length > 0) {
    console.log(`${RED}hreflang errors (${errors.length}):${RESET}`);
    for (const e of errors) console.log(`  - ${e}`);
    process.exit(1);
  }

  console.log(
    `${GREEN}hreflang OK — ${alternatesByPath.size} indexable pages, all reciprocal.${RESET}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
