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

- `documents/development/architecture/saas-readiness/audit-2026-05-01.md`
- `documents/development/architecture/saas-readiness/README.md`
- `documents/todos/2026-05-01-promt-saas-readiness-audit.md`

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

- `documents/development/architecture/saas-readiness/README.md`
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

**Status:** Proposed. To be Accepted only after an architecture-test (`__tests__/unit/architecture.test.ts`) is added that fails CI when a slice deviates. Without enforcement, the standard drifts again.

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

1. Refresh-token remediation extends the existing `documents/development/architecture/jwt/` kit (Micro → Standard).
2. Architecture drift cleanup appends a new tracker under the existing `documents/development/architecture/feature-vertical-slice-migration/` kit.
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

- `documents/development/architecture/saas-readiness/iteration-plan.md`
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
