---
name: project-multi-tenancy-phase5-review
description: Multi-Tenancy Phase 5 review — repository org-scoping. Key findings: cache key collision across orgs (all 4 cursor caches missing organizationId), originalMetricExists intentionally unscoped, no cross-org integration tests.
metadata:
  type: project
---

Phase 5 verdict: REQUEST CHANGES. 1 CRITICAL, 2 WARNINGs.

**Why:** Phase 5 adds organizationId to every repository method. The DB-layer scoping is complete and correct. However all four Redis cursor cache key builders (metric, metric-log, metric-settings, metric-category) omit organizationId from the key, causing cross-org cache collisions for users belonging to multiple orgs.

**CRITICAl:** All `buildCursorCacheKey` calls in router files + `ListCategories.ts` application query omit `organizationId` in segments. A user in org A switching to org B will receive org A's cached list response. Files:

- `src/features/public/metric/infrastructure/http/router.ts`
- `src/features/public/metric-log/infrastructure/http/router.ts`
- `src/features/public/metric-settings/infrastructure/http/router.ts`
- `src/features/public/metric-category/infrastructure/http/router.ts`
- `src/features/public/metric-category/application/queries/ListCategories.ts`

**WARNING:** `originalMetricExists` intentionally lacks organizationId (cross-org public metric reference), but this is undocumented.

**WARNING:** No cross-org isolation integration test (no "user in org A cannot see org B data" test).

**How to apply:** When reviewing future cache-related changes, always verify that organizationId is in every cache key that scopes to a list/read. Recommend bumping cursor cache versions when adding organizationId to keys (to bust stale cross-org entries).
