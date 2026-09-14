#!/usr/bin/env node
// Enforces that every page under src/pages/**/*.astro renders BaseLayout with
// a valid `pageType` prop. BaseLayout surfaces that value as `data-page-type`
// on <html> and ConsentBanner uses it as GA4 `content_group`, so a missing or
// mistyped value would silently break analytics segmentation.
//
// Static (not-quite-parse) check based on regex, matching the style of the
// other scripts in this folder. Astro's `astro check` already type-checks the
// prop; this script catches the two failure modes the type system can't:
//   1. A new page created without a BaseLayout usage at all.
//   2. A pageType value not present in the canonical PAGE_TYPES list — this
//      can happen if someone edits analytics.ts and drops a value without
//      updating the pages, or types a literal that TS accepts because of
//      loose narrowing.

import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PAGES_DIR = join(ROOT, 'src', 'pages');
const ANALYTICS_FILE = join(ROOT, 'src', 'utils', 'analytics.ts');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

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

/**
 * Extract the canonical PAGE_TYPES tuple from analytics.ts. We parse the
 * source instead of importing it because this script runs under plain Node
 * without a TS loader.
 * @param {string} src
 * @returns {string[]}
 */
function extractPageTypes(src) {
  const match = src.match(
    /export const PAGE_TYPES\s*=\s*\[([\s\S]*?)\]\s*as const/,
  );
  if (!match) {
    throw new Error(
      'Could not find `export const PAGE_TYPES = [...] as const` in analytics.ts',
    );
  }
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

async function main() {
  const analyticsSrc = await readFile(ANALYTICS_FILE, 'utf8');
  const validTypes = new Set(extractPageTypes(analyticsSrc));

  const files = await collectAstroFiles(PAGES_DIR);
  const errors = [];

  for (const file of files) {
    const rel = relative(ROOT, file);
    const content = await readFile(file, 'utf8');

    // Every page must render BaseLayout. Layout files inside src/pages/ don't
    // exist in this project, so this is a safe global assertion.
    if (!/<BaseLayout\b/.test(content)) {
      errors.push(`${rel}: does not render <BaseLayout>`);
      continue;
    }

    // pageType may be a string literal (pageType="home") or an expression
    // (pageType={value}). Only string literals can be validated statically;
    // expressions rely on the TS type check to catch mismatches.
    const literalMatch = content.match(/pageType\s*=\s*"([^"]+)"/);
    const exprMatch = content.match(/pageType\s*=\s*\{/);

    if (!literalMatch && !exprMatch) {
      errors.push(`${rel}: missing pageType prop on <BaseLayout>`);
      continue;
    }

    if (literalMatch && !validTypes.has(literalMatch[1])) {
      errors.push(
        `${rel}: pageType="${literalMatch[1]}" is not in PAGE_TYPES ` +
          `(valid: ${[...validTypes].join(', ')})`,
      );
    }
  }

  if (errors.length > 0) {
    console.log(`${RED}Errors (${errors.length}):${RESET}`);
    for (const e of errors) console.log(`  - ${e}`);
    process.exit(1);
  }

  console.log(
    `${GREEN}page-types OK — ${files.length} pages, all render <BaseLayout> with a valid pageType.${RESET}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
