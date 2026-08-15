# Feature Vertical Slice Migration — Decisions Log

Cross-kit ADR-003 (the canonical DDD layout standard that governs this migration) lives in `docs/internal/audits/saas-readiness/decisions.md` and gates the drift-cleanup phase documented here.

---

## ADR-001 — Transaction port consolidation for metric slice (Proposed 2026-05-03)

**Context:** `src/features/public/metric/application/ports/` exposes two transaction abstractions: `PersistenceTransaction.ts` and `TransactionPort.ts`. They appear to be a stalled refactor — one is used by create/update use cases, the other may be dead code. Having two confuses forkers about which to use.

**Decision (proposed):**

1. Audit call sites for both ports. The one with more consumers becomes canonical.
2. Migrate the remaining call sites to the canonical port.
3. Delete the unused port file.
4. If the contracts differ materially, merge the richer one into the simpler one's name (prefer the shorter, more descriptive name).

**Status:** Proposed — requires code inspection before finalizing.

**Options considered:**

- _Keep both._ Rejected: ambiguity is the core problem.
- _Create a third, "better" port._ Rejected: premature abstraction; pick one and iterate.

**Consequences:**

- One fewer file in `application/ports/`.
- All transaction-using tests must import the surviving port.

**Links:**

- `docs/internal/audits/saas-readiness/audit-2026-05-01.md` § 10.1
- `plans/phase-drift-cleanup-plan.md` § Phase A

---

## ADR-002 — Cross-feature metric-access provider: single owner vs shared (Proposed 2026-05-03)

**Context:** Both `metric-log` and `metric-settings` slices need to check metric existence. Each has its own `MetricAccessSequelize` adapter — duplicate code implementing the same port contract. The drift-cleanup plan (Phase C) requires deleting one.

**Decision (proposed):**

1. The `MetricAccessPort` interface stays in each consuming feature's `application/ports/` (features own their port contracts).
2. A single `MetricAccessSequelize` adapter lives in `src/features/public/metric/infrastructure/providers/` (the feature that owns the `Metric` model).
3. Consumer features (`metric-log`, `metric-settings`) receive the adapter via their `buildXFeature()` dependency injection, imported from `metric`.

**Status:** Proposed.

**Options considered:**

- _Move adapter to `shared/`._ Rejected: it queries the `Metric` model, which is owned by the `metric` feature. Placing the adapter in `shared/` would create an upward dependency.
- _Keep duplicates._ Rejected: exact cause of the audit finding.

**Consequences:**

- `buildMetricLogFeature()` and `buildMetricSettingsFeature()` gain an explicit dependency on the metric feature's adapter export.
- The composition root (`server.ts` or feature wiring) must pass the adapter through.

**Links:**

- `docs/internal/audits/saas-readiness/audit-2026-05-01.md` § 10.1 (drift #4)
- `plans/phase-drift-cleanup-plan.md` § Phase C
