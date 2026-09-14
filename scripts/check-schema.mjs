#!/usr/bin/env node
// Structural validation of the JSON-LD injected by StructuredData.astro:
//  1. Every HTML page contains at least one <script type="application/ld+json">.
//  2. Its content is parseable JSON.
//  3. It follows the @graph shape with @context = schema.org.
//  4. Every @id referenced (via `{ "@id": "..." }` shorthand) resolves to a
//     node also declared in the graph — this catches typos and dangling refs
//     that Google Search Console would happily accept but silently break the
//     entity linking we care about.

import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const LD_RE =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g;

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

/**
 * Walk a JSON-LD graph collecting (a) all @id definitions and (b) all @id
 * references from `{ "@id": "..." }` shorthand nodes that ONLY carry an @id.
 */
function walk(node, definedIds, referencedIds) {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, definedIds, referencedIds);
    return;
  }
  if (node === null || typeof node !== 'object') return;

  const keys = Object.keys(node);
  const isReferenceOnly =
    keys.length === 1 && keys[0] === '@id' && typeof node['@id'] === 'string';

  if (isReferenceOnly) {
    referencedIds.add(node['@id']);
    return;
  }

  if (typeof node['@id'] === 'string') {
    definedIds.add(node['@id']);
  }

  for (const v of Object.values(node)) {
    walk(v, definedIds, referencedIds);
  }
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

  const errors = [];
  let checked = 0;

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const rel = relative(DIST, file);
    const scripts = [];
    let m;
    while ((m = LD_RE.exec(html)) !== null) {
      scripts.push(m[1]);
    }

    if (scripts.length === 0) {
      errors.push(`${rel}: no JSON-LD found`);
      continue;
    }

    const definedIds = new Set();
    const referencedIds = new Set();

    for (const raw of scripts) {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        errors.push(`${rel}: unparseable JSON-LD (${err.message})`);
        continue;
      }

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        parsed['@context'] !== 'https://schema.org'
      ) {
        errors.push(`${rel}: JSON-LD missing @context = https://schema.org`);
        continue;
      }

      if (!Array.isArray(parsed['@graph'])) {
        errors.push(`${rel}: JSON-LD missing @graph array`);
        continue;
      }

      walk(parsed['@graph'], definedIds, referencedIds);
    }

    for (const refId of referencedIds) {
      if (!definedIds.has(refId)) {
        errors.push(`${rel}: @id reference "${refId}" not defined in graph`);
      }
    }

    checked++;
  }

  if (errors.length > 0) {
    console.log(`${RED}Schema errors (${errors.length}):${RESET}`);
    for (const e of errors) console.log(`  - ${e}`);
    process.exit(1);
  }

  console.log(
    `${GREEN}Structured data OK — ${checked} HTML pages, all @id refs resolve.${RESET}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
