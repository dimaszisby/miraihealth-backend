# Observability Foundations — Checklist

## Phase 0 — Sensitive-keys module + Winston redaction (P1-4.3)

- [ ] Create `src/config/sensitive-keys.ts` exporting `SENSITIVE_KEY_PATTERN`.
- [ ] Update `src/config/envManager.ts` to import the regex from the new module (delete the local copy).
- [ ] Add `redactSensitive` Winston format function in `src/utils/logger.ts` (recursive walk, depth cap 5, replaces matching values with `"***REDACTED***"`).
- [ ] Insert `redactSensitive` in the format chain before `format.json()`.
- [ ] Unit test in `__tests__/unit/utils/logger-redact.test.ts` covering: matching keys masked, non-matching keys preserved, nested objects, arrays, primitives.

## Phase 1 — Request-ID middleware (P0-5.1)

- [ ] Create `src/shared/middleware/request-id.ts` with `requestIdStorage` (AsyncLocalStorage) + `requestIdMiddleware`.
- [ ] Wire `requestIdMiddleware` in `src/server.ts` after `express.json` and before `globalRateLimiter`.
- [ ] Add `attachRequestId` Winston format that reads from `requestIdStorage.getStore()`; insert before `redactSensitive`.
- [ ] Unit test that two parallel requests carry distinct IDs in their logs.
- [ ] Integration test in `__tests__/integration/middleware/request-id.test.ts`: assert the response `x-request-id` header echoes the inbound header when present, and is a valid UUID when absent.

## Phase 2 — Sentry hook (P1-5.2)

- [ ] `npm install @sentry/node` (record exact version in `decisions.md` ADR-002).
- [ ] Add `SENTRY_DSN` (optional) and `SENTRY_TRACES_SAMPLE_RATE` (optional, default 0) to `src/config/zodEnv.ts`.
- [ ] Initialize Sentry at the top of `src/server.ts` only when `env.SENTRY_DSN` is truthy.
- [ ] In `errorHandler`, call `Sentry.captureException(err, { tags: { requestId } })` for 5xx responses (skip 4xx, ZodError, AppError<500).
- [ ] Test: `Sentry.init` is NOT called when `SENTRY_DSN` is unset (jest spy + `withTestEnv`).

## Phase 3 — Readiness probe (P1-5.3)

- [ ] Add `GET /api/v1/ready` route in `src/server.ts` (registered before the global rate limiter).
- [ ] Implement readiness check: `Promise.allSettled([sequelize.authenticate(), redisClient.ping()])` with a 2 s budget via `Promise.race` against `setTimeout`.
- [ ] Return 200 + `{ status: "ok", checks: { db, redis } }` when both ok; 503 + same shape with failure detail when either fails.
- [ ] Confirm `/api/v1/health` is unchanged (still liveness — no DB ping).
- [ ] Integration test in `__tests__/integration/health/ready.test.ts`: ok-path returns 200 with both `ok`; mocked failure path returns 503 with `db: "fail"`.
- [ ] `npm run docs:openapi:generate` and verify both endpoints appear in the spec.

## Wrap-up

- [ ] `npm run typecheck && npm run lint && npm run format:write`.
- [ ] `npm test` green.
- [ ] Update Render deployment health-check URL to `/api/v1/ready` (paired with Phase 7 production-readiness deploy job).
- [ ] Audit re-run shows P0-5.1, P1-5.2, P1-5.3, P1-4.3 marked ✅.
- [ ] Update `iteration-plan.md` Phase 2 status to ✅ Done with PR link.
