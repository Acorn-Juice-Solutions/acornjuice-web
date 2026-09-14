#!/usr/bin/env node
// Enforces two invariants on the i18n dictionaries:
//  1. Every key present in one locale is present in the other (structural parity).
//  2. Every t('some.key') call in .astro files resolves to a real key in both
//     dictionaries. Missing keys would surface at runtime as a build error
//     thanks to i18n.ts throwing, but we want to catch them in CI before we
//     even attempt to build.

import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const I18N_DIR = join(ROOT, 'src', 'i18n');
const SRC_DIR = join(ROOT, 'src');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

/**
 * @param {unknown} obj
 * @param {string} prefix
 * @param {Set<string>} out
 */
function collectKeys(obj, prefix, out) {
  if (obj === null || typeof obj !== 'object') return;
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      collectKeys(v, full, out);
    } else {
      out.add(full);
    }
  }
}

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function collectAstroFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectAstroFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.astro')) {
      files.push(full);
    }
  }
  return files;
}

const T_CALL_RE = /\bt\(\s*['"]([\w.]+)['"]\s*\)/g;

async function main() {
  // 1. Load both dictionaries.
  const enRaw = await readFile(join(I18N_DIR, 'en.json'), 'utf8');
  const esRaw = await readFile(join(I18N_DIR, 'es.json'), 'utf8');
  const en = JSON.parse(enRaw);
  const es = JSON.parse(esRaw);

  const enKeys = new Set();
  const esKeys = new Set();
  collectKeys(en, '', enKeys);
  collectKeys(es, '', esKeys);

  const errors = [];
  const warnings = [];

  const missingInEs = [...enKeys].filter((k) => !esKeys.has(k));
  const missingInEn = [...esKeys].filter((k) => !enKeys.has(k));

  for (const k of missingInEs) {
    errors.push(`missing in es.json: ${k}`);
  }
  for (const k of missingInEn) {
    errors.push(`missing in en.json: ${k}`);
  }

  // 2. Scan source for t('...') calls.
  const astroFiles = await collectAstroFiles(SRC_DIR);
  const usedKeys = new Map(); // key -> Set<file>

  for (const file of astroFiles) {
    const content = await readFile(file, 'utf8');
    let match;
    while ((match = T_CALL_RE.exec(content)) !== null) {
      const key = match[1];
      if (!usedKeys.has(key)) usedKeys.set(key, new Set());
      usedKeys.get(key).add(relative(ROOT, file));
    }
  }

  for (const [key, files] of usedKeys) {
    if (!enKeys.has(key)) {
      const filesList = [...files].join(', ');
      errors.push(`t('${key}') used but not defined in en.json (${filesList})`);
    }
    if (!esKeys.has(key)) {
      const filesList = [...files].join(', ');
      errors.push(`t('${key}') used but not defined in es.json (${filesList})`);
    }
  }

  // 3. Warn about unused keys (soft signal).
  const unused = [...enKeys].filter((k) => !usedKeys.has(k));
  for (const k of unused) {
    warnings.push(`unused key: ${k}`);
  }

  // 4. Report.
  if (warnings.length > 0) {
    console.log(`${YELLOW}Warnings (${warnings.length}):${RESET}`);
    for (const w of warnings) console.log(`  - ${w}`);
  }

  if (errors.length > 0) {
    console.log(`${RED}Errors (${errors.length}):${RESET}`);
    for (const e of errors) console.log(`  - ${e}`);
    process.exit(1);
  }

  console.log(
    `${GREEN}i18n OK — ${enKeys.size} keys, ${astroFiles.length} .astro files, ${usedKeys.size} keys referenced.${RESET}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
