# SaaS Readiness — Decisions Log

ADR-style entries for standards adopted in response to the SaaS-base readiness audit. New decisions append at the bottom; do not rewrite history. Each entry references the originating audit run and concrete file paths.

---

## ADR-001 — Adopt formal SaaS-base readiness criteria (Accepted 2026-05-01)

**Context:** The Lakira backend is intended to be reusable as a forkable SaaS base. Until now, "ready to fork" has been a feeling, not a measurable threshold. The first audit (`audit-2026-05-01.md`) needed a binary gate to grade against.

**Decision:** A repo is "fork-ready" only when **all four** of:

1. Zero P0 gaps remaining in the latest audit.
2. All six empirical commands green: `typecheck`, `lint`, `format:check`, `test`, `security:delta:check`, `docs:openapi:generate`.
3. Categories 1 (Auth), 4 (Security), 6 (DX), 7 (Testing), 8 (CI/CD), 11 (Forkability) at ≥80% ✅ items.
4. `LICENSE` and `.env.example` present at repo root.

**Options considered:**

- _Single threshold (e.g., ≥90% ✅ across all categories)._ Rejected: hides gaps in critical categories behind strong scores in others. A perfect testing stack does not compensate for a missing license.
- _Pure P0-zero gate._ Rejected: a P0-free audit could still ship without a `LICENSE` if no auditor flagged it as P0; an explicit file check is more robust.
- _Stakeholder sign-off._ N/A for a single-developer portfolio repo.

**Consequences:**

- Re-audits produce a deterministic verdict.
- Audit progress is diffable across dated files in this folder.
- New categories require an explicit decision to amend this gate (append a follow-on ADR).

**Links:**

- `docs/development/architecture/saas-readiness/audit-2026-05-01.md`
- `docs/development/architecture/saas-readiness/README.md`
- `docs/todos/2026-05-01-promt-saas-readiness-audit.md`

---

## ADR-002 — Audit cadence + storage convention (Accepted 2026-05-01)

**Context:** Treating the audit as a one-shot artifact would let drift creep back in. Treating it as a living spreadsheet would lose historical signal.

**Decision:** Each audit run is written to a new dated file `audit-YYYY-MM-DD.md` in this folder. Prior audits are immutable — they are the trail. The repo-root `SAAS-BASE-CHECKLIST.md` always points to the **most recent** audit and shows that audit's scorecard + verdict + top 5 P0/P1 gaps.

Cadence: re-audit on demand (whenever a P0 closes, or before publishing the repo as a base), and at minimum quarterly while the project is unreleased.

**Options considered:**

- _Single rolling audit file overwritten each run._ Rejected: loses ability to diff progress.
- _Per-category files._ Rejected: scorecard cohesion suffers; each audit run is a single observation.

**Consequences:**

- The folder grows by one file per re-audit. Acceptable.
- The root checklist is the only mutable surface; everything else is append-only.

**Links:**

- `docs/development/architecture/saas-readiness/README.md`
- `SAAS-BASE-CHECKLIST.md` (repo root)

---

## ADR-003 — Where the canonical DDD layout lives (Proposed 2026-05-01)

**Context:** Audit gap [P1-10.1] documents drift across feature slices: `metric` lacks `dto.ts`, `metric-settings` has both `infrastructure/mappers/` and `infrastructure/persistence/`, `metric-log` uses `infrastructure/access/` instead of `infrastructure/providers/`, `analytics` uses `validators.ts` instead of `schema.zod.ts`. The `auth` feature is the canonical reference per `.claude/rules/architecture.md`.

**Decision (proposed):** The auth slice is the reference. All other slices migrate to match its layout:

```
features/{name}/
  domain/
    entities/
    repositories/
    [services/]              # only when domain logic does not fit on an entity
    [value-objects/]         # only when invariants are non-trivial
  application/
    use-cases/
    queries/
    ports/
  infrastructure/
    http/                    # router.ts, controller.ts, dto.ts, schema.zod.ts
    persistence/
      models/
      repositories/
      mappers/
    providers/               # port adapters that are not the persistence repo
  feature.ts
  index.ts
```

**Status:** Accepted (2026-05-17). The architecture-test (`__tests__/unit/architecture.test.ts`) has been added as part of the drift-cleanup phase to enforce the standard going forward.

**Options considered:**

- _Match the most recent feature (`metric-category`)._ Rejected: it is the only slice with VOs and a domain service, which most slices do not need.
- _Codify two layouts (simple/complex) and tag each slice._ Rejected: adds cognitive load; the canonical layout already accommodates both via the bracketed-optional dirs.

**Consequences:**

- Migration effort across `metric`, `metric-log`, `metric-settings`, `metric-category`, `analytics`. M-effort overall.
- One ESLint rule (or unit test) becomes the source of truth.
- Forkers see one canonical pattern.

**Links:**

- `audit-2026-05-01.md` § [P1-10.1]
- `.claude/rules/architecture.md`
- `src/features/shared/auth/` (reference)

---

## ADR-004 — Multi-tenancy direction for the SaaS base (Proposed 2026-05-01)

**Context:** Audit gap [P0-3.1] / [P0-9.1]: zero matches for `tenant`, `workspace`, `organization_id` across `src/`. Every domain row uses `user_id` as the boundary. SaaS bases generally need a higher unit of isolation so a single user can be in multiple billing units. Retrofitting after launch requires backfilling every domain table.

**Decision (proposed):** Introduce `Organization` + `Membership(userId, organizationId, role)` and add `organizationId` to all current and future domain tables. `req.organizationId` is derived in `authMiddleware` from the active membership. Forks that genuinely need single-tenant-per-user can ship with `Organization` rows that 1:1 mirror users — but the column exists.

**Status:** Accepted (2026-05-10). User confirmed the Organization + Membership approach is the right direction for a forkable SaaS base.

**Options considered:**

- _(a) Personal-only, single-tenant-per-user, document explicitly._ Rejected for a fork-base because most forks need at least workspaces.
- _(b) Organization + Membership now (this decision)._ Selected.
- _(c) Schema-per-tenant or DB-per-tenant._ Rejected: overkill for a base; isolated by row is sufficient and simpler.

**Consequences:**

- Migration: add `organization_id UUID NOT NULL` to `metrics`, `metric_categories`, `metric_settings`, `metric_logs`, plus a backfill from `users`.
- Auth flow grows: invite, accept, switch-org.
- Authorization gains a per-membership role enum (`owner | admin | member`), replacing the current `users.role` enum.

**Links:**

- `audit-2026-05-01.md` § [P0-3.1], [P0-9.1], [P1-1.3]
- `src/features/shared/auth/infrastructure/persistence/models/user.sequelize.ts:65-69`

---

## ADR-005 — Phase order and kit scaffolding for SaaS-readiness remediation (Accepted 2026-05-02)

**Context:** The 2026-05-01 audit produced 7 P0 + 17 P1 + 11 P2 gaps. Doing the work iteratively without a roadmap risks (a) starting the cheapest item last, (b) two phases stomping on each other (e.g., refresh tokens vs. multi-tenancy on the same auth surface), and (c) rediscovering the same context repeatedly when picking work back up. A scaffolded roadmap captures the order and the kit-folder layout once.

**Decision:** Adopt eight phases, each scoped to a doc kit (or an ADR entry for the cheapest sweep). The mapping is held in `iteration-plan.md` in this folder and is the single source of truth for "which kit closes which audit gap." The user-confirmed conventions:

1. Refresh-token remediation extends the existing `docs/development/architecture/jwt/` kit (Micro → Standard).
2. Architecture drift cleanup appends a new tracker under the existing `docs/development/architecture/feature-vertical-slice-migration/` kit.
3. P0 and P1 phases are scaffolded up front; P2-only items wait until they're up next.
4. Each kit's `README.md` ends with a fixed-shape References block (audit gaps closed, owning ADRs, effort, status, predecessor) so audit re-runs can mechanically diff progress.

**Options considered:**

- _All-in-one mega-plan inside `saas-readiness/`._ Rejected: violates `.claude/rules/documentation.md` placement (architecture topics live at `architecture/<topic>/`); buries reusable topics like multi-tenancy behind an audit-shaped folder.
- _Per-phase numeric prefix on folder names (`1-jwt/`, `2-observability/`)._ Rejected: existing convention under `architecture/` uses kebab-case topic names with no numeric prefix. The phase order belongs in `iteration-plan.md`, not folder names.
- _Scaffold every gap up front (including P2)._ Rejected: scaffolds for P2 items would sit empty for months and rot.

**Consequences:**

- Six new kit folders + two extensions of existing kits + one tracker file (`iteration-plan.md`) + two new ADRs (this one + ADR-006).
- Future audit re-runs read `iteration-plan.md` to mark closed gaps mechanically.
- Adding new P0/P1 work later requires a follow-on ADR amending the phase list.

**Links:**

- `docs/development/architecture/saas-readiness/iteration-plan.md`
- All eight kit folders referenced in `iteration-plan.md`.

---

## ADR-006 — Phase 0 cheap-P0 sweep (Accepted 2026-05-02)

**Context:** Four P0 audit items are individually small (S effort each) but each blocks a different fork-ready exit criterion. Bundling them into a single sweep is faster than four separate kits with their own README/plan/checklist overhead.

**Decision:** Phase 0 of the iteration plan ships as a single PR with no dedicated kit. It closes:

- **P0-11.1** — add `LICENSE` (ISC text matching `package.json:75`, or upgrade both to MIT).
- **P0-6.2** — add root `README.md` (project pitch, prerequisites, 5-min local boot, env-vars link, feature inventory).
- **P0-6.1** — add root `.env.example` generated from `src/config/zodEnv.ts` (write `scripts/generate-env-example.ts` and a CI sync-check).
- **P0-4.1** — add `app.set("trust proxy", env.TRUST_PROXY ?? 1)` in `src/server.ts`; add `TRUST_PROXY` to `zodEnv.ts`; add HTTPS-redirect middleware gated by `NODE_ENV === "production"`.

The PR title is `chore: cheap-P0 sweep (LICENSE, README, .env.example, trust-proxy)`. After merge, append a row to this ADR with the commit SHA and update `iteration-plan.md` Phase 0 status to ✅ Done.

**Options considered:**

- _Four separate PRs._ Rejected: creates four review cycles for ~1 day of total work; the items are independent in code but share a "fork-readiness scaffolding" theme.
- _Skip the sweep and roll the items into Phase 6 (forkability)._ Rejected: trust-proxy is a security item, not forkability; bundling delays a real bug fix.

**Consequences:**

- Closes 4 of 7 P0s in one PR.
- Flips fork-ready exit criterion #4 (`LICENSE` + `.env.example` present) immediately after merge.
- Three P0s remain after Phase 0: refresh tokens (Phase 1), request-ID propagation (Phase 2), multi-tenancy (Phase 4).

**Links:**

- `audit-2026-05-01.md` § [P0-6.1], [P0-6.2], [P0-11.1], [P0-4.1]
- `iteration-plan.md` § Phase 0
- After merge, this entry will be amended with: `Commit: <sha>`, `PR: <link>`.

**Completed:** P0-4.1 implemented (TRUST_PROXY env var + HTTPS redirect). P0-11.1 (LICENSE), P0-6.2 (README.md), P0-6.1 (.env.example) were fulfilled by earlier phases. PR: (to be filled in by user after merge).

---

## ADR-007 — CORS_ORIGIN accepts a comma-separated allowlist (Accepted 2026-05-22)

**Context:** Audit gap P2-4.5 in `audit-2026-05-20.md`: `CORS_ORIGIN` was a single `string`, so a deployment could only whitelist one origin. Multi-surface SaaS bases (app + admin + marketing) need more than one. This was the last ⚠️ item keeping Category 4 (Security) below the 80% threshold from ADR-001 exit criterion #3 — closing it flips Cat 4 to ≥80% ✅ and the ADR-001 fork-ready verdict from FAIL → PASS.

**Decision:** Keep the env var name `CORS_ORIGIN`. Parse its value in `src/config/zodEnv.ts` as a comma-separated list, trimming whitespace and dropping empty entries, transforming the schema output type from `string | undefined` to `string[] | undefined`. In `src/server.ts`, pass the parsed array directly to `cors({ origin })` — the `cors` lib natively matches against `string[]` and echoes the matched origin back per request. When the list is empty/undefined, fall back to `["http://localhost:3000"]`. Env read uses `loadEnvOrExit()` at the use site per `.claude/rules/environment.md`.

**Options considered:**

- _Introduce `CORS_ORIGINS` (plural) and deprecate the singular._ Rejected: a breaking env-var rename for every existing deployment to gain nothing — comma-separated parsing covers the single-origin case identically.
- _Use an `origin` callback function instead of an array._ Rejected: the `cors` lib's native array handling already does case-sensitive exact matching and per-request echoing; a hand-written callback would duplicate that logic with more code and no behavior change.

**Backwards compatibility:** A single-origin value (e.g., `CORS_ORIGIN=https://app.example.com`) still parses cleanly — it produces a 1-element array. No existing deployment needs to change its env to keep working.

**Consequences:**

- Closes P2-4.5 → Cat 4 reaches the ≥80% ✅ bar → ADR-001 exit criterion #3 passes → repo is fork-ready by the strict reading of ADR-001.
- `CORS_ORIGIN` schema output type changes from `string | undefined` to `string[] | undefined`. The only consumer is `src/server.ts`; no other call sites read it.
- `.env.example` updated to demonstrate the multi-origin form.

**Future tuning (non-blocking, deferred):** Surfaced during code review of this ADR; not required to close P2-4.5, captured here so the next person touching CORS doesn't re-discover them.

- `__tests__/integration/middleware/cors.test.ts` — add a one-line comment inside `buildAppWithCors()` explaining the `withTestEnv` → `resetEnvCacheForTesting()` → `loadEnvOrExit()` cache cycle, so future readers don't wonder why a mini-app is rebuilt per test instead of importing the main `app`.
- `.env.example` — optionally show the single-origin form alongside the multi-origin example for discoverability, e.g. a commented `# CORS_ORIGIN=https://app.example.com` line above the active multi-origin one.

**Links:**

- `audit-2026-05-20.md` § P2-4.5
- `decisions.md` § ADR-001 (the fork-ready gate this closes)
- `src/config/zodEnv.ts` (CORS_ORIGIN schema)
- `src/server.ts` (cors() wiring)
- `__tests__/integration/middleware/cors.test.ts` (allowed / disallowed / single-origin / whitespace coverage)

---

## ADR-008 — Accept "GOLD WITH CAVEATS" as the gone-gold verdict (Accepted 2026-05-24)

**Context:** An independent, deliberately-skeptical "gone-gold" review (`audit-2026-05-24-independent.md`) re-ran all six empirical gates (green), pressure-tested the security- and multi-tenancy-critical ✅ claims by reading code rather than trusting the 2026-05-20 self-audit, ran an architectural-drift sweep, and performed a live forkability dry-run. It confirmed the strict ADR-001 fork-ready gate now **passes** (zero P0; Cat 1/4/6/7/8/11 ≥80% — Cat 4 at 87.5% after P1-4.2 + P2-4.5 both closed; `LICENSE` + `.env.example` present), with no exploitable P0 remaining. It also found six industry-standard quality gaps (C1–C6), each scoped to ≤1 day, that an outside reviewer would close before recommending the repo as a base. A decision is needed: declare the repo publishable now, or hold until every caveat closes.

**Decision:** Accept the verdict **GOLD WITH CAVEATS** — the repo is publishable as a forkable SaaS base **today**, with C1–C6 tracked as visible ≤1-day follow-ups in `FINAL-AUDIT-SUMMARY.md`. The repo is re-stated as a clean **GOLD** (and a new dated `audit-YYYY-MM-DD.md` produced per ADR-002) only when C1–C6 are closed. The two caveats a forker / API consumer hits first — **C1** (the bootstrap-fork flow does not work as printed: secret rotation no-ops on a fresh clone and `npm test` fails without an undocumented `.env.test`) and **C3** (the error envelope is inconsistent, violates `api-design.md`, and is undocumented in the OpenAPI contract) — lead the punch list.

**Options considered:**

- _Hold until clean GOLD (close C1–C6 first)._ Rejected: there is no P0 blocker, the ADR-001 gate already passes, and the caveats are quality/DX/contract gaps rather than security holes. Blocking publication on ≤1-day polish items delays a usable base for no risk reduction.
- _Declare clean GOLD now, fold the caveats silently into the backlog._ Rejected: C1 and C3 are real and would visibly trip a forker; suppressing them would repeat the friendly-self-audit failure mode this independent review exists to correct. The caveats must be tracked in the open.
- _Re-open the iteration plan with a "Phase 9: gone-gold hardening."_ Deferred: the six caveats are small and cross-cutting; a tracked punch list in `FINAL-AUDIT-SUMMARY.md` § 4 is lighter-weight than a full kit. Promote to a phase only if the list grows.

**Consequences:**

- The repo may be published/forked now; the C1–C6 punch list governs the path to a clean GOLD verdict.
- `SAAS-BASE-CHECKLIST.md` (repo root) is updated to point at `audit-2026-05-24-independent.md` and reflect the GOLD WITH CAVEATS verdict + re-graded scorecard.
- Audit cadence (ADR-002 unchanged): produce a new dated audit when C1–C6 close, and re-state the verdict.
- The independent scorecard is intentionally stricter than the 2026-05-20 self-audit (47✅ / 14⚠️ / 4❌ vs 52 / 9 / 4) because the review downgraded items the self-audit over-credited (error envelope, architecture-test rigor, runtime branding leak, Sentry PII scrubbing, log-redaction coverage). This is expected: the independent grade is the conservative one of record.

**Links:**

- `audit-2026-05-24-independent.md` (evidence of record)
- `FINAL-AUDIT-SUMMARY.md` § 4 (the C1–C6 punch list with fix-status checkboxes)
- `decisions.md` § ADR-001 (the fork-ready gate this verdict clears), § ADR-002 (audit cadence + checklist convention), § ADR-007 (the CORS closure that completed criterion #3)
- `SAAS-BASE-CHECKLIST.md` (repo root, updated alongside this ADR)

---

## ADR-009 — Tenant scoping is required on every cache key (Proposed 2026-06-05)

**Context:** The 2026-06-05 re-audit (`audit-2026-06-05.md` §6.1 N1/N2) found that the visualization cache layer keys both single-metric (`viz:${userId}:${metricId}:${bucketIso}:${hash}`) and dashboard (`vizdash:${userId}:${bucketIso}:${hash}`) entries by `userId` only, even though `organizationId` is present on the port type and threaded into the read repository. This is a latent cross-tenant disclosure bug because users can belong to multiple organizations: a cache hit can return another org's data after a `switch-org`. The same shape exists structurally in `MetricCacheRedis`, `MetricLogCacheRedis`, and `buildCursorCacheKey` (`src/shared/cache/keys.ts:32–51`), where `organizationId` is an optional `segments` entry rather than a required parameter. Prior audits verified DB-layer org scoping but never inspected the cache layer.

**Decision:** Every Redis (or other shared) cache key generated by code in this repo MUST include `organizationId` as a mandatory segment in both the visible key prefix and the hashed raw string. The mechanism:

1. `buildCursorCacheKey` and all feature-specific cache-key helpers take `organizationId` as a **required positional parameter** — never as an optional bag.
2. Invalidation port signatures (`VisualizationInvalidationPort`, `CacheInvalidationPort`, etc.) require `organizationId` in `invalidateByX(...)` methods so SCAN patterns can target a single org.
3. An architecture test (extension of `__tests__/unit/architecture.test.ts`, see ADR-011 for the broader arch-test rework) asserts that no cache key template string contains `${userId}` without a sibling `${organizationId}` in the same template.

**Options considered:**

- _Soft convention + code review._ Rejected: this is exactly what failed for `viz`/`vizdash` keys — the convention existed but had no enforcement, and three prior audits missed the gap.
- _Hash org into a per-org namespace prefix (`org:{id}/...`) for all Redis keys._ Considered. Cleaner long-term but requires reworking every invalidator's SCAN pattern in one shot. Defer behind ADR-009 minimum bar; revisit when Phase 6 cache port consolidation lands.
- _Encrypt cache values with per-org keys._ Rejected for this iteration: large lift; the key-shape fix is enough to close the disclosure path. Encryption is a defense-in-depth option for a later phase.

**Consequences:**

- N1/N2 patch (visualization) is the canonical reference implementation. All other cache keys migrate to match.
- Arch test gains teeth (intersects with C4 / ADR-011).
- `MetricLogCacheRedis.invalidate()` signature changes — touches every caller. Mechanical refactor.
- Once enforced, this is the kind of rule that's invisible in the happy path but catches the next class of cross-tenant cache bug at CI time.

**Links:**

- `audit-2026-06-05.md` §6.1 (N1, N2), §6.2 (N3)
- `src/features/public/analytics/infrastructure/cache/VisualizationCacheRedis.ts:52–69`
- `src/features/public/analytics/infrastructure/cache/VisualizationInvalidationAdapter.ts:6–26`
- `src/shared/cache/keys.ts:32–51`

---

## ADR-010 — Production-unsafe env switches must be refused at schema layer (Proposed 2026-06-05)

**Context:** The 2026-06-05 re-audit (`audit-2026-06-05.md` §6.2 F1) flagged that `DISABLE_RATE_LIMITING` (a global killswitch for every rate limiter — global, user, analytics, switch-org, password-reset, email-verify) is parsed as a plain boolean with `.default("false")` at `src/config/zodEnv.ts:188–191`. There is **no validation that rejects `true` when `NODE_ENV=production`**. The rule is documented as "test/fuzzing only" in `.claude/rules/security.md`, but the rules-as-convention enforcement is purely advisory: a misconfigured production deploy (fat-finger, CI copying a test `.env`, a forker who didn't clean their `.env`) silently disables every rate limiter, and the only signal is a single `logger.info` line at process start (`src/shared/middleware/rate-limiter.ts:10`) that log monitoring may miss.

**Decision:** Any environment variable whose `true` value would weaken a production security control MUST refuse that combination at the Zod schema layer via `.superRefine()`, causing `loadEnvOrExit()` to fail fast at process start. The minimum enforcement set for this codebase:

| Env var                  | Refused-in-production combination                                        |
| ------------------------ | ------------------------------------------------------------------------ |
| `DISABLE_RATE_LIMITING`  | `true` when `NODE_ENV=production`                                        |
| `ALLOW_TEST_HTTP_SERVER` | `true` when `NODE_ENV=production`                                        |
| `RABBITMQ_USER`          | `"guest"` when `NODE_ENV=production` and `RABBITMQ_ENABLED`              |
| `RABBITMQ_PASSWORD`      | `"guest"` when `NODE_ENV=production` and `RABBITMQ_ENABLED`              |
| `SWAGGER_REQUIRE_AUTH`   | `false` when `NODE_ENV=production` (already conventionally true; codify) |

**Options considered:**

- _Documentation-only enforcement (status quo)._ Rejected — this audit caught a real instance; "documented as test-only" is not a safety property.
- _Runtime assertion in the consuming module (e.g., `rate-limiter.ts`)._ Considered. The schema layer is preferred because it short-circuits the boot sequence consistently with `loadEnvOrExit()`'s fail-fast contract; runtime guards run later and can be bypassed by code that bypasses the singleton.
- _Whitelist approach (every env switch must be explicitly safe-in-prod)._ Considered. Overkill at this scale; the named-bad list is more maintainable. Re-visit if the env schema doubles in size.

**Consequences:**

- Process refuses to start in `NODE_ENV=production` if any of the listed combinations are set. Failure surface is the startup logger error message, which is monitored.
- Test envs continue to work unchanged — only `NODE_ENV=production` triggers the refusal.
- Future security-relevant switches added to `zodEnv.ts` MUST be considered against this rule (a comment in the schema referencing this ADR will be added).

**Links:**

- `audit-2026-06-05.md` §6.2 (F1), §6.3 (F3)
- `src/config/zodEnv.ts:188–191` (the unguarded `DISABLE_RATE_LIMITING`)
- `src/config/zodEnv.ts:193–196` (`ALLOW_TEST_HTTP_SERVER`)
- `src/config/zodEnv.ts:215–216` (RabbitMQ guest defaults)
- `.claude/rules/security.md` (which will reference this ADR)

---

## ADR-011 — Resolve the canonical-DDD-layout disagreement (Proposed 2026-06-05)

**Context:** ADR-003 (Proposed 2026-05-01) mandates the layout `infrastructure/persistence/{models, repositories, mappers}/` and names `shared/auth` as the **reference slice**. The 2026-06-05 re-audit (`audit-2026-06-05.md` §5) found that the reference slice does **not** match the prescribed layout: `src/features/shared/auth/infrastructure/persistence/` is **flat** — seven `*RepositorySequelize.ts` files at the top level with only `models/` nested. Meanwhile, non-reference slices (`metric`, `metric-log`) match the ADR's nested layout. `.claude/rules/architecture.md` documents the nested layout as canonical, deepening the disagreement. The 2026-05-24 audit acknowledged this only obliquely via C4 (the arch test does not detect it).

**Decision:** Pin the **nested layout** (`infrastructure/persistence/{models, repositories, mappers}/`) as canonical for all slices, including `shared/auth`. Migrate `shared/auth/infrastructure/persistence/` to the nested shape in a dedicated cleanup PR. Update `.claude/rules/architecture.md`'s code block to match and reference this ADR. Strengthen `__tests__/unit/architecture.test.ts` (closing C4) to assert the nested layout exists in every feature slice.

Choosing nested over flat is motivated by:

1. The architecture rule already documents nested.
2. Non-reference slices already match nested, so the migration cost is lower (one slice moves, not five).
3. The `mappers/` and `repositories/` subdirs scale better when a slice grows beyond ~3 entities.

**Options considered:**

- _Flatten everything to match `shared/auth`._ Rejected: four slices migrate vs. one, and the rules doc must change anyway. Higher cost, same outcome.
- _Allow either layout (leave ADR-003 deliberately ambiguous)._ Rejected: ambiguity is what produced the drift. The arch test (ADR-011 follow-on) needs a single shape to assert.
- _Defer until C4 closes._ Deferred is what the 05-24 audit effectively did. The disagreement is small but real and easy to fix now.

**Consequences:**

- `shared/auth/infrastructure/persistence/` is restructured into `{models, repositories, mappers}/`. Mechanical change; no behavior delta.
- ADR-003 is amended (in-place) to flip from Proposed → **Accepted (revised 2026-06-05)** with this ADR as the supersession marker. The "reference slice = auth" wording is retained because `auth/feature.ts`, use-case organization, and port placement remain reference-grade; only the persistence layout is realigned.
- C4 closure becomes simpler — the arch test now has one shape to enforce.

**Links:**

- `audit-2026-06-05.md` §5 (the contradiction surfaced explicitly)
- `decisions.md` § ADR-003 (the original Proposed decision being revised)
- `.claude/rules/architecture.md`
- `__tests__/unit/architecture.test.ts:39–118` (the test that must be strengthened)
