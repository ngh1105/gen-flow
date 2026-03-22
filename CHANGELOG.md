# Changelog

All notable changes to this project are documented in this file.

## [1.0.0-rc.0] - 2026-03-22

### Added
- Playwright end-to-end smoke suite for core flows (navigation, template switch, save/delete/load contract, mode switch, export download).
- CI gates for lint, unit tests, build, production audit, and E2E smoke.
- Security header configs for static deployments (`public/_headers`, `vercel.json`).
- Governance and release operations files:
  - `.github/CODEOWNERS`
  - `.github/PULL_REQUEST_TEMPLATE.md`
  - `docs/RELEASE_CHECKLIST.md`
- Client-side observability bootstrap with Sentry and global error capture.
- `release:check` npm script to run all release quality gates in one command.

### Changed
- Hardened code generation and linting paths for safer output consistency.
- Improved saved state sanitization and migration logic for `localStorage` contracts.
- Updated README with E2E, deployment security, observability, and governance docs.

### Security
- Pinned `dompurify` via `overrides` to a non-vulnerable range.
- Validated `npm audit --omit=dev --json` with zero production vulnerabilities.

