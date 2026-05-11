---
name: Multi-Tenancy Phase 0–3 Review
description: Review of organizations/memberships schema, backfill migrations, authMiddleware changes, and organizationId propagation across domain tables
type: project
---

Phase 0–3 multi-tenancy foundation reviewed on 2026-05-11 (feat/multi-tenancy branch, ~50 files, 6 migrations).

**Verdict: REQUEST CHANGES — 5 CRITICALs block merge.**

Key decisions that shipped:

- Organization + Membership domain entities in `src/features/shared/auth/`
- 6 migrations: create organizations, memberships, invites; backfill; add nullable org_id; set NOT NULL
- authMiddleware updated to fetch memberships, set `req.user.organizationId`
- RegisterUser creates org + owner membership on signup

Critical issues confirmed:

1. `processed_messages` Sequelize model never updated — column added by migration 000005 is invisible to the ORM
2. Migration 000004 `down` is destructive — `DELETE FROM memberships` and `DELETE FROM organizations` wipes all data, not just backfill rows
3. Migration 000006 `changeColumn` for NOT NULL takes `AccessExclusiveLock` — table-rewrite on large tables, no `NOT VALID` pattern
4. `authMiddleware` hardcodes `new` for repos/providers inside `defaultDependencies()` — bypasses feature.ts DI root
5. `status` field missing from Membership entity and migration (plan requires `{active, invited, removed}`)

Warning issues:

- authMiddleware calls `findAllByUser()` fetching ALL memberships but only uses `[0]` — no targeted query
- Slug uniqueness race: RegisterUser derives slug from username without checking `existsBySlug` before `create()`
- Migration 000004 slug JOIN uses same REGEXP that generated orgs — fragile for usernames with only special chars (slug collapses to `-user-id-prefix` which is stable, but edge case)
- productivityMetric seeded with primaryOrg but its logs use secondaryOrg in seed-contract-tests.ts
- ADR-001/002/003 all show "Proposed" status despite being implemented
- No unit or integration tests for Organization entity, Membership entity, OrganizationRepositorySequelize, or MembershipRepositorySequelize
- GenerateDummyMetrics / GenerateDummyMetricLogs import `models` directly in application layer (pre-existing DDD violation, not introduced here)

**Why:** Phase 4 membership validation (`status='active'`) and any multi-org query will break without the missing `status` field.
**How to apply:** Before approving any follow-on Phase 4 PR, verify these CRITICALs are resolved.
