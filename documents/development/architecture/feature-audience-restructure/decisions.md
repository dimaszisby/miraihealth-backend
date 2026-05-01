# Decisions — Feature Audience Restructure

ADR-style log. Statuses: `Proposed`, `Accepted`, `Superseded`, `Rejected`.

---

## ADR-001 — Three-bucket audience taxonomy: `public/`, `admin/`, `shared/` (Proposed YYYY-MM-DD)

**Context:** `src/features/` is flat. SaaS plans demand a visible boundary between end-user surfaces and internal/ops surfaces. We need a taxonomy that's small enough to be obvious and large enough to fit reality.

**Decision:** Three buckets:

- `public/` — slices a normal end user authenticates against.
- `admin/` — slices guarded by `requireAdmin` (role-based).
- `shared/` — slices intentionally serving both audiences (today: `auth`).

**Options considered:**

1. **Two buckets (`public/`, `admin/`)** — forces `auth` into one or the other; misleading because login serves both audiences and the User entity is a single shared aggregate.
2. **Three buckets (chosen)** — `shared/` carries the genuinely cross-audience pieces and prevents wrong "ownership" labeling.
3. **Per-tenant buckets / multi-tenant first** — premature; we have no tenant abstraction today. Revisit in a separate initiative.

**Consequences:**

- `auth` lives under `shared/auth`. Future cross-audience slices (e.g., feature flags, audit log writer) also go to `shared/`.
- The `admin/` bucket starts empty — that's intentional foundation work, not bikeshedding. First admin feature lands there.
- `shared/` is a controlled space: a slice belongs there only when both audiences legitimately consume it. Default to picking a single bucket.

**Links:** [Plan §Strategy](./feature-audience-restructure-plan.md#strategy)

---

## ADR-002 — Preserve `@/features/<feature>/*` import paths via tsconfig aliases (Proposed YYYY-MM-DD)

**Context:** Many constraint-locked dirs (`src/utils`, `src/types`, `src/infrastructure`, `src/lib`, `src/worker.ts`) import features by alias today. The task constraint forbids touching those files. A naive directory move would break every one of those imports.

**Decision:** Add per-feature TypeScript path aliases that map each `@/features/<feature>/*` to its new audience-scoped location. Apply to **both** `tsconfig.json` and `tsconfig.build.json`. The runtime build resolver (`scripts/resolve-build-aliases.mjs`) honors them.

**Options considered:**

1. **Update locked files** — violates the user's constraint.
2. **Re-export shim files at old paths** — only works for `index.ts`; deep imports like `@/features/auth/infrastructure/persistence/models/user.sequelize.js` require keeping the entire old tree as shims, doubling files. Rejected.
3. **TS path aliases (chosen)** — zero code edits to locked dirs, minimal surface area, idiomatic.

**Consequences:**

- Aliases must be added in both tsconfig files; a forgotten entry surfaces as a runtime "Cannot find module" only at `npm run build` time. Phase 0 alias-probe smoke catches this early.
- Internal feature imports inside the moved tree should prefer relative paths to keep slices self-contained, but cross-feature imports keep using the alias — that's why the aliases exist.
- The aliases are technically a transitional shim. Removing them later requires rewriting cross-feature imports to use audience-prefixed paths — see ADR-003.

**Links:** [Plan §Strategy / Path-Alias Preservation](./feature-audience-restructure-plan.md#path-alias-preservation-the-linchpin)

---

## ADR-003 — Defer rewrite of cross-feature imports to audience-prefixed paths (Proposed YYYY-MM-DD)

**Context:** After the move, cross-feature imports still use `@/features/<feature>/...` resolved via aliases. The "ideal" target state would have callers use `@/features/public/<feature>/...` so the audience is visible at every import site.

**Decision:** Defer the rewrite to a follow-up cleanup PR. This initiative is a structural move; mass-rewriting imports doubles the diff size, increases review risk, and doesn't unlock new capability.

**Options considered:**

1. **Rewrite in this PR** — large diff, blast radius across every locked-dir consumer. Rejected.
2. **Defer (chosen)** — keeps this PR reviewable; aliases are harmless to leave in place for at least one release cycle.
3. **Codemod-driven rewrite** — possible later; viable if we want to retire aliases without manual edits.

**Consequences:**

- Aliases remain. They're documented as transitional, not permanent.
- A follow-up PR (tracked in checklist Post-Merge Follow-ups) will remove the aliases and fix locked-dir imports as a focused change.

**Links:** [Plan §Open Questions](./feature-audience-restructure-plan.md#open-questions)

---

## ADR-004 — Defer ESLint rule for cross-audience import enforcement (Proposed YYYY-MM-DD)

**Context:** Once `public/`, `admin/`, `shared/` exist, we could enforce at lint-time that `public/*` cannot import `admin/*`, `admin/*` cannot import `public/*`, and both can import `shared/*`. This would harden the boundary mechanically.

**Decision:** Skip in this PR. Add the rule once at least one real `admin/` slice exists and we have data on legitimate boundary patterns.

**Options considered:**

1. **Add the rule now** — risks blocking the move with false positives from auto-generated paths or test-only imports; no admin code exists to validate the rule.
2. **Defer (chosen)** — boundaries today are documented in this kit and reviewer-enforced. Mechanical enforcement comes when we have something real to protect.

**Consequences:**

- No mechanical guardrail until a follow-up. Reviewers must catch boundary violations during code review.
- Track in Post-Merge Follow-ups.

**Links:** [Plan §Open Questions](./feature-audience-restructure-plan.md#open-questions)

---

## ADR-005 — `requireAdmin` lives under `shared/auth/infrastructure/http/` (Proposed YYYY-MM-DD)

**Context:** A new middleware is needed to guard `/api/v1/admin/*`. It needs `req.user` (set by `authMiddleware`) and a role check. Where it lives shapes future expansion.

**Decision:** Place it at `src/features/shared/auth/infrastructure/http/requireAdmin.ts` and re-export from `shared/auth/index.ts`. Today's logic is a 6-line role check.

**Options considered:**

1. **Top-level `src/shared/middleware/`** — that dir is locked. Rejected.
2. **`shared/auth/infrastructure/http/` (chosen)** — auth concerns belong with auth; `requireAdmin` directly extends what `authMiddleware` produced.
3. **Future `features/shared/authorization/` slice** — over-engineering for one middleware. Promote later if authorization grows complex (multi-role, scopes, tenant-aware).

**Consequences:**

- The auth slice owns both authentication and basic authorization, which is conventional.
- If future authorization grows (RBAC, scopes), extract to a dedicated `authorization` shared slice and supersede this ADR.

**Links:** [Plan §Phase 7](./feature-audience-restructure-plan.md#phase-7--wire-apiv1admin-namespace)
