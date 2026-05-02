# Production Readiness — Checklist

- Timestamp: 2026-05-03T00:00:00Z
- Plan: `./production-readiness-plan.md`
- Closes: [P1] 8.3, [P1] 8.4, [P1] 4.4, [P1] 7.1

## Phase A — Multi-stage Dockerfile

- [ ] Stage 1 (build): `node:20-alpine`, `npm ci`, `npm run build`.
- [ ] Stage 2 (runtime): copy `dist/`, `npm ci --omit=dev`, `USER node`, `dumb-init`.
- [ ] `CMD ["node", "dist/server.js"]`.
- [ ] Preserve or rename existing Dockerfile for local dev if needed.
- [ ] Docker build succeeds and image runs.

## Phase B — Production deploy job

- [ ] Add `deploy_production` job to `backend-ci.yml`.
- [ ] Trigger on push to `main`, gated by `needs: [test, lint]`.
- [ ] Manual approval via `environment: production`.
- [ ] Steps: `migrate:production` + `RENDER_PRODUCTION_DEPLOY_HOOK_URL`.
- [ ] Document `RENDER_PRODUCTION_DEPLOY_HOOK_URL` secret requirement.
- [ ] Add `migrate:production` npm script if missing.

## Phase C — Account lockout

- [ ] Create lockout helper with Redis-backed per-email counter.
- [ ] Key format: `auth:lockout:<sha256(email)>`, TTL 15 min.
- [ ] Threshold: 5 failures → 429 with `Retry-After`.
- [ ] Reset counter on successful login.
- [ ] Structured log event `auth.lockout.triggered` via Winston.
- [ ] Graceful degradation: allow login if Redis unavailable.
- [ ] Unit test with mock Redis.
- [ ] Integration test: 6 wrong-password attempts → 429 on attempt 6.

## Phase D — e2e Jest project

- [ ] Add `e2e` project to `jest.config.mjs` with 30s timeout.
- [ ] Create `__tests__/e2e/` directory.
- [ ] Write `auth-flow.e2e.test.ts` (register → login → protected endpoint → logout).
- [ ] `npm run test:e2e` passes.

## Wrap-up

- [ ] `npm run typecheck && npm run lint && npm run format:write && npm test` green.
- [ ] `npm run test:e2e` green.
- [ ] Audit re-run grades 8.3, 8.4, 4.4, 7.1 as ✅.
