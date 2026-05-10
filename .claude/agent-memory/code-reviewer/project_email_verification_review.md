---
name: Email Verification Phase 3 Review
description: Review findings for feat/email-verification branch — key patterns and recurring violations to watch in follow-on PRs
type: project
---

Phase 3 email-verification shipped on feat/email-verification. Overall: solid foundation, verdict Fix-then-ship.

**Known recurring DDD violation:** Both `RequestEmailVerification` and the pre-existing `RequestPasswordReset` import email template functions directly from `../../infrastructure/email/templates/`. The fix is to move template builders to an application-layer `email-templates/` folder or pass an opaque `EmailTemplateBuilder` port. Flag this pattern in every future email-sending use case review.

**Why:** Application layer must have zero infrastructure imports. The template builder is infrastructure (HTML, string concatenation, presentation concern). It belongs either in the infra layer (called by the adapter, not the use case) or behind a port.

**How to apply:** Any use case that calls `buildX Email()` from an infrastructure template path is a DDD layering violation. Block until fixed or until a shared ADR explicitly accepts the technical debt.

**Other findings:**

- `UserSchema` in `openapi-schemas.ts` is missing `emailVerifiedAt` — `GET /auth/profile` spec diverges from actual response shape. Flag in every OpenAPI update that touches UserSchema.
- 429 response on `/auth/verify-email` uses `SuccessResponseSchema` instead of an error schema in `openapi-docs.ts` — minor spec accuracy issue.
- New env vars (`FRONTEND_VERIFY_URL`, `RATE_LIMIT_EMAIL_VERIFICATION_EMAIL_MAX`, `RATE_LIMIT_EMAIL_VERIFICATION_IP_MAX`) were NOT added to `.env.example`. Always check `.env.example` after adding env vars to `zodEnv.ts`.
- `VerifyEmail` use case has a TOCTOU window: `findByTokenHash` + `markUsed` are two separate DB calls with no transaction. This matches the existing `ResetPassword` pattern (same issue) — acceptable for now but document it.
- `req.user!.id` non-null assertion in `resendVerification` error handler is sloppy style (safe because `assertAuthenticated` ran, but use `req.user?.id` in error paths).
