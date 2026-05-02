# Phase: DDD Layout Drift Cleanup — Checklist

- Timestamp: 2026-05-03T00:00:00Z
- Plan: `../plans/phase-drift-cleanup-plan.md`
- Closes: [P1] 10.1, [P1] 10.2, [P2] 10.4, [P2] 10.5

## Gating

- [ ] ADR-003 in `saas-readiness/decisions.md` flipped Proposed → Accepted.
- [ ] Kit-local ADR-001 reviewed.

## Phase A — Metric slice cleanup

- [ ] Create `dto.ts` in `metric/infrastructure/http/`.
- [ ] Consolidate transaction ports (`PersistenceTransaction.ts` / `TransactionPort.ts` → one canonical port).
- [ ] Move `src/utils/mappers/metric.mapper.ts` → `metric/infrastructure/persistence/mappers/`.
- [ ] Update all import paths referencing the old location.
- [ ] Metric unit + integration tests green.

## Phase B — Metric-log slice cleanup

- [ ] Rename `metric-log/infrastructure/access/` → `infrastructure/providers/`.
- [ ] Update all imports referencing `infrastructure/access/`.
- [ ] Metric-log unit + integration tests green.

## Phase C — Metric-settings slice cleanup

- [ ] Move `infrastructure/mappers/` → `infrastructure/persistence/mappers/`.
- [ ] Delete duplicate `MetricAccessSequelize` from `metric-settings/infrastructure/providers/`.
- [ ] Wire cross-feature port for metric access (import from owning feature or shared).
- [ ] Update `buildMetricSettingsFeature()` import paths.
- [ ] Metric-settings unit + integration tests green.

## Phase D — Analytics slice cleanup

- [ ] Rename `validators.ts` → `schema.zod.ts`.
- [ ] Convert `getMetricTrend.ts` → `GetMetricTrend.ts` (PascalCase class with `execute()`).
- [ ] Remove `sequelize` import (`Op`) from the application-layer query.
- [ ] Evaluate raw SQL files in `infrastructure/sql/` — document decision in kit-local decisions.md.
- [ ] Analytics unit + integration tests green.

## Phase E — Sequelize types in application layer

- [ ] Replace `FindOptions`, `Includeable`, `WhereOptions` in `GetMetricLogStats.ts` with a domain-owned port type.
- [ ] Implement translation layer in the repository adapter.
- [ ] Verify: `grep -r "from ['\"]sequelize" src/features/*/application/` returns zero matches.

## Phase F — Manual DI consistency

- [ ] Add overrides parameter to `buildMetricCategoryFeature()`.
- [ ] Add overrides parameter to `buildMetricSettingsFeature()`.
- [ ] Add overrides parameter to `buildAnalyticsFeature()`.
- [ ] Type each overrides bag as a partial record of port interfaces.
- [ ] Verify: all six features accept mock port injection in tests.

## Phase G — Dead code removal

- [ ] Delete empty `src/features/admin/` directory.
- [ ] Remove `admin` from `tsconfig.json` path aliases if present.
- [ ] Move `src/utils/mappers/generic.mapper.ts` to its owning location.
- [ ] Move `src/utils/mappers/metric-log.mapper.ts` → `metric-log/infrastructure/persistence/mappers/`.
- [ ] Delete `src/utils/mappers/` directory.

## Phase H — Architecture enforcement test

- [ ] Create `__tests__/unit/architecture.test.ts`.
- [ ] Assert required subdirectories per feature slice.
- [ ] Assert no `sequelize` imports in application-layer files.
- [ ] Assert all `buildXFeature()` accept overrides.
- [ ] Assert `src/utils/mappers/` does not exist.
- [ ] Test runs in CI via `unit` Jest project.

## Wrap-up

- [ ] `npm run typecheck && npm run lint && npm run format:write && npm test` green.
- [ ] Audit re-run grades 10.1, 10.2, 10.4, 10.5 as ✅.
