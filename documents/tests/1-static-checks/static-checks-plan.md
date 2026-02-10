# Static Checks Plan

## Context & Goals

- The repo already exposes `npm run lint` and `npm run typecheck`, but lacks documentation, formatting enforcement, and CI visibility.
- The test structure overhaul now distinguishes static/unit/integration stages; this plan elevates static checks to a first-class gate with clear metrics and automation.
- Goals: document scope, ensure deterministic scripts, wire CI to fail fast, and capture performance/coverage metrics that strengthen the portfolio story.

## Phases & Milestones

1. **Phase 0 – Baseline inventory**
   - Confirm existing scripts, ESLint/TS config versions, and pain points.
   - Measure current runtime for lint + typecheck to seed the metrics tracker.
2. **Phase 1 – Documentation & formatting (completed)**
   - Populate README/ticket/checklist (this folder) and describe workflows. ✅
   - Introduce Prettier scripts (`format:check`, `format:write`) and document file globs. ✅
   - Clarify local expectations (when to run which command, minimal Node/npm versions). ✅
3. **Phase 2 – CI alignment & automation (in progress)**
   - Update backend CI workflow to run lint/typecheck/format before tests; publish logs/artifacts. ✅ (`.github/workflows/backend-ci.yml` now runs lint → format:check → typecheck in the `checks` job.)
   - Add Husky/lint-staged (or a lightweight `pre-commit` script) tailored for a solo maintainer. ✅ (pre-commit hook runs lint-staged → ESLint + Prettier on staged files.)
   - Cache ESLint/tsc outputs in CI to keep runtimes under the target threshold. ✅
4. **Phase 3 – Extended checks & metrics (in progress)**
   - Integrate OpenAPI/Zod schema validation and other static analyzers (e.g., dep check). ✅ (`npm run docs:openapi:check` regenerates the spec and fails if diffs exist; CI runs it in the checks job.)
   - Track and publish metrics (lint duration, # of lint rules, typecheck errors) per release. ✅ (metrics tracker now captures lint/typecheck/format/OpenAPI KPIs; README documents targets.)
   - Revisit thresholds annually and add ADRs when tools/rules change materially. 🔄 (Quarterly cadence documented in README + metrics tracker; next action is to record outcomes in `decisions.md`.)

## Success Criteria

- Mandatory scripts (`lint`, `typecheck`, `format:check`) documented and green locally/CI.
- CI runs static checks in <5 minutes total and fails the pipeline on any error.
- Metrics tracker contains up-to-date runtimes and target deltas.
- Decisions/incidents logs capture at least the initial tooling choice and any future regressions.

## Risks & Mitigations

- **Runtime creep:** ESLint/tsc can slow down as the codebase grows → budget thresholds, enable caching, consider rule pruning or incremental TS builds.
- **Single-developer fatigue:** writing/maintaining docs may feel heavy → leverage the “Right-Sizing” guidance and periodically prune tasks.
- **Tool drift:** differing ESLint/TS versions across dev/CI → lock versions via package-lock, document upgrade steps in decisions.md.

## Open Questions

- Should we introduce additional static analyzers (e.g., dependency audit, security lint) as part of this initiative or track separately?
- Do we need a dedicated `npm run validate` that chains lint/typecheck/format for convenience?
- What is the acceptable failure policy in CI (fail-fast vs. aggregate errors) once coverage expands?

## Current Findings (2025-02-14)

- `npm run lint` now passes in ~7.5 seconds after deleting the stray compiled `__tests__/unit/config/envManager.test.js`; CI caches should keep runtimes low once wired.
- `npm run typecheck` now passes in ~9.14 seconds after the `.js` specifier rollout and updated `tsconfig.json`.
- ESLint already runs in type-aware mode (shared parser/project + Prettier plugin). We’ll need to document Node 18 + npm 11 prerequisites and potentially enable caching to keep runtimes low once static checks gate CI (CI cache now stores ESLint + TS artifacts).
- Prettier scripts (`format:check`, `format:write`) plus `.prettierignore` landed as part of Phase 1; `format:check` now passes after repo-wide formatting and is executed in CI alongside lint/typecheck.
- The static stage now includes `npm run docs:openapi:check`, which regenerates the OpenAPI spec and fails the pipeline if changes aren’t committed, ensuring schema drift is caught early.
