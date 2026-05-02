# Multi-Tenancy Foundation — Checklist

## Phase 0 — Gating

- [ ] ADR-004 in `documents/development/architecture/saas-readiness/decisions.md` flipped Proposed → Accepted.
- [ ] Kit-local ADRs reviewed (`./decisions.md`).

## Phase 1 — Schema

- [ ] Migration: create `organizations` (paranoid, slug UNIQUE).
- [ ] Migration: create `memberships` (UNIQUE `(user_id, organization_id)`).
- [ ] Migration: create `organization_invites` (token-by-email shape).
- [ ] Migrations have working `down`.
- [ ] Run on dev + test; verify schema.

## Phase 2 — Backfill (existing data)

- [ ] Backfill migration creates one Organization per user + owner Membership.
- [ ] Idempotent (`WHERE NOT EXISTS`).
- [ ] Row counts captured in `metrics-tracker.md` (before/after).
- [ ] Run on staging; verify row counts.

## Phase 3 — Add `organization_id` to domain tables

- [ ] Migration adds nullable `organization_id` to `metrics`, `metric_categories`, `metric_settings`, `metric_logs`, `processed_messages`.
- [ ] (If present) Add to `password_reset_tokens`, `email_verification_tokens`, `refresh_tokens`.
- [ ] Backfill: `UPDATE ... SET organization_id = (SELECT m.organization_id FROM memberships m WHERE m.user_id = X AND m.role = 'owner' LIMIT 1)`.
- [ ] Verify zero NULLs remain (`SELECT COUNT(*) WHERE organization_id IS NULL` per table).
- [ ] Follow-up migration: NOT NULL + FK constraint.

## Phase 4 — Auth + request scoping

- [ ] JWT access-token claims include `organizationId`.
- [ ] Login picks default membership (oldest `joined_at`, status `active`).
- [ ] `authMiddleware` validates the membership is still active; sets `req.organizationId`, `req.membership.role`.
- [ ] `assertHasOrgRole(req, role)` helper added.
- [ ] `POST /auth/switch-org` route + `SwitchOrganization` use case; reissues access token via the refresh flow.
- [ ] All `requireAdmin` usages migrated to `assertHasOrgRole(req, "admin")`.

## Phase 5 — Repositories filter by org

- [ ] Every repository method signature updated to require an `organizationId` (or a `RequestContext` arg).
- [ ] Sequelize finders include `where: { organizationId }` everywhere.
- [ ] Codemod test fixtures to provide `organizationId`.
- [ ] All existing tests pass.

## Phase 6 — Invites + role management

- [ ] Use cases: `InviteUserToOrganization`, `AcceptInvite`, `RemoveMembership`, `ChangeMemberRole`.
- [ ] Routes: `POST /organizations/:id/invites`, `POST /invites/accept`, `DELETE /memberships/:id`, `PATCH /memberships/:id`.
- [ ] Email template `organization-invite.ts`.
- [ ] OpenAPI regen.

## Phase 7 — Cleanup

- [ ] Migration to drop `users.role` after all read sites are off it.
- [ ] Remove the auth-middleware fallback for tokens lacking `organizationId` (after refresh-token TTL has passed since Phase 4 deployed).

## Wrap-up

- [ ] `npm run typecheck && npm run lint && npm run format:write && npm test`.
- [ ] Audit re-run shows P0-3.1, P0-9.1, P1-1.3 marked ✅.
- [ ] Update `iteration-plan.md` Phase 4 status to ✅ Done with PR link(s).
