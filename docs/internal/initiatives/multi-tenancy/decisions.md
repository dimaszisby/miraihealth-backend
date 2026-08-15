# Multi-Tenancy Kit — Decisions Log

ADR-style entries scoped to the multi-tenancy kit. The cross-kit ADR-004 (the choice to introduce Organization + Membership at all) lives in `docs/internal/audits/saas-readiness/decisions.md` and gates this kit.

---

## ADR-001 — FK cascade behavior on `organization_id` (Accepted 2026-05-11)

**Context:** Every domain table gains an `organization_id UUID NOT NULL FK organizations(id)`. When an organization is deleted (paranoid soft-delete) or hard-deleted, what happens to its rows?

**Decision:**

1. **`ON DELETE RESTRICT`** for all domain tables (`metrics`, `metric_categories`, `metric_settings`, `metric_logs`). A hard-delete on `organizations` only succeeds if no domain rows reference it.
2. Soft-deleting an organization (paranoid `deletedAt`) does NOT cascade — the domain rows remain queryable but every read path that scopes by `organizationId` will see zero results because the membership lookup will exclude soft-deleted orgs.
3. **`ON DELETE CASCADE`** for `memberships` and `organization_invites` — these are bookkeeping artifacts that have no value without their organization.
4. **`processed_messages`** is system bookkeeping (RabbitMQ idempotency); it gets `ON DELETE SET NULL` so a deleted org doesn't break message replay.

**Status:** Accepted.

**Options considered:**

- _Cascade everywhere._ Rejected: a single typo could nuke the metric history of a paying customer. Restrict forces explicit intent.
- _SET NULL on domain tables._ Rejected: every domain row is meaningless without its org context.

**Consequences:**

- Hard-deleting an org becomes a deliberate multi-step flow (drain memberships, soft-delete first, run a purge job).
- Test fixtures cleaning up via `truncate ... cascade` still work because integration tests truncate every table.

**Links:**

- `multi-tenancy-plan.md` § Phase 1, Phase 3.

---

## ADR-002 — Membership.role enum lives on `memberships`, replaces `users.role` (Accepted 2026-05-11)

**Context:** The current `users.role` enum (`'user' | 'admin'`) is global per user. With organizations, the same user can be `owner` of one org and `member` of another. The role belongs on the join.

**Decision:**

1. Add `role VARCHAR(20) NOT NULL CHECK role IN ('owner','admin','member')` on `memberships`.
2. `requireAdmin` middleware is replaced by `assertHasOrgRole(req, "admin" | "owner")` which reads `req.membership.role`.
3. After all read sites migrate (Phase 5), drop `users.role` in a follow-up migration. Until then the column is dead-code-ignored but kept (zero-downtime).
4. There is no global "platform admin" concept in this base. Forks that need one can add a `users.platform_role` column without affecting org membership.

**Status:** Accepted.

**Options considered:**

- _Keep `users.role` AND add `Membership.role` for two layers of authorization._ Rejected: doubles the surface; forks can add a global role later if needed.
- _Use a separate `permissions` table._ Rejected: premature; three roles is enough for the base. RBAC granularity is a future concern.

**Consequences:**

- One enum migration, one role-helper module, one `requireAdmin` deprecation.
- Future "platform admin" concept lands as an additive column on `users`.

**Links:**

- `audit-2026-05-01.md` § [P1-1.3]
- `src/features/shared/auth/infrastructure/persistence/models/user.sequelize.ts:65-69`
- `src/features/shared/auth/infrastructure/http/requireAdmin.ts`

---

## ADR-003 — Invite-token format mirrors password-reset (Accepted 2026-05-11)

**Context:** `organization_invites` is a token-by-email construct. The repo already has two examples: `password_reset_tokens` (sha256-hashed token, 15-min TTL, single-use) and the upcoming `email_verification_tokens` (sha256-hashed, 24-hour TTL, single-use). Inventing a third pattern would be drift.

**Decision:**

1. Identical schema shape: `id UUID PK`, `organization_id FK`, `email`, `role VARCHAR(20)`, `token_hash CHAR(64) UNIQUE` (sha256 hex), `expires_at`, `accepted_at NULL`, `created_at`.
2. Token TTL: 7 days (longer than email-verification because invitees may be unfamiliar with the product and take a while to act).
3. Anti-enumeration: `POST /invites/accept` returns the same generic 400 for invalid / expired / already-accepted.
4. Raw token only ever in the email body; only the hash hits the DB.

**Status:** Accepted.

**Options considered:**

- _JWT-based invite._ Rejected: revocation requires a denylist anyway, and JWT structure leaks claims that aren't needed at acceptance time.
- _Single shared `tokens` table._ Rejected: each token type has different invariants and access patterns; a shared table forces a discriminator column and weakens types.

**Consequences:**

- One new template `organization-invite.ts`.
- One new use case pair (`InviteUserToOrganization`, `AcceptInvite`).
- Reuses the existing `EmailSender` port — no infrastructure additions.

**Links:**

- `multi-tenancy-plan.md` § Phase 6
- `docs/internal/initiatives/features/password-reset/` (reference pattern).
