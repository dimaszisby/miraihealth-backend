# ADR-0023 — Cross-feature metric-access provider: single owner vs shared

- **Status:** Proposed
- **Date:** 2026-05-03
- **Origin:** `ADR-002` in the Feature vertical-slice migration kit — [`feature-vertical-slice-migration`](../../internal/initiatives/feature-vertical-slice-migration/decisions.md)

---

## Context

Both `metric-log` and `metric-settings` slices need to check metric existence. Each has its own `MetricAccessSequelize` adapter — duplicate code implementing the same port contract. The drift-cleanup plan (Phase C) requires deleting one.

## Decision

1. The `MetricAccessPort` interface stays in each consuming feature's `application/ports/` (features own their port contracts).
2. A single `MetricAccessSequelize` adapter lives in `src/features/public/metric/infrastructure/providers/` (the feature that owns the `Metric` model).
3. Consumer features (`metric-log`, `metric-settings`) receive the adapter via their `buildXFeature()` dependency injection, imported from `metric`.

## Options considered

- _Move adapter to `shared/`._ Rejected: it queries the `Metric` model, which is owned by the `metric` feature. Placing the adapter in `shared/` would create an upward dependency.
- _Keep duplicates._ Rejected: exact cause of the audit finding.

## Consequences

- `buildMetricLogFeature()` and `buildMetricSettingsFeature()` gain an explicit dependency on the metric feature's adapter export.
- The composition root (`server.ts` or feature wiring) must pass the adapter through.

## Links

- `docs/internal/audits/saas-readiness/audit-2026-05-01.md` § 10.1 (drift #4)
- `plans/phase-drift-cleanup-plan.md` § Phase C
