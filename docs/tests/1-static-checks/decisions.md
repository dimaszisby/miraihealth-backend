# Static Checks Decision Log

## ADR-001 — Define Initial Static Tooling Stack (Proposed 2025-02-14)

- **Context:** Following the test-structure overhaul, the repo lacked documentation and enforcement for static checks even though ESLint/TypeScript scripts existed.
- **Decision:** Treat ESLint (`npm run lint`), TypeScript (`npm run typecheck`), and Prettier (new `format:check`/`format:write`) as the core toolkit for static validation. Additional analyzers (OpenAPI validation, dependency audits) will be tracked as follow-up ADRs after the core scripts stabilize.
- **Consequences:** Documentation and CI work will prioritize these three tools; future additions need explicit ADRs to avoid scope creep.
- **References:** `docs/tests/1-static-checks/static-checks-plan.md`, `docs/tests/1-static-checks/static-checks-ticket.md`.

## ADR-002 — Align TS Path Aliases to Repo Root (Accepted 2025-02-14)

- **Context:** `npm run typecheck` could not resolve any `@/` imports because `tsconfig.json` used `baseUrl: "src"` with `paths` redirecting to `./*`. Under NodeNext this translated to candidate paths like `src/config/envManager` that lack `.js` extensions and therefore failed resolution.
- **Decision:** Move `baseUrl` to the repository root and expand `paths` mappings to `@/* -> src/*`, `@utils/* -> src/utils/*`, and `@config/* -> src/config/*`. This keeps alias resolution consistent for files inside `src` and external suites once we tackle the NodeNext extension requirement.
- **Consequences:** TypeScript lookups now originate from repo root, matching Jest + bundler behavior. Follow-up work must still address NodeNext’s insistence on `.js` specifiers, but path aliases are no longer blocked by the previous relative mapping.
- **References:** `tsconfig.json` (2025-02-14 change), checklist Phase 0 notes.

## ADR-003 — NodeNext Specifier Strategy (Accepted 2025-02-14)

- **Context:** Even after fixing path aliases, `tsc --noEmit` continued to fail with TS2835 because the codebase imports relatives/aliases without `.js` extensions while `module`/`moduleResolution` remain `NodeNext`. This also implies the emitted `dist/**` modules will break on vanilla Node without the `--es-module-specifier-resolution=node` flag.
- **Decision:** Adopt option 1—update all source imports (relative and aliased) to include `.js` suffixes so TypeScript type-checking matches the emitted ESM output. Jest’s `moduleNameMapper` and ts-jest config will be updated to strip `.js` during tests where needed.
- **Consequences:** Once `.js` suffixes are applied across `src/**`, we won’t need post-build rewrites or nonstandard runtime flags. The change may touch many files, so it should happen in a dedicated PR with lint + typecheck + runtime verification.
- **References:** Typecheck logs (2025-02-14), `docs/tests/1-static-checks/static-checks-plan.md`.

## ADR-004 — Formatting Enforcement Strategy (Accepted 2025-02-14)

- **Context:** Phase 1 requires Prettier-backed formatting plus clarity on whether enforcement happens via CI, pre-commit hooks, or both. Prior to this ADR the repo had no formatting scripts.
- **Decision:** Add `npm run format:check` and `npm run format:write` powered by Prettier, scoped via `.prettierignore`. Static checks and CI will rely on `format:check` (starting Phase 2) while contributors trigger `format:write` manually; pre-commit automation (Husky/lint-staged) remains optional until automation tasks land.
- **Consequences:** Formatting is now part of the static toolkit without forcing hook installs on a solo developer. The GitHub Actions `checks` job executes `format:check` between lint and typecheck so CI fails fast on formatting regressions. Locally, Husky’s `pre-commit` hook invokes lint-staged so ESLint (`--fix --max-warnings=0`) and Prettier run only on staged files before every commit. Future automation will hook into the same scripts, keeping the workflow consistent across local + CI environments.
- **References:** `package.json` scripts, `.prettierignore`, `docs/tests/1-static-checks/static-checks-plan.md`.

## ADR-005 — OpenAPI Spec Consistency Check (Accepted 2025-02-14)

- **Context:** The OpenAPI document under `docs/openapi/lakira-backend-openapi.json` is generated from Zod schemas, but nothing prevented the spec from drifting out of sync with source changes.
- **Decision:** Introduce `npm run docs:openapi:check`, which regenerates the spec via `scripts/generate-openapi.ts` and fails (`git diff --exit-code`) if the tracked JSON changes. Add the same step to the CI `checks` job so pull requests cannot merge with stale specs.
- **Consequences:** Developers get an immediate failure when schemas change but the spec file hasn’t been committed, and CI guarantees published docs match the code. The command leaves diffs in working tree when updates are needed, making it obvious what to commit.
- **References:** `package.json` scripts, `.github/workflows/backend-ci.yml`, `docs/tests/1-static-checks/static-checks-plan.md`.

## Cadence Notes

- **2025-04-01 (planned):** First quarterly static-check review (lint/typecheck/format/openapi KPIs). Outcomes will be logged in this section; cadence repeats on the first business day of each quarter.
