# Static Checks

## Overview

- Purpose: define and enforce the repo’s static analysis gate (ESLint, TypeScript type-checking, formatting, and future schema/codegen validation) before any runtime tests execute.
- Owner: Backend platform (currently @dimaspramudya as solo maintainer).
- Entry point: run `npm run lint` and `npm run typecheck` locally; CI will execute the same commands plus formatting checks once implemented.

## Scope

- **In scope:** linting (ESLint), type-checking (`tsc --noEmit`), formatting (Prettier), generated spec verification (OpenAPI/Zod consistency), developer experience automation (lint-staged/Husky) tied to static checks.
- **Out of scope:** Jest unit/integration suites, Newman contract tests, runtime smoke/e2e flows. Those live in their respective documentation folders.

## Commands & Tooling

- `npm run lint` — runs ESLint across the repo using `eslint.config.mjs`. _Current status:_ passes in ~7.5 s after removing a stray compiled JS test file.
- `npm run lint:fix` — auto-fixes supported rules; still fails on remaining errors.
- `npm run typecheck` — invokes `tsc --noEmit` with `tsconfig.json`.
- _Current status:_ `npm run typecheck` now passes (~9.1 s) after the `.js` specifier rollout.
- `npm run format:check` — runs Prettier in check mode across `ts|tsx|js|json|md|yml|yaml`, honoring `.prettierignore`. _Current status:_ passes after `npm run format:write` cleaned up pending files.
- `npm run format:write` — formats the same set of files in-place; recommended before committing.
- Husky + lint-staged pre-commit hook — automatically runs ESLint (`--fix --max-warnings=0`) and Prettier on staged files via `npm run lint-staged`.
- `npm run docs:openapi:check` — regenerates the OpenAPI spec (`documents/openapi/lakira-backend-openapi.json`) and fails if uncommitted diffs are detected; CI runs this to catch schema drift.
- Planned: OpenAPI schema validation script and additional static analyzers as captured in the plan.
- Environment & prerequisites:
  - Node 18 LTS (repo aligns to `@tsconfig/node18`); verify via `node -v` before running scripts.
  - npm 11.x (current tooling tested on npm 11.6+); reinstall deps via `npm install` after upgrades.
  - No DB/Redis dependencies; static checks run entirely in-memory and require no `.env` overrides.
  - Source imports have been migrated to explicit `.js` specifiers per ADR-003 so NodeNext module resolution matches runtime.

## Verification

- Run `npm run lint && npm run typecheck` locally before pushing.
- CI backend workflow (see `documents/ci-cd/backend/`) must run static checks ahead of unit/integration jobs and fail fast on violations.
- Formatting/scripts produce zero diffs when repo is compliant; Prettier check should be part of CI once added.
- `npm run docs:openapi:check` should be green locally (no git diff) before a PR.

## KPIs & Maintenance

- **Lint runtime:** ≤ 3 minutes locally, ≤ 2 minutes in CI (see `metrics-tracker.md`).
- **Typecheck runtime:** ≤ 4 minutes locally, ≤ 3 minutes in CI.
- **Format violations:** 0; `format:check` must pass locally/CI.
- **OpenAPI drift:** 0; `docs:openapi:check` must leave the spec unchanged unless intentionally updated.
- **Cadence:** Review metrics + thresholds on the first business day of each quarter and log any adjustments/decisions in `decisions.md`.

## References

- [Static Checks Plan](./static-checks-plan.md)
- [Static Checks Checklist](./static-checks-checklist.md)
- [Static Checks Ticket](./static-checks-ticket.md)
- [Decision Log](./decisions.md)
- [Incidents](./incidents.md)
- [Metrics Tracker](./metrics-tracker.md)
