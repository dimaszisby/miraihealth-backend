# JWT Kit — Decisions Log

ADR-style entries scoped to the JWT kit. Cross-kit decisions live in `docs/development/architecture/saas-readiness/decisions.md` (e.g., ADR-005 phase order).

---

## ADR-001 — Refresh-token storage and rotation strategy (Proposed 2026-05-02)

**Context:** Audit gap [P0-1.1] requires a refresh-token flow. The current state is a 7-day non-rotating bearer JWT with a no-op logout. We need to decide where refresh tokens live, how rotation is detected, and how revocation cascades.

**Decision (proposed):**

1. **Persistence:** PostgreSQL table `refresh_tokens` with columns `id (UUID PK)`, `user_id (FK users)`, `family_id (UUID, NOT NULL)`, `token_hash (varchar 64, sha256 of the raw token, UNIQUE)`, `issued_at`, `expires_at`, `revoked_at NULL`, `replaced_by_id (FK self, nullable)`, `user_agent`, `ip`. Indexed on `(user_id, revoked_at)` and on `family_id`.
2. **Format on the wire:** opaque random `base64url(crypto.randomBytes(64))` — NOT a JWT. Reasons: (a) we never need to inspect the refresh token without a DB hit anyway, (b) revocation is immediate and database-authoritative, (c) keeps the JWT layer scoped to short-lived access tokens.
3. **Delivery:** HttpOnly + Secure + SameSite=Lax cookie named `lakira_refresh`. Path `/api/v1/auth/refresh`. Lifetime: 30 days (configurable via `REFRESH_TOKEN_TTL_DAYS`).
4. **Rotation:** every successful `/auth/refresh` revokes the presented token (`revoked_at = now()`, `replaced_by_id = newId`) and issues a new pair. The new refresh inherits the `family_id`.
5. **Reuse detection:** if a refresh token presented to `/auth/refresh` has `revoked_at IS NOT NULL`, treat as theft → revoke the **entire family** (UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL) and respond 401. Logged as `auth.refresh.reuse_detected`.
6. **Logout:** `POST /auth/logout` revokes the family of the presented refresh token (or the refresh token resolvable from the cookie).
7. **Access-token TTL** drops from 7 days to 15 minutes once refresh tokens land.

**Status:** Accepted (implemented 2026-05-05).

**Options considered:**

- _Refresh tokens as JWTs._ Rejected: (a) revocation requires a denylist anyway, so the self-contained property is wasted; (b) JWT structure leaks claims that the client need not see.
- _Redis-only storage._ Rejected: refresh tokens are durable user state, not session cache; losing Redis losing logins is unacceptable.
- _No family-ID; revoke single token on reuse._ Rejected: a stolen refresh token + a legitimate refresh in flight produces a race where the attacker keeps a valid chain. Family-revoke kicks both out.
- _Bearer header instead of cookie._ Considered. Cookie wins for browsers (HttpOnly defeats XSS-leak); for API-only clients the same endpoint can accept `Authorization: Bearer <refresh>` as a fallback. Decision: cookie primary, header fallback.

**Consequences:**

- One new migration: `YYYYMMDDHHMMSS-create-refresh-tokens.cjs` with a working `down`.
- New ports/adapters: `RefreshTokenRepository`, `RefreshTokenRepositorySequelize`, `RefreshTokenMapper`.
- New use cases: `IssueRefreshToken`, `RotateRefreshToken`, `RevokeRefreshTokenFamily`. Existing `LoginUser` use case grows to also call `IssueRefreshToken`.
- `cookie-parser` becomes a real dependency (not currently installed; `package.json` deps inspected during audit).
- `authMiddleware` itself does not change for refresh — it still validates access tokens. The `/auth/refresh` route is unauthenticated (the cookie is the auth).

**Links:**

- `audit-2026-05-01.md` § [P0-1.1] in `docs/development/architecture/saas-readiness/`
- `src/features/shared/auth/application/ports/TokenProvider.ts` (port to extend)
- `src/features/shared/auth/infrastructure/providers/JwtTokenProvider.ts` (adapter to extend)

---

## ADR-002 — Move JWT verification through the `TokenProvider` port (Proposed 2026-05-02)

**Context:** Audit gap [P1-10.3]: `src/features/shared/auth/infrastructure/http/authMiddleware.ts:42` calls `jwt.verify(token, env.JWT_SECRET)` directly with a top-level `import jwt from "jsonwebtoken"`. The `TokenProvider` port exposes only `sign()`, so verification bypasses the hexagonal boundary.

**Decision (proposed):**

1. Extend the `TokenProvider` port:
   ```ts
   verify(token: string): Promise<TokenClaims>;
   ```
   where `TokenClaims = { userId: string; email: string; iat: number; exp: number; kid?: string }`.
2. Implement in `JwtTokenProvider.verify()` using `jsonwebtoken.verify`. Throw a domain-level `InvalidTokenError extends AppError` (status 401) on any failure.
3. Inject `TokenProvider` into `authMiddleware` via a factory (`makeAuthMiddleware(tokenProvider, userRepository)`). Replace the inline `jwt.verify` call with `await tokenProvider.verify(token)`.
4. Wire `tokenProvider` from `buildAuthFeature()` in `src/features/shared/auth/feature.ts`. Remove the `import jwt from "jsonwebtoken"` from `authMiddleware.ts`.
5. Unit-test `JwtTokenProvider.verify` directly. Update existing `authMiddleware` tests to mock the port instead of `jsonwebtoken`.

**Status:** Accepted (implemented 2026-05-05). Pairs with ADR-001 — both ship in the same PR.

**Options considered:**

- _Leave the leak; document it as accepted technical debt._ Rejected: the audit specifically called this out as a hexagonal-violation example; future forkers should see the canonical pattern.
- _Add a separate `TokenVerifier` port._ Rejected: signing and verifying belong together; splitting the port creates two adapters with the same JWT secret.

**Consequences:**

- `authMiddleware` becomes a factory rather than a top-level export. Update import sites in feature routers.
- The change is invisible to callers — same 401 behavior, same response body. No OpenAPI delta.
- Forkers can swap `JwtTokenProvider` for a Paseto/Branca adapter by changing one file.

**Links:**

- `audit-2026-05-01.md` § [P1-10.3] in `docs/development/architecture/saas-readiness/`
- `src/features/shared/auth/infrastructure/http/authMiddleware.ts:3,42`
- `src/features/shared/auth/application/ports/TokenProvider.ts`
