# GenFlow

GenFlow is a visual builder for GenLayer Intelligent Contracts.
You drag nodes, connect logic, and generate Python contract code in real time.

This project is fully client-side (no backend) and currently in MVP stage.

## What You Get

- 8 built-in templates:
  - AI Arbitrator
  - DAO Vote
  - Price Oracle
  - Content Filter
  - Simple Storage
  - Prediction Market
  - AI Game
  - Custom Compose
- 16 node types in the canvas (Init, Web Fetch, LLM, Storage, Payable, Contract Call, Event Emit, DynArray, TreeMap, HTTP, Access Control, Consensus, VecDB, EVM Bridge, and more)
- Two working modes:
  - Visual mode (React Flow drag/drop builder)
  - Code mode (editable Monaco with snippet insertions)
- Real-time Python code generation
- Built-in GenVM linter panel with diagnostics and quick-fix metadata
- Local contract manager (save/load/delete in browser localStorage)
- Wizard-based template recommendation flow

## Routes

- `/` - landing page
- `/learn` - GenLayer concepts and API quick reference
- `/builder` - main builder UI

Note: the builder is desktop-first. A screen width under `1024px` is blocked by `ResponsiveWarning`.

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
```

### 3. Run Dev Server

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
| `npm run build` | Build static export to `out/` |
| `npm run start` | Not usable with `output: "export"` in this repo |

## Build and Preview Production Output

This repo uses `output: "export"` in `next.config.ts`, so preview static output like this:

```bash
npm run build
npx serve@latest out
```

Then open the local URL printed by `serve`.

## Current Quality Gates (Local Check)

Checked on March 21, 2026:

- `npm run build` -> pass
- `npm test` -> pass (`26` tests)
- `npm run lint` -> pass with `1` warning (`findFirstLine` unused in `src/engine/genvm-linter.ts`)

## Data Persistence

All user data is stored in browser localStorage:

- `genflow-contracts` - saved contracts
- `genflow-welcome-dismissed-v2` - welcome overlay dismissed state

No backend persistence, auth, or sync is included in MVP.

## Production Hardening Checklist

If you want to push this toward production, prioritize:

1. Add CI pipeline (lint + test + build on pull requests).
2. Resolve remaining lint warning and enforce zero-warning policy.
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
