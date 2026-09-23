// Tests for the third-party origin gate.
//
// The gate is a security control, so the properties worth pinning down are not
// just "does it fail on an unknown origin" but which kind it decides an origin
// is, and what it then tells the person who hit it. Getting the advice wrong is
// how a Content-Security-Policy gets widened for something that never needed to
// be in it.
//
// Each case builds a throwaway tree and points the checker at it, so nothing
// here depends on a real build or on the contents of dist/.

import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const CHECKER = fileURLToPath(new URL('../check-external-origins.mjs', import.meta.url));
const ANSI = /\x1B\[[0-9;]*m/g;

/** @type {string[]} */
const fixtures = [];

after(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

/**
 * Builds a fixture tree. `files` maps a relative path to its contents.
 * @param {Record<string, string>} files
 */
function tree(files) {
  const dir = mkdtempSync(join(tmpdir(), 'aj-origins-'));
  fixtures.push(dir);
  for (const [rel, body] of Object.entries(files)) {
    const path = join(dir, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body, 'utf8');
  }
  return dir;
}

function run(dir) {
  const proc = spawnSync(process.execPath, [CHECKER, dir], { encoding: 'utf8' });
  assert.equal(proc.error, undefined, String(proc.error));
  return {
    status: proc.status,
    stdout: (proc.stdout ?? '').replace(ANSI, ''),
    stderr: (proc.stderr ?? '').replace(ANSI, ''),
  };
}

const page = (body) => `<!doctype html><html><body>${body}</body></html>`;

describe('check-external-origins', () => {
  it('passes when every origin is on an allowlist', () => {
    const dir = tree({
      'index.html': page(
        '<a href="https://github.com/acorn">repo</a>' +
          '<a href="https://www.enisa.europa.eu/topics">ENISA</a>' +
          '<script src="https://www.googletagmanager.com/gtag/js"></script>',
      ),
    });

    const { status, stdout } = run(dir);
    assert.equal(status, 0);
    assert.match(stdout, /All external origins are on the allowlist/);
  });

  it('allows the CRA article citation origins', () => {
    const dir = tree({
      'articles/cra/index.html': page(
        [
          'https://digital-strategy.ec.europa.eu/en/policies/cra-reporting',
          'https://www.enisa.europa.eu/topics/product-security',
          'https://www.helpnetsecurity.com/2026/09/14/enisa-cra-single-reporting-platform/',
          'https://www.crowell.com/en/insights/client-alerts/its-live',
        ]
          .map((url) => `<a href="${url}" rel="noopener noreferrer" target="_blank">src</a>`)
          .join(''),
      ),
    });

    assert.equal(run(dir).status, 0);
  });

  it('rejects an unknown link origin without sending anyone to the CSP', () => {
    const dir = tree({ 'index.html': page('<a href="https://example.com/post">x</a>') });

    const { status, stderr } = run(dir);
    assert.equal(status, 1);
    assert.match(stderr, /https:\/\/example\.com {2}\(link\)/);
    assert.match(stderr, /add it to LINK/);
    assert.match(stderr, /Leave the CSP alone/);
    assert.doesNotMatch(stderr, /AND to the CSP/);
    assert.doesNotMatch(stderr, /BaseLayout/);
  });

  it('rejects an unknown resource origin and points at the CSP', () => {
    const dir = tree({ 'index.html': page('<script src="https://cdn.example.net/a.js"></script>') });

    const { status, stderr } = run(dir);
    assert.equal(status, 1);
    assert.match(stderr, /https:\/\/cdn\.example\.net {2}\(resource\)/);
    assert.match(stderr, /add it to RESOURCE/);
    assert.match(stderr, /CSP in src\/layouts\/BaseLayout\.astro/);
    assert.doesNotMatch(stderr, /add it to LINK/);
  });

  it('gives both remediations when both kinds are unapproved', () => {
    const dir = tree({
      'index.html': page(
        '<a href="https://example.com/post">x</a>' +
          '<script src="https://cdn.example.net/a.js"></script>',
      ),
    });

    const { status, stderr } = run(dir);
    assert.equal(status, 1);
    assert.match(stderr, /add it to RESOURCE/);
    assert.match(stderr, /add it to LINK/);
  });

  it('does not let a link-only origin be loaded as a resource', () => {
    // github.com is on LINK. Being allowed as a link target must not make it
    // allowed to serve script into our origin.
    const dir = tree({ 'index.html': page('<script src="https://github.com/x.js"></script>') });

    const { status, stderr } = run(dir);
    assert.equal(status, 1);
    assert.match(stderr, /https:\/\/github\.com {2}\(resource\)/);
    assert.match(stderr, /add it to RESOURCE/);
  });

  it('treats an origin loaded in one file as a resource everywhere', () => {
    const dir = tree({
      'a.html': page('<a href="https://cdn.example.net/docs">docs</a>'),
      'b.html': page('<script src="https://cdn.example.net/a.js"></script>'),
    });

    const { stderr } = run(dir);
    assert.match(stderr, /https:\/\/cdn\.example\.net {2}\(resource\)/);
  });

  it('fails loudly when the scan root is missing', () => {
    const { status, stderr } = run(join(tmpdir(), 'aj-origins-does-not-exist'));
    assert.equal(status, 1);
    assert.match(stderr, /not found/);
  });

  it('fails loudly when the scan root has nothing to inspect', () => {
    const dir = tree({ 'logo.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>' });
    const { status, stderr } = run(dir);
    assert.equal(status, 1);
    assert.match(stderr, /no inspectable files/);
  });
});
