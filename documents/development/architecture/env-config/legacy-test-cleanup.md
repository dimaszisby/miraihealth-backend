# Legacy Test Cleanup (TKT-005A)

## Scope

Modernize the remaining Jest suites under `__tests__/` so they comply with the new environment guardrails and baseline lint/prettier rules introduced during the env-config overhaul.

## Current Pain Points

1. **Formatting drift**: dozens of suites have never been run through Prettier; lint now reports missing commas, indentation, or chained-call wrapping (see `__tests__/metrics/**/*.test.ts`, `__tests__/features/auth/**/*.test.ts`).
2. **Process env usage**: some suites still mutate `process.env` directly or rely on implicit state (not yet enumerated—requires audit via `rg "process\.env" __tests__`).
3. **Shared helpers**: `__tests__/integration/helpers/test-utils.ts` duplicates env override logic that should migrate to `withTestEnv`.

## Plan of Record

1. **Enable guardrails (done)**

   - Jest globals registered via ESLint override.
   - `no-restricted-properties` blocks direct `process.env` access inside `__tests__`.

2. **Track outstanding suites**

   - Run `npm run lint -- __tests__` and capture offenders (current highlights: analytics dashboards, auth controllers, metric domain/repo tests, helper utilities).
   - Break the list into sub-tickets by feature area (Analytics, Auth, Metrics, Helpers).

3. **Refactor per feature**

   - Apply Prettier fixes to each folder (safe to use `npx prettier --write __tests__/features/auth` after staging).
   - Replace direct env mutations with `withTestEnv` or `getEnv`.
   - Remove duplicated env mocking helpers (fold into `withTestEnv`).

4. **Acceptance Criteria**
   - `npm run lint __tests__` passes without disabling the guardrail.
   - No direct `process.env` usage remains in committed test files.
   - Documentation updated if new helpers/patterns emerge.

## Next Actions

- [ ] Create sub-tickets (e.g., TKT-005A-analytics, -auth, -metrics) referencing this doc.
- [ ] Apply Prettier to high-churn suites first to reduce noise.
- [ ] Audit `__tests__/integration/helpers/test-utils.ts` and migrate to `withTestEnv`.
