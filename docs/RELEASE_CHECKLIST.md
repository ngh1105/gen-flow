# Release Checklist

## 1) Pre-Release (T-1)

- [ ] Confirm branch protection requires CI on `main`.
- [ ] Confirm CI is green on latest commit.
- [ ] Confirm no unresolved high-severity bugs in tracker.
- [ ] Confirm release version and changelog are prepared.

## 2) Quality Gates

- [ ] `npm run release:check`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:e2e`
- [ ] `npm audit --omit=dev --json`

## 3) Deployment Readiness

- [ ] Security headers configured at host level (`public/_headers` or `vercel.json`).
- [ ] `NEXT_PUBLIC_SENTRY_DSN` set for target environment.
- [ ] Confirm Sentry release/environment values for traceability.
- [ ] Smoke test routes: `/`, `/learn`, `/builder`.
- [ ] Confirm beta notes and browser support docs are up to date in `README.md`.
- [ ] Confirm autosaved draft restore works after refresh in the target environment.
- [ ] Confirm unsupported viewport message is shown below `1024px` and routes users back safely.
- [ ] Confirm Flow Health issues and quick actions render for an invalid Custom Compose graph.
- [ ] Confirm project JSON export/import round-trip restores the same builder state.
- [ ] Confirm Behavior Preview opens, updates with the active graph, and clearly states its client-side limitations.

## 4) Release

- [ ] Tag release (`vX.Y.Z`).
- [ ] Deploy artifact from tagged commit.
- [ ] Verify live smoke test on production URL.
- [ ] Monitor Sentry for the first 30 minutes.

## 5) Rollback Plan

- [ ] Keep previous release artifact/tag available.
- [ ] If critical issue appears, redeploy previous stable tag.
- [ ] Record incident summary and follow-up fixes.
- [ ] If recovery/storage issues appear, capture the affected localStorage payloads before clearing browser data.
