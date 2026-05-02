# Email Verification — Checklist

## Phase 0 — Schema

- [ ] Migration `YYYYMMDDHHMMSS-add-users-email-verified-at.cjs` adding `email_verified_at TIMESTAMPTZ NULL` to `users`. Working `down`.
- [ ] Migration `YYYYMMDDHHMMSS-create-email-verification-tokens.cjs` (id UUID PK, user_id FK, token_hash UNIQUE, expires_at, used_at NULL, created_at + index on `(user_id, used_at)`). Working `down`.
- [ ] Run `npm run migrate:dev` and `npm run migrate:test`; verify tables present.

## Phase 1 — Domain

- [ ] `EmailVerificationToken.ts` entity (private constructor, `issue()`, `markUsed()`, `isExpired()`, `isUsable()`).
- [ ] `EmailVerificationTokenRepository.ts` interface: `save`, `findByTokenHash`, `revokePrior`.

## Phase 2 — Infrastructure

- [ ] Sequelize model `email-verification-token.sequelize.ts` registered in `src/infrastructure/db/models.ts`.
- [ ] `EmailVerificationTokenRepositorySequelize.ts` + `EmailVerificationTokenMapper.ts` mirroring the password-reset pattern.
- [ ] Email template `email-verification.ts` (subject + plain text + HTML).

## Phase 3 — Application

- [ ] `RequestEmailVerification` use case (revoke prior + issue new + send via `EmailSender`).
- [ ] `VerifyEmail` use case (hash + lookup + isUsable + set `users.email_verified_at` + markUsed).
- [ ] `RegisterUser` calls `RequestEmailVerification(newUserId)` after persistence; controller does fire-and-forget.

## Phase 4 — HTTP

- [ ] `POST /api/v1/auth/verify-email` route (public).
- [ ] `POST /api/v1/auth/resend-verification` route (JWT-protected).
- [ ] `emailVerificationEmailRateLimiter` (3/hour) + `emailVerificationIpRateLimiter` (10/hour).
- [ ] `requireVerifiedEmail` middleware created (NOT applied to any existing route).
- [ ] Env: `EMAIL_VERIFICATION_TTL_SEC` (default 86400), `FRONTEND_VERIFY_URL` added to `zodEnv.ts`.
- [ ] `buildAuthFeature` wires repo + use cases.

## Phase 5 — Tests + OpenAPI

- [ ] Unit tests for `RequestEmailVerification`, `VerifyEmail`, and `requireVerifiedEmail` middleware.
- [ ] Integration test `__tests__/integration/api/auth-verify.test.ts`: register → POST verify-email → success → re-use → 400.
- [ ] Integration test for `/resend-verification` rate limits.
- [ ] `npm run docs:openapi:generate`; verify both routes appear.
- [ ] Auth feature kit README at `documents/development/features/auth/README.md` updated to link this kit.

## Wrap-up

- [ ] `npm run typecheck && npm run lint && npm run format:write && npm test`.
- [ ] Audit re-run shows P1-1.2 marked ✅.
- [ ] Update `iteration-plan.md` Phase 3 status to ✅ Done with PR link.
