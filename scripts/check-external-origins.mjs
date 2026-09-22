#!/usr/bin/env node
// Guards the site's third-party surface, which no SBOM can see.
//
// package-lock.json describes what we build with. It says nothing about what a
// visitor's browser is told to contact at runtime: an analytics snippet, a form
// endpoint, a font CDN, a chat widget someone drops into a layout. Those are
// dependencies too, and they execute in the visitor's session with full access
// to the DOM.
//
// So this fails the build when dist/ references an origin that is not on the
// allowlist below. Adding a third party becomes a deliberate two-line change
// with a reviewer, instead of something that lands unnoticed in a component.
//
// Two lists, because the risk is not the same:
//   RESOURCE  - can load code, styles, fonts, or receive submitted data.
//               A compromise here runs in our origin or takes our users' data.
//   LINK      - only ever appears as a link target or in JSON-LD metadata.
//               A compromise there is someone else's problem.
//
// Keep this in sync with the Content-Security-Policy in BaseLayout.astro: the
// CSP is what actually enforces this at runtime, and this check is what stops
// the two from drifting apart.

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const RESOURCE = new Set([
  'https://www.acornjuice.com',        // self
  'https://accuvideo.acornjuice.com',  // own product site
  'https://www.googletagmanager.com',  // GA4, injected only after consent
  'https://www.google-analytics.com',  // GA4 collect beacon
  'https://api.staticforms.dev',       // contact + pilot form POST target
]);

const LINK = new Set([
  'https://schema.org',                // JSON-LD vocabulary, fetches nothing
  'https://github.com',
  'https://www.linkedin.com',
  'https://es.linkedin.com',
  'https://www.artstation.com',
  'https://vimeo.com',
  'https://www.producthunt.com',
  'https://www.aepd.es',               // privacy policy reference
]);

// Contexts that make the browser fetch something, or send something out.
const LOADING_PATTERNS = [
  /\bsrc\s*=\s*["']?(https:\/\/[^"'\s>]+)/gi,           // <script src>, <img src>, <iframe src>
  /\.src\s*=\s*["`'](https:\/\/[^"`']+)/gi,             // dynamically injected scripts
  /\baction\s*=\s*["']?(https:\/\/[^"'\s>]+)/gi,        // <form action> - data leaves here
  /<link\b[^>]*\bhref\s*=\s*["']?(https:\/\/[^"'\s>]+)/gi,
  /\bfetch\s*\(\s*["`'](https:\/\/[^"`']+)/gi,
  /\bnew\s+Worker\s*\(\s*["`'](https:\/\/[^"`']+)/gi,
  /\bimportScripts\s*\(\s*["`'](https:\/\/[^"`']+)/gi,
  /@import\s+(?:url\()?["']?(https:\/\/[^"')\s]+)/gi,
  /\burl\(\s*["']?(https:\/\/[^"')\s]+)/gi,             // CSS url()
];

const ANY_ORIGIN = /https:\/\/[A-Za-z0-9.-]+/g;

function originOf(url) {
  const match = /^https:\/\/[A-Za-z0-9.-]+/.exec(url);
  return match ? match[0] : null;
}

async function collectFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await collectFiles(path)));
    } else if (/\.(html|js|mjs|css|json|xml|webmanifest)$/i.test(entry.name)) {
      out.push(path);
    }
  }
  return out;
}

async function main() {
  try {
    await stat(DIST);
  } catch {
    console.error(`${RED}dist/ not found — run "npm run build" first.${RESET}`);
    process.exit(1);
  }

  const files = await collectFiles(DIST);
  if (files.length === 0) {
    console.error(`${RED}dist/ contains no inspectable files.${RESET}`);
    process.exit(1);
  }

  /** @type {Map<string, {kind: 'resource'|'link', files: Set<string>}>} */
  const seen = new Map();

  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const rel = relative(ROOT, file);

    const loading = new Set();
    for (const pattern of LOADING_PATTERNS) {
      pattern.lastIndex = 0;
      let m;
      while ((m = pattern.exec(text)) !== null) {
        const origin = originOf(m[1]);
        if (origin) loading.add(origin);
      }
    }

    for (const raw of text.match(ANY_ORIGIN) ?? []) {
      const kind = loading.has(raw) ? 'resource' : 'link';
      const entry = seen.get(raw) ?? { kind: 'link', files: new Set() };
      // resource wins: if an origin is loaded anywhere, treat it as loaded.
      if (kind === 'resource') entry.kind = 'resource';
      entry.files.add(rel);
      seen.set(raw, entry);
    }
  }

  const violations = [];
  for (const [origin, { kind, files: where }] of [...seen].sort()) {
    const allowed = kind === 'resource' ? RESOURCE.has(origin) : RESOURCE.has(origin) || LINK.has(origin);
    if (!allowed) {
      violations.push({ origin, kind, where: [...where].slice(0, 3) });
    }
  }

  console.log(`Scanned ${files.length} built files, found ${seen.size} distinct external origins.`);

  if (violations.length > 0) {
    console.error(`\n${RED}Unapproved external origins:${RESET}`);
    for (const { origin, kind, where } of violations) {
      console.error(`  ${RED}${origin}${RESET}  (${kind})`);
      for (const f of where) console.error(`      ${DIM}${f}${RESET}`);
    }
    console.error(
      `\nIf this is intentional, add the origin to ${kindHint(violations)} in ` +
        `scripts/check-external-origins.mjs AND to the CSP in src/layouts/BaseLayout.astro.`,
    );
    process.exit(1);
  }

  const resources = [...seen].filter(([, v]) => v.kind === 'resource').map(([o]) => o);
  console.log(`${GREEN}All external origins are on the allowlist.${RESET}`);
  console.log(`${DIM}Resource-loading origins: ${resources.join(', ') || 'none'}${RESET}`);
}

function kindHint(violations) {
  return violations.some((v) => v.kind === 'resource') ? 'RESOURCE' : 'LINK';
}

main().catch((err) => {
  console.error(`${RED}${err.stack || err.message}${RESET}`);
  process.exit(1);
});
