# Security policy

## Reporting a vulnerability

Email **iosune@acornjuice.com** with the details. Please **do not** open a public GitHub
issue for anything that could affect visitors in the wild.

Include:

- The page URL and what you did.
- What you observed and what you expected.
- Whether you consider the finding remotely exploitable, and by whom.

Acknowledgement within **72 hours**. A first assessment (accepted / clarifying questions /
declined) within **7 days**. Because this is a static site, most fixes ship within a day of
being accepted.

## Scope

This repository builds the corporate site served at <https://www.acornjuice.com>. It is a
static Astro build published to GitHub Pages: there is no backend, no database and no
server-side code under our control.

In scope: anything in this repository, the published HTML/CSS/JS, the Content-Security-Policy,
and the way the site integrates the third parties listed below.

Out of scope: vulnerabilities in GitHub Pages itself, and in the third-party services below —
report those to their owners. We do want to hear about a *misconfiguration* on our side of
any of those integrations.

## Third-party services the site contacts

No SBOM captures these, because they are not packages. They are dependencies all the same:
they execute or receive data in a visitor's session.

| Service | Origin | What it does | Data |
| :--- | :--- | :--- | :--- |
| Google Analytics 4 | `www.googletagmanager.com`, `*.google-analytics.com` | Usage analytics, loaded **only after explicit consent** | Pseudonymised usage data |
| StaticForms | `api.staticforms.dev` | Contact and pilot-request form delivery | Name, email, message |

Consent defaults to denied (`analytics_storage: 'denied'`) and analytics are injected only
once a visitor accepts. The allowlist is enforced in two places that must agree:
`scripts/check-external-origins.mjs`, which fails the build if the built output references an
origin that is not approved, and the `Content-Security-Policy` in `src/layouts/BaseLayout.astro`,
which enforces it in the browser.

## Supply chain

- Dependencies are installed from `package-lock.json` with `npm ci`, which refuses to run if
  the lockfile and manifest disagree.
- `ignore-scripts=true` in `.npmrc`: dependency install hooks never execute. This is the
  mechanism the 2025 npm worms used to propagate.
- Dependabot proposes updates weekly with a cooldown, so freshly published versions are not
  adopted immediately. Security updates bypass that cooldown.
- Every GitHub Action is pinned to a commit SHA rather than a mutable tag.
- `.github/workflows/supply-chain.yml` runs on every push and daily: it produces a CycloneDX
  SBOM, fails the build on any package carrying an OSV `MAL-` advisory, and reports CVEs
  without blocking.

## Data we do not hold

The site sets no cookies of its own, has no login, and stores nothing server-side. The only
browser storage is `localStorage['aj-consent-v1']`, which records the visitor's own consent
choice.
