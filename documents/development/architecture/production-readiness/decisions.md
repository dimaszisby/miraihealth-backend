# Production Readiness — Decisions Log

---

## ADR-001 — Account lockout: Redis sliding window vs express-brute (Accepted 2026-05-18)

**Context:** The audit flagged no per-account brute-force protection ([P1-4.4]). The existing rate limiters (global, user, analytics) are IP-based or user-ID-based via `express-rate-limit` + Redis. A per-email lockout is a different concern — it targets credential-stuffing attacks that stay under the per-IP limit by distributing across IPs.

**Decision (proposed):**

1. Use a lightweight Redis sliding-window counter (INCR + EXPIRE) rather than adding `express-brute` as a dependency.
2. Key: `auth:lockout:<sha256(email)>` — hash the email to avoid storing PII in Redis.
3. Threshold: 5 failures in 15 minutes → 429.
4. Reset on success (DEL key).
5. Graceful degradation: if Redis is unreachable, log a warning and allow the login attempt (don't block auth because the lockout store is down).

**Status:** Accepted (2026-05-18).

**Implementation:** `src/features/shared/auth/infrastructure/http/loginLockout.ts` — `checkLockout` / `recordFailedAttempt` / `resetLockout`, wired into the login controller. Unit coverage in `__tests__/unit/features/auth/infrastructure/http/loginLockout.test.ts`; integration coverage (gated by `ENABLE_REDIS_INTEGRATION`) in `__tests__/integration/api/auth-lockout.test.ts`.

**Options considered:**

- _`express-brute` package._ Rejected: last published 2019; adds a dependency for something achievable with 20 lines of Redis calls. The existing `ioredis` client already covers the need.
- _In-memory counter._ Rejected: doesn't survive process restarts; doesn't work across horizontally scaled instances.

**Consequences:**

- New Redis key namespace `auth:lockout:*`.
- Monitoring: the `auth.lockout.triggered` log event can feed alerting.
- If Redis is down, lockout silently disables — acceptable tradeoff since the IP-based rate limiter is still active.

**Links:**

- `documents/development/architecture/saas-readiness/audit-2026-05-01.md` § 4.4
- `production-readiness-plan.md` § Phase C

---

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

- `documents/development/architecture/saas-readiness/audit-2026-05-01.md` § 7.1
- `production-readiness-plan.md` § Phase D
