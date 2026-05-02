# Forkability — Checklist

- Timestamp: 2026-05-03T00:00:00Z
- Plan: `./forkability-plan.md`
- Closes: [P1] 11.2, [P1] 11.3, [P1] 11.4, [P2] 11.5

## Phase A — Centralize APP_NAME

- [ ] Create `src/config/app-name.ts` with env-driven `APP_NAME`.
- [ ] Update `src/server.ts` log strings.
- [ ] Update `src/utils/logger.ts` service name.
- [ ] Update `src/lib/openapi/openapi-config.ts` API title.
- [ ] Update `src/shared/infrastructure/queue/topology.ts` queue prefix.
- [ ] Update `password-reset.ts` email template branding.
- [ ] Verify: zero `lakira` matches in `src/**/*.ts` outside `app-name.ts`.

## Phase B — Bootstrap script

- [ ] Create `scripts/bootstrap-fork.sh` with `--name` flag.
- [ ] Script replaces branding in `package.json`, `package-lock.json`, `docker-compose.test.yml`.
- [ ] Script replaces branding in CI workflow files.
- [ ] Script replaces branding in script files under `scripts/`.
- [ ] Script rotates `JWT_SECRET` in `.env.development`.
- [ ] Script drops `FORKED-FROM.md` with upstream commit SHA.
- [ ] Script is idempotent (safe to run twice).
- [ ] Add "Forking" section to `README.md`.
- [ ] Verify: `npm run typecheck && npm run lint` pass in a temp worktree after running the script.

## Phase C — CONTRIBUTING.md

- [ ] Create `CONTRIBUTING.md` at repo root.
- [ ] Document branch model, commit conventions, code style links, testing links.
- [ ] Note single-developer status and external PR expectations.

## Phase D — Consolidate CachePort

- [ ] Create `src/shared/application/ports/CachePort.ts` with generic interface.
- [ ] Replace or re-export from `metric/application/ports/CachePort.ts`.
- [ ] Replace or re-export from `metric-log/application/ports/CachePort.ts`.
- [ ] Replace or re-export from `metric-category/application/ports/CachePort.ts`.
- [ ] Replace or re-export from `metric-settings/application/ports/CachePort.ts`.
- [ ] Replace or re-export from `analytics/application/ports/VisualizationCachePort.ts`.
- [ ] Update Redis cache adapters to implement the shared generic.
- [ ] Update `buildXFeature()` signatures.
- [ ] `npm run typecheck` green.
- [ ] Cache-related unit tests green.

## Wrap-up

- [ ] `npm run typecheck && npm run lint && npm run format:write && npm test` green.
- [ ] Audit re-run grades 11.2, 11.3, 11.4, 11.5 as ✅.
