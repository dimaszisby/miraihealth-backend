# Observability Kit — Decisions Log

ADR-style entries scoped to the observability kit. Cross-kit decisions live in `docs/development/architecture/saas-readiness/decisions.md`.

---

## ADR-001 — AsyncLocalStorage for request correlation, not cls-rtracer (Implemented 2026-05-06)

**Context:** Audit gap [P0-5.1] requires per-request log correlation. Two common options: a third-party library like `cls-rtracer` that wraps `cls-hooked`, or Node's native `AsyncLocalStorage` (stable since Node 16). The repo runs on Node 20.

**Decision (proposed):** Use the built-in `AsyncLocalStorage` from `node:async_hooks`. Export a singleton store from `src/shared/middleware/request-id.ts` and have the request-ID middleware run the rest of the chain inside `store.run(reqId, () => next())`.

**Options considered:**

- _`cls-rtracer`._ Adds a runtime dependency and a maintenance burden for a feature Node now exposes natively. Rejected.
- _Echo `req.id` into a logger child instance per-request._ Rejected: requires every log call site to use the child logger. Misses any indirect logger usage (e.g., from a use case called by a controller).
- _Just set a header and a `req.id` property without an async store._ Rejected: code paths several `await`s deep cannot read `req.id` without threading it through every function signature.

**Consequences:**

- Zero new runtime deps.
- Anywhere in the call tree that needs the current request ID (logger format, Sentry tags, future tracer): `requestIdStorage.getStore()`.
- The worker process (`src/worker.ts`) gets the same primitive but with a per-message store rather than per-request. Track that as a follow-up; do not block this kit.

**Links:**

- `audit-2026-05-01.md` § [P0-5.1]
- `src/shared/middleware/request-id.ts` (to be created)

---

## ADR-002 — Sentry init lifecycle: top of server.ts, env-gated (Proposed 2026-05-02)

**Context:** Audit gap [P1-5.2] asks for Sentry as a hook point. The choice is where to call `Sentry.init` and how to gate it so dev runs are unaffected.

**Decision (proposed):**

1. Install `@sentry/node` (record the pinned version here once installed; placeholder: `^8.x`).
2. Init at the top of `src/server.ts` immediately after `loadEnvOrExit()`. Pre-init means later `import` side effects can already be captured.
3. Strict gate: `if (env.SENTRY_DSN) { Sentry.init({...}) }`. An unset or empty DSN is a true no-op — no global handlers installed, no network calls.
4. `tracesSampleRate` defaults to `0` (no APM tracing); flip to a small fraction in production via env if/when traces become useful.
5. Capture only in `errorHandler` for 5xx responses. 4xx, `ZodError`, and `AppError` with status < 500 are user-driven and would drown signal.
6. Tag every captured event with `{ requestId, environment, route }`.

**Status:** Implemented. Installed `@sentry/node@10.51.0`. Sentry v10 drops the Express request-handler middleware in favour of calling `captureException` directly in `errorHandler`, which aligns with the ADR's "capture only 5xx" requirement.

**Options considered:**

- _Init only in production._ Rejected: staging is the most useful environment for catching regressions; gate by DSN, not `NODE_ENV`.
- _Capture all errors including 4xx._ Rejected: validation errors are not actionable; they would dominate the error feed.
- _Use Sentry for tracing too._ Deferred: APM/tracing is its own (P2-5.4) decision and likely Prometheus + OpenTelemetry, not Sentry traces.

**Consequences:**

- One new prod dep.
- One new env var (`SENTRY_DSN`) added to `.env.example` once that file lands in Phase 0.
- `errorHandler` becomes Sentry-aware but stays the only error sink.

**Links:**

- `audit-2026-05-01.md` § [P1-5.2]
- `src/server.ts`, `src/shared/middleware/error.ts`

---

## ADR-003 — Move SENSITIVE_KEY_PATTERN out of envManager.ts (Implemented 2026-05-06)

**Context:** The regex `/(password|secret|token|key|certificate|url)$/i` lives in `src/config/envManager.ts:6` today and is referenced by `maskedEnvSnapshot()` only. The Winston redactor needs the same regex, and `envManager.ts` is not the right home for a cross-cutting utility.

**Decision (proposed):** Move the regex into `src/config/sensitive-keys.ts` exporting `SENSITIVE_KEY_PATTERN` and a `maskValue(key, value): unknown` helper. Update `envManager.ts` to import from there. Add unit tests.

**Status:** Proposed. Trivial mechanical change; ship as Phase 0 of this kit.

**Options considered:**

- _Inline the regex in two places._ Rejected: drift risk; the audit specifically called out the redaction policy as a single source of truth.
- _Put it in `src/utils/`._ Rejected: `src/config/` is the existing home for environment + masking concerns; redaction key list is a config concern.

**Consequences:**

- One small module, one import-path change in `envManager.ts`.
- The Winston format and any future logger transport reuse the same definition.

**Links:**

- `audit-2026-05-01.md` § [P1-4.3]
- `src/config/envManager.ts:6`
- `src/utils/logger.ts`

---

## ADR-004 — Centralize analytics env reads through `envManager` (Accepted 2026-05-21)

**Context:** The 2026-05-20 re-audit (`docs/development/architecture/saas-readiness/audit-2026-05-20.md` § [P1-4.2]) flagged six analytics files still reading `process.env.VIZ_*` and `process.env.DEFAULT_TZ` directly with inline `Number(...) ?? <default>` fallbacks. This bypassed the Zod-validated singleton (`src/config/envManager.ts`) — defaults were duplicated at every call site, types were `string | undefined` instead of parsed numbers, and the values escaped the masked snapshot / validation flow used everywhere else. It was the single P1 keeping Category 4 (Security) below the 80% bar required by ADR-001's fork-ready exit criteria.

**Decision:** Add seven entries to `src/config/zodEnv.ts` under a new "Analytics / Visualization" section — `VIZ_MAX_BUCKETS` (400), `VIZ_DASH_MAX_METRICS` (24), `VIZ_DEFAULT_TTL_SEC` (120), `VIZ_CACHE_MAX_AGE_SEC` (60), `VIZ_CACHE_STALE_SEC` (30), `VIZ_FALLBACK_GUARD_BUCKETS` (96), and `DEFAULT_TZ` ("Asia/Jakarta"). Numerics use `z.coerce.number().int().positive().default(...)`; `DEFAULT_TZ` uses `z.string().default(...)`. Route all six analytics call sites through `envManager`: `GetDashboardVisualization.ts` calls `loadEnvOrExit()` inside `execute()` (required so the existing `withTestEnv` unit test can override `VIZ_DASH_MAX_METRICS` at runtime — the module-level `env` singleton in `envManager.ts:114` snapshots at first import and ignores `resetEnvCacheForTesting()`); the remaining five files import the `env` singleton at module top. Defaults preserve the previous inline fallbacks exactly, so runtime behaviour is unchanged.

**Options considered:**

- _Leave the inline `process.env` reads in place._ Rejected: violates `.claude/rules/environment.md` ("All environment access goes through `loadEnvOrExit()`"); duplicates defaults across files; the gap was already audited.
- _Introduce a dedicated `AnalyticsConfig` object built once at module load._ Rejected as premature: a flat `env.X` lookup is what every other feature in the repo does (rate limits, TTLs, etc.). An extra indirection would add no validation and one more import.
- _Make the vars required (no defaults)._ Rejected: the inline `?? <n>` fallbacks were the de-facto contract; promoting them to required would break every existing `.env` file without warning. Defaults match the prior values exactly.

**Consequences:**

- All seven knobs are validated at boot — bad inputs fail fast with a Zod error instead of producing `NaN` deep inside cache TTL math.
- `.env.example` documents the new section (commented-out defaults, matching the existing format).
- `grep -rn 'process\.env\.' src/features/public/analytics/` is now zero — the file boundary becomes part of the contract.
- Cat 4 in the audit moves from 62.5% to 75%; closes 1 of the remaining 4 P1 gaps.

**Follow-ups (open, non-blocking):**

- Align the five `env`-singleton call sites with `.claude/rules/environment.md` — "Use in code via `const env = loadEnvOrExit(); env.YOUR_VAR`". Files: `GetVisualization.ts`, `VisualizationCacheRedis.ts`, `schema.zod.ts` (the module-top `MAX_BUCKETS` / `DEFAULT_TZ` consts feed Zod schema definitions evaluated at import time — likely needs `.default(() => loadEnvOrExit().DEFAULT_TZ)` and moving the `MAX_BUCKETS` read inside `validateRelativeWindow`), `controller.ts`, `VisualizationReadRepoSequelize.ts`. P1-4.2 audit criterion is already satisfied (zero direct `process.env.*` reads in analytics); this is a project-rule compliance item, not an audit gap. Severity: P3 quality. Risk if deferred: future unit tests on these files that use `withTestEnv` will silently fail to override (the singleton snapshots at first import).

**Links:**

- `docs/development/architecture/saas-readiness/audit-2026-05-20.md` § [P1-4.2]
- `.claude/rules/environment.md` (project pattern reference for the follow-up)
- `src/config/zodEnv.ts` (Analytics / Visualization section)
- `src/features/public/analytics/**` (six call sites)
