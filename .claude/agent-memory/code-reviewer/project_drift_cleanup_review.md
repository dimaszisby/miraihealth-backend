---
name: project-drift-cleanup-review
description: Phase 5 DDD Layout Drift Cleanup review — branch refactor/drift-cleanup. Verdict: APPROVE with notes. Key patterns to watch in future.
metadata:
  type: project
---

Phase 5 drift cleanup reviewed on 2026-05-17 on branch `refactor/drift-cleanup`. Verdict: APPROVE.

All 8 sub-phases implemented. typecheck + lint + 468 unit tests green.

**Key findings:**

- `metric/infrastructure/providers/MetricAccessSequelize.ts` co-locates both the `MetricAccessPort` interface AND the `MetricAccessSequelize` class. The interface belongs in `application/ports/`. No runtime impact (structural typing), but it's an ongoing DDD layout issue. Three other features each define their own identical local `MetricAccessPort` in `application/ports/` — the canonical interface should be extracted to `metric/application/ports/MetricAccessPort.ts` and re-exported from providers only.
- `GetMetricTrend` (refactored to class) and `MetricLogStatsRepoSequelize` (new) have zero dedicated unit tests. Pre-existing logic coverage (via integration tests) exists but no new unit tests were added for the refactored use-case shape.
- `GenerateDummyMetrics` (application use-case) imports from `infrastructure/persistence/mappers/MetricReadMapper.js` — DDD violation. Pre-existing in origin (was importing from `utils/mappers/`), the diff only redirected the import to the new file location, not fixed the architectural concern.
- `getMetricTrend` lives in the analytics `feature.ts` return object but is not wired to any HTTP route — dead export. Pre-existing, not introduced by this diff.
- Architecture test regex `/export\s+const\s+build\w+Feature\s*=\s*\(([^)]*)\)/` correctly matches multi-line signatures because `[^)]` matches newlines.
- `__dirname` in architecture test works because ts-jest (CommonJS transformation via preset) injects it even in ESM mode.
- `metric/infrastructure/http/dto.ts` cross-imports from `metric-settings/infrastructure/persistence/mappers/` and `metric-log/infrastructure/http/dto.ts` — pre-existing cross-feature internal imports, not addressed by this phase.

**Why:** These were scoped limitations of Phase 5. The DDD cross-feature mapper issue was pre-existing in `utils/mappers/` and the cleanup correctly moved it without worsening it.

**How to apply:** In future phases, flag: (1) `MetricAccessPort` interface deduplication, (2) test coverage for new repo implementations, (3) `GenerateDummyMetrics` application→infrastructure import.
