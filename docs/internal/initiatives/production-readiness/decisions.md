# Production Readiness — Decisions Log

---

## ADR-001 — Account lockout: Redis sliding window vs express-brute

Promoted to the architecture decision registry as **[ADR-0032](../../../explanation/decisions/adr-0032-account-lockout-redis-sliding-window.md)**. That file is authoritative; this entry is a pointer.

## ADR-002 — e2e Jest project: add vs remove the broken script (Accepted 2026-05-18)

**Context:** `package.json` declares `npm run test:e2e` but `jest.config.mjs` has no `e2e` project and no `__tests__/e2e/` directory exists. The script fails today.

**Decision (proposed):**

1. **Add the project** rather than removing the script. The e2e layer is valuable for full-stack smoke tests (register → login → protected endpoint → logout).
2. Third Jest project config: `displayName: "e2e"`, `testMatch: ["__tests__/e2e/**/*.test.ts"]`, `testTimeout: 30_000`.
3. Start with a single placeholder `auth-flow.e2e.test.ts` that boots the full Express app via `supertest`.
4. e2e tests run in CI but do NOT block the `test` script (`npm test` stays unit + integration only). `npm run test:e2e` is opt-in.

**Status:** Accepted (2026-05-18).

**Implementation:** Third Jest project added in `jest.config.mjs` with `setupFilesAfterEnv: ["<rootDir>/jest.setup.e2e.ts"]` (no per-test truncation — e2e owns its data). First spec lives at `__tests__/e2e/auth-flow.e2e.test.ts` covering register → login → protected endpoint → logout.

**Options considered:**

- _Remove the script._ Rejected: the audit explicitly recommends adding the project, and e2e coverage is a genuine gap.
- _Use a separate framework (Playwright, Cypress)._ Rejected: this is a REST API, not a browser app. `supertest` + Jest is the right tool.

**Consequences:**

- CI needs PostgreSQL + Redis for e2e (already available from integration tests).
- Future e2e tests follow the same file structure (`__tests__/e2e/<flow>.e2e.test.ts`).

**Links:**

- `docs/internal/audits/saas-readiness/audit-2026-05-01.md` § 7.1
- `production-readiness-plan.md` § Phase D
