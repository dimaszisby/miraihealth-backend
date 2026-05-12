---
name: Multi-Tenancy Phase 4 Review
description: Review of Phase 4 auth layer — JWT org claims, authMiddleware membership validation, SwitchOrganization, assertHasOrgRole, requireAdmin removal
metadata:
  type: project
---

Phase 4 multi-tenancy auth reviewed on 2026-05-12 (feat/multi-tenancy-auth branch, ~28 files).

**Verdict: REQUEST CHANGES — 2 CRITICALs, 5 WARNINGs, 4 SUGGESTIONs.**

Key shipped decisions:

- JWT claims now include `organizationId` (in `TokenPayload.sign`); `TokenClaims` returned from `verify` also includes it (defaulting to `""` for legacy tokens)
- `authMiddleware` validates membership is active via `isActive()` for new tokens; legacy tokens (no orgId claim) fall back to `findDefaultByUser` which filters by `status: 'active'` at the DB level
- `SwitchOrganization` use case: validates membership isActive, issues new access token + new refresh token (independent family — does NOT revoke existing tokens)
- `assertHasOrgRole` helper replaces `requireAdmin` (deleted)
- `RegisterUser` creates org + owner membership; membership `status` not explicitly passed (relies on repo default of `"active"`)

Critical issues confirmed:

1. `authMiddleware` still uses `defaultDependencies()` with `new` inside — DI violation carried over from Phase 0–3 (was CRITICAL in prior review, still present)
2. `SwitchOrganization` does not revoke previous refresh token family before issuing new one — a user can accumulate unlimited active refresh token families by switching orgs repeatedly

Warning issues:

- `RotateRefreshToken` uses `findDefaultByUser` not the specific org in the token — after switch-org, a refresh rotates back to default org token regardless of what org the user switched to
- `findByUserAndOrg` in `MembershipRepositorySequelize` does not filter by `status: 'active'` at the DB level; callers must check `isActive()` — DB-level filter missing
- `RegisterUser.membershipRepo.create` does not pass `status` field explicitly — relies on repo implementation default
- `SwitchOrganization` has no unit test at all
- `assertHasOrgRole` / `requireOrgRole` have no unit tests

ADR compliance:

- ADR-002 implemented correctly: `requireAdmin` deleted, replaced by `assertHasOrgRole(req, "admin" | "owner")`

**Why:** Phase 5 (repo-level org scoping) will break if tokens don't reliably contain the right orgId after switch-org. The refresh token family accumulation issue is also a token hygiene/security concern.
**How to apply:** Before approving Phase 5 PR, verify CRITICAL #2 is fixed (SwitchOrg revokes old family). CRITICAL #1 (DI in authMiddleware) remains a recurring pattern — flag on every auth PR.
