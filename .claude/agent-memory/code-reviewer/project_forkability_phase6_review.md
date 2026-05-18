---
name: project-forkability-phase6-review
description: Phase 6 forkability scaffolding review — commit 69224ba. APPROVE with 1 Should-fix (dead APP_NAME in zodEnv uncommitted delta) and 2 Warnings (sed injection, duplicate cache adapters).
metadata:
  type: project
---

Phase 6 forkability scaffolding reviewed on branch feat/forkability (commit 69224ba + uncommitted delta).

**Verdict**: APPROVE (typecheck + lint clean, 0 blockers)

**Key findings:**

- Uncommitted `zodEnv.ts` delta re-adds `APP_NAME: z.string().optional()` — dead code; commit message for 69224ba explicitly says it was removed by design. Should-fix before merging.
- `bootstrap-fork.sh` lines 93/108/127: `$NEW_NAME` / `$SHORT_NAME` unquoted/unescaped in sed patterns — names containing `/` break the first delimiter, names containing `|` break the APP_NAME sed. No input validation guard exists. Should-fix.
- Two near-identical Redis cache adapters exist: `MetricCategoryCacheRedis.ts` (wired in feature.ts) and `RedisCacheAdapter.ts` (dead, commented out in controller.ts). RedisCacheAdapter is dead code. Should clean up.
- `RedisCacheAdapter.set()` makes `ttlSec` required (no default), unlike `MetricCategoryCacheRedis` which defaults to 300s. If RedisCacheAdapter is ever wired, this is a latent type mismatch against `CachePort<T>` which marks ttlSec optional.
- `toTitleCase` and `APP_SHORT_NAME` stripping have zero unit tests — pure functions that are trivial to test.
- `app-name.ts` init-order bypass is correct and well-documented. `env.APP_NAME` (zodEnv path) is unreferenced anywhere in src/ — confirms the bypass is the only consumer.
- CachePort consolidation (shared generic + feature-specific extension) is architecturally correct.
- Cookie set/clear attributes are symmetric (same path, secure, sameSite, httpOnly). No issue.

**Why:** Tracking for future conversation continuity.
**How to apply:** If APP_NAME in zodEnv.ts comes up again, it is definitively dead code and should be removed.
