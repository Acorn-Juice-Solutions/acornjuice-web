#!/usr/bin/env node
// Enforces that every URL field declared in the `makers` schema
// (content.config.ts) is actually rendered by MakerCard.astro. Adding a URL
// field to the schema without rendering it would silently drop the link from
// every maker profile on the public site — Zod would happily validate the
// frontmatter and Astro would build without warnings.
//
// Static regex-based check, matching the style of sibling scripts.

import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONFIG_FILE = join(ROOT, 'src', 'content.config.ts');
const CARD_FILE = join(ROOT, 'src', 'components', 'MakerCard.astro');
const MAKERS_DIR = join(ROOT, 'src', 'content', 'makers');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

/**
 * Extract the maker schema block from content.config.ts and return the list
 * of field names typed as `z.url()` (optional or required). We parse text
 * rather than importing because the file is TypeScript.
 * @param {string} src
 * @returns {string[]}
 */
function extractMakerUrlFields(src) {
  const block = src.match(
    /const makers\s*=\s*defineCollection\(\{[\s\S]*?schema:\s*z\.object\(\{([\s\S]*?)\}\)[\s\S]*?\}\);/,
  );
  if (!block) {
    throw new Error(
      'Could not locate `const makers = defineCollection({ ... })` in content.config.ts',
    );
  }
  const body = block[1];
  const fieldRe = /^\s*([a-zA-Z_$][\w$]*)\s*:\s*z\.url\(\)/gm;
  const fields = [];
  let m;
  while ((m = fieldRe.exec(body)) !== null) {
    fields.push(m[1]);
  }
  return fields;
}

async function collectMakerFiles() {
  const entries = await readdir(MAKERS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => join(MAKERS_DIR, e.name));
}

async function main() {
  const [configSrc, cardSrc] = await Promise.all([
    readFile(CONFIG_FILE, 'utf8'),
    readFile(CARD_FILE, 'utf8'),
  ]);

  const urlFields = extractMakerUrlFields(configSrc);
  if (urlFields.length === 0) {
    throw new Error(
      'Expected at least one z.url() field in the maker schema — did the schema shape change?',
    );
  }

  const errors = [];

  for (const field of urlFields) {
    const ref = new RegExp(`\\bdata\\.${field}\\b`);
    if (!ref.test(cardSrc)) {
      errors.push(
        `MakerCard.astro does not reference \`data.${field}\` — schema declares it but the card never renders it.`,
      );
    }
  }

  const makerFiles = await collectMakerFiles();
  for (const file of makerFiles) {
    const raw = await readFile(file, 'utf8');
    const rel = relative(ROOT, file);
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) {
      errors.push(`${rel}: missing YAML frontmatter`);
      continue;
    }
    for (const field of urlFields) {
      const line = new RegExp(`^${field}\\s*:\\s*["']?([^"'\\s]+)`, 'm');
      const match = fm[1].match(line);
      if (!match) continue;
      try {
        // eslint-disable-next-line no-new
        new URL(match[1]);
      } catch {
        errors.push(`${rel}: field \`${field}\` is not a valid URL: ${match[1]}`);
      }
    }
  }

  if (errors.length > 0) {
    console.log(`${RED}Maker errors (${errors.length}):${RESET}`);
    for (const e of errors) console.log(`  - ${e}`);
    process.exit(1);
  }

  console.log(
    `${GREEN}makers OK — ${urlFields.length} URL fields wired to MakerCard, ${makerFiles.length} maker(s) validated.${RESET}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
