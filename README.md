# GenFlow

GenFlow is a chat-first, no-code builder for GenLayer Intelligent Contracts.
Most users describe the contract idea in natural language, let GenFlow prepare the first draft, review the generated assumptions, preview the user flow, and export Python without touching code or canvas controls.

This project is fully client-side (no backend) and currently at release-candidate stage (`v1.0.0-rc.0`).

## What You Get

- 12 built-in templates:
  - AI Arbitrator
  - AI Governance
  - Future of Work
  - Onchain Justice
  - Oracle Benchmark
  - DAO Vote
  - Price Oracle
  - Content Filter
  - Simple Storage
  - Prediction Market
  - AI Game
  - Custom Compose
- 16 node types in the canvas (Init, Web Fetch, LLM, Storage, Payable, Contract Call, Event Emit, DynArray, TreeMap, HTTP, Access Control, Consensus, VecDB, EVM Bridge, and more)
- Two working modes:
  - Chat-first guided mode (idea -> draft review -> preview -> export)
  - Advanced developer tools (read-only template canvas, Custom Compose, and advanced code for technical users)
- Real-time Python code generation
- Shared Flow Health engine with:
  - graph-health issues and recommendations
  - next-best-step quick actions
  - sidebar badges for missing or suggested nodes
- Chat-first idea workspace that turns a plain-language brief into a draft review before the guided form appears
- Guided setup workspace for post-chat review so no-code users can confirm fields without opening canvas or code views
- Built-in GenVM linter panel with diagnostics and quick-fix metadata
- Local contract manager (save/load/delete in browser localStorage)
- Wizard-based template recommendation flow with confidence, caution, and alternative preset guidance
- Versioned project JSON export/import for portable builder state
- Client-side behavior preview showing mocked execution, expected inputs, methods, and dependencies

## Routes

- `/` - landing page
- `/learn` - GenLayer concepts and API quick reference
- `/builder` - main builder UI

Note: the builder is desktop-first. A screen width under `1024px` is blocked by `ResponsiveWarning`.

## Beta Notes

- Builder editing is supported on desktop-width screens (`1024px+`).
- Builder opens in a chat-first idea workspace by default.
- Template mode hides the canvas by default; the main review surface is a guided form workspace.
- Preview review is required before export in the guided template flow. Editing the draft after review requires opening Preview again.
- Conversational refinements can update the current draft and will require preview review again before export.
- GenFlow now keeps two local browser records:
  - `genflow-contracts` for named saves you create in **My Contracts**
  - `genflow-working-session` for the autosaved in-progress draft
- Portable project export/import uses versioned `genflow-project` JSON files from **My Contracts**.
- Flow Health guidance is advisory: it helps explain weak or incomplete graphs, but it does not replace contract review or runtime validation.
- Behavior Preview is a mocked client-side walkthrough, not real GenLayer execution or chain validation.
- Reload and crash recovery restore the autosaved draft from the same browser profile.
- If local browser data becomes corrupted, clear the affected keys in DevTools storage and reopen the builder.

## Tech Stack

- Next.js 16 (App Router, static export)
- React 19
- TypeScript (strict mode)
- Zustand (state management)
- `@xyflow/react` (visual graph/canvas)
- Monaco Editor (`@monaco-editor/react`)
- Vitest (unit tests)
- ESLint (Next.js + TypeScript rules)

## Project Structure

```text
src/
  app/                      # routes: /, /learn, /builder
  components/
    layout/                 # panels, overlays, editor mode, toolbar
    nodes/                  # 16 custom canvas nodes
  engine/
    templates/              # template definitions
    codeGenerator.ts        # template-based generation
    composeCode.ts          # dynamic generation for custom-compose
    genvm-linter.ts         # client-side lint rules
    monacoGenVM.ts          # Monaco lint integration
  store/
    useFlowStore.ts         # global app state (nodes, edges, nodeData)
  __tests__/                # vitest regression tests
templates/                  # sample python contracts
```

## Local Development

### 1. Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended

### 2. Install

```bash
npm install
npx playwright install chromium
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

### 4. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run Playwright smoke tests (Chromium) |
| `npm run test:e2e:ui` | Open Playwright UI mode locally |
| `npm run release:check` | Run full release quality gate pipeline |
| `npm run build` | Build static export to `out/` |
| `npm run start` | Serve static `out/` on port `3000` (run `npm run build` first) |

## Build and Preview Production Output

This repo uses `output: "export"` in `next.config.ts`, so preview static output like this:

```bash
npm run build
npx serve@latest out
```

Then open the local URL printed by `serve`.

## Current Quality Gates (Local Check)

Checked on March 23, 2026:

- `npm run build` -> pass
- `npm test` -> pass (`73` tests)
- `npm run test:e2e` -> pass (`21` Playwright smoke tests)
- `npm run lint` -> pass
- `npm audit --omit=dev --json` -> pass (`0` vulnerabilities)

## CI Gates

GitHub Actions workflow at `.github/workflows/ci.yml` now enforces:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. `npm audit --omit=dev --json`
5. `npm run test:e2e` (Playwright smoke)

Any failing gate should block merge to `main`.

## Deployment Security Headers

Because this project uses static export (`output: "export"`), security headers must be set at the host layer.

- Cloudflare Pages / Netlify: [`public/_headers`](/public/_headers)
- Vercel: [`vercel.json`](/vercel.json)

## Observability (Sentry)

Client-side runtime tracking is integrated via [`SentryInit.tsx`](/src/components/observability/SentryInit.tsx) and [`global-error.tsx`](/src/app/global-error.tsx).

- Set `NEXT_PUBLIC_SENTRY_DSN` to enable reporting.
- Optional tuning:
  - `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`
  - `NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`
  - `NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`

See [`.env.example`](/.env.example) for all variables.

## Governance

- PR template: [`.github/PULL_REQUEST_TEMPLATE.md`](/.github/PULL_REQUEST_TEMPLATE.md)
- Code ownership: [`.github/CODEOWNERS`](/.github/CODEOWNERS)
- Release runbook: [`docs/RELEASE_CHECKLIST.md`](/docs/RELEASE_CHECKLIST.md)
- Changelog: [`CHANGELOG.md`](/CHANGELOG.md)

## Data Persistence

All user data is stored in browser localStorage:

- `genflow-contracts` - saved contracts
- `genflow-working-session` - autosaved current draft and recovery metadata
- `genflow-welcome-dismissed-v3` - onboarding dismissed state

Portable sharing between browsers or machines is handled through exported project JSON files, not backend sync.

No backend persistence, auth, or cloud sync is included in MVP.

## Supported Browsers

- Latest Chrome / Edge desktop: primary target
- Latest Firefox desktop: expected to work for core flows
- Mobile browsers: learn/landing routes are usable, but builder editing remains unsupported

## Production Hardening Checklist

If you want to push this toward production, prioritize:

1. Add CI pipeline (lint + test + build on pull requests).
2. Keep zero-warning lint policy and block merges when quality gates fail.
3. Add E2E tests for core builder flows (template switch, drag/drop, export).
4. Add runtime error tracking and session replay.
5. Add schema/versioning for localStorage data migrations.
6. Add explicit license file and contribution policy.

## Contributing

1. Create a feature branch.
2. Make changes with focused commits.
3. Run:

```bash
npm run lint
npm test
npm run build
```

4. Open a pull request.

## License

No `LICENSE` file is currently present in this repository.
