#!/usr/bin/env node
// Invariants of the `articles` collection that the zod schema cannot see,
// because zod validates one file at a time and these hold *between* files:
//   1. Every folder ships both en.md and es.md. A half-built pair would emit a
//      page whose hreflang alternate 404s — the failure this whole layout is
//      designed to prevent.
//   2. No slug repeats within a language (two pages, one URL).
//   3. No slug collides with a product slug: /articles/<slug>/ and
//      /products/<slug>/ are different trees today, but the Spanish product
//      slugs and article slugs share enough shape that a collision would be
//      confusing long before it is breaking.
//   4. `related`, when present, names a product that exists.
//
// Frontmatter is read with a narrow regex, matching the style of the other
// scripts here: `astro check` already enforces types and shapes, so this only
// needs the few scalar fields the cross-file rules depend on.

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ARTICLES = join(ROOT, 'src', 'content', 'articles');
const PRODUCTS = join(ROOT, 'src', 'content', 'products');
const LOCALES = ['en', 'es'];

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

/** Read a top-level scalar from the frontmatter block. */
function field(source, name) {
  const m = source.match(
    new RegExp(`^${name}:[ \\t]*["']?([^"'\\n]+?)["']?[ \\t]*$`, 'm'),
  );
  return m ? m[1].trim() : null;
}

async function productSlugs() {
  const slugs = new Set();
  let files;
  try {
    files = await readdir(PRODUCTS);
  } catch {
    return slugs;
  }
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const src = await readFile(join(PRODUCTS, file), 'utf8');
    for (const name of ['slug', 'slugEs']) {
      const value = field(src, name);
      if (value) slugs.add(value);
    }
  }
  return slugs;
}

async function main() {
  const errors = [];

  let folders;
  try {
    folders = (await readdir(ARTICLES, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    console.log(`${GREEN}✓${RESET} articles: no pieces yet, nothing to check`);
    return;
  }

  const products = await productSlugs();
  const seen = { en: new Map(), es: new Map() };

  for (const folder of folders.sort()) {
    for (const locale of LOCALES) {
      const path = join(ARTICLES, folder, `${locale}.md`);
      let src;
      try {
        src = await readFile(path, 'utf8');
      } catch {
        errors.push(`${folder}: missing ${locale}.md — articles ship in both languages`);
        continue;
      }

      const slug = field(src, 'slug');
      if (!slug) {
        errors.push(`${folder}/${locale}.md: no slug in the frontmatter`);
        continue;
      }

      const previous = seen[locale].get(slug);
      if (previous) {
        errors.push(
          `${folder}/${locale}.md: slug "${slug}" already used by ${previous}`,
        );
      }
      seen[locale].set(slug, `${folder}/${locale}.md`);

      if (products.has(slug)) {
        errors.push(
          `${folder}/${locale}.md: slug "${slug}" collides with a product slug`,
        );
      }

      const related = field(src, 'related');
      if (related && !products.has(related)) {
        errors.push(
          `${folder}/${locale}.md: related "${related}" is not a product slug`,
        );
      }
    }
  }

  if (errors.length) {
    console.error(`${RED}✗ articles${RESET}`);
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }

  console.log(
    `${GREEN}✓${RESET} articles: ${folders.length} piece(s) in both languages, no slug collisions`,
  );
}

main();
