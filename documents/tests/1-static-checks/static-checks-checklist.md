# Static Checks Checklist

## Phase 0 – Baseline inventory

- [x] Record current `npm run lint` and `npm run typecheck` runtimes; populate `metrics-tracker.md`. (branch: main @6fb4d23 — lint 7.63s, typecheck 7.23s but currently failing with TS2307/TS2835)
- [x] Review `eslint.config.mjs` and `tsconfig.json` for gaps (missing rules, outdated targets) and log findings in `decisions.md` (commit: wip @6fb4d23 — baseUrl realigned to repo root, ADR-002/003 capture NodeNext extension gap).
- [x] Validate local developer workflow (Node/npm versions, required env vars) and document in the README. (commit: wip @6fb4d23 — README now notes Node 18, npm 11, env expectations)

## Phase 1 – Documentation & formatting

- [x] Finalize README/plan/ticket to describe scope, commands, and expectations (commit: wip @6fb4d23 — README commands refreshed, plan notes Phase 1 outcomes).
- [x] Add Prettier scripts (`format:check`, `format:write`) plus documentation for supported file globs (`package.json`, `.prettierignore`, README).
- [x] Decide on formatting ownership (CI vs. pre-commit) and capture ADR entry (ADR-004 — rely on scripts + CI; defer hooks to Phase 2).

## Phase 2 – CI alignment & automation

- [x] Update backend CI workflow to run `lint`, `typecheck`, and `format:check` before unit tests; link job references in `decisions.md`. (commit: 5172159 — backend CI workflow updated with static stage + format check)
- [ ] Add Husky/lint-staged or equivalent automation; document setup/opt-out instructions.
- [x] Enable ESLint cache/TS incremental builds in CI for stable runtimes; record improvements in `metrics-tracker.md`. (commit: 5172159 — CI now caches `node_modules/.cache/eslint` and `tsconfig.tsbuildinfo`)

## Phase 3 – Extended checks & metrics

- [ ] Integrate OpenAPI/Zod schema validation into the static stage and reference scripts in README.
- [ ] Define KPIs (max runtime, zero warnings) and automate reporting via `metrics-tracker.md`.
- [ ] Schedule quarterly/annual review of static tooling; log agenda/outcomes in `decisions.md`.
