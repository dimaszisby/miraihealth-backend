# JWT Handling Overhaul Plan

## 1. Context and Goals
The Lakira backend protects every authenticated endpoint with JSON Web Tokens (JWT). Tokens are generated inside the auth feature (`src/utils/token-generator.ts`, `src/features/auth/infrastructure/providers/JwtTokenProvider.ts`) and verified by the shared middleware (`src/features/auth/infrastructure/http/authMiddleware.ts`). Environment variables are validated via `src/config/zodEnv.ts`. We need a production-ready plan that:
- Removes hard-coded secrets from the repository and enforces centralized configuration.
- Hardens signing and verification to align with zero-trust expectations (secure algorithms, rotation, metrics, testing).
- Establishes clear operational practices for issuing, rotating, and revoking tokens through CI/CD and runtime automation.

## 2. Current-State Analysis
| Area | Observations | Risk |
| --- | --- | --- |
| Secret sourcing | Code consistently reads `env.JWT_SECRET`. Zod schema throws at boot if the secret is missing. ✔️ | Low |
| Secret storage | Realistic looking secrets are committed under `.env.development` / `.env.test`. No `.env.example` pattern. | High: repo leakage, cannot prove unique-per-environment secrets. |
| Signing implementation | `tokenGenerator` and `JwtTokenProvider` sign payload `{ id, email }` with `expiresIn: "7d"` but omit explicit `algorithm`. JSON Web Token defaults to HS256. No issuer/audience/subject claims. | Medium: defaults can drift, harder to audit, long token lifetime. |
| Verification | Middleware calls `jwt.verify` with a single shared secret. No grace period or JWKS support, no clock skew tolerance, error responses are generic 401. | Medium: rotation downtime, limited observability. |
| Configuration surface | Only one secret value exists. No support for key versioning or per-environment overrides beyond `.env`. | Medium: rotation requires redeployment and invalidates all tokens instantly. |
| Observability & logging | No structured logging around token failures/suspicious activity. | Medium: harder to detect brute force or replay. |
| Tests / CI | Unit tests mock JWT signing but there is no automated check ensuring `JWT_SECRET` is provided in CI pipelines (depends on manual GitHub Actions config). No secret scanning check for committed secrets. | Medium |

## 3. Target State
1. **Secret Hygiene**: No committed secrets. `.env.example` documents placeholders; real values live in secrets managers (GitHub Actions secrets, Vault, AWS Secrets Manager). Automated scanning blocks accidental commits.
2. **Config + Validation**: Dedicated `jwt` config module derived from validated env (secret(s), issuer, audience, algorithm, expiry, clock skew). Startup fails fast if misconfigured.
3. **Key Rotation Support**: Support multiple active secrets (key IDs) to allow staged rotation. Prefer asymmetric algorithms (RS256 / ES256) managed via JWKS to avoid sharing symmetric keys across services.
4. **Improved Token Semantics**: Explicit `iss`, `aud`, `sub`, `iat`, `exp` claims. Configurable lifetimes (access vs refresh). Short-lived access tokens (e.g., 15m) plus optional refresh token strategy.
5. **Observability and Security Controls**: Central logging for auth failures, metrics on token issuance/denials, rate limiting on login, optional IP/user agent binding.
6. **CI/CD Integration**: Pipelines provision secrets securely and run automated guards (secret scanning, env validation tests). Deployment docs describe how to rotate keys without downtime.

## 4. Overhaul Plan

### Phase A – Foundations (Week 1)
1. **Secret Scrub + Policy**
   - Remove committed secrets from `.env.*`. Introduce `.env.example` with placeholders and documentation.
   - Add commit-time/CI secret scanners (e.g., `gitleaks` or `trufflehog`) to prevent regressions.
2. **Central JWT Config Module**
   - Create `src/config/jwtConfig.ts` to surface validated settings (algorithm, issuer, lifetimes, allowed audiences).
   - Update token generator and middleware to import from the config module instead of sprinkling literals.

### Phase B – Token Semantics (Week 2)
1. **Explicit Algorithms + Claims**
   - Update signing to include `issuer`, `audience`, `subject` and enforce `algorithm` option for both `sign` and `verify`.
   - Shorten access-token TTL (e.g., 15 minutes) and introduce refresh tokens with rotation + revocation table if product requirements allow.
2. **Error Handling + Logging**
   - Add structured logs (with redaction) around token failures, include reason codes, and expose metrics (e.g., via Prometheus counters).

### Phase C – Rotation and Operational Hardening (Week 3+)
1. **Key Rotation Mechanism**
   - Support multiple secrets via `kid` header. Consider migrating to asymmetric keys with JWKS endpoint, enabling zero-downtime rotation and limited blast radius.
   - Document rotation runbooks (generate keys, update secret manager, redeploy).
2. **CI/CD & Testing Enhancements**
   - Update GitHub Actions workflow to require `JWT_SECRET` (and future key sets) via environment secrets.
   - Add integration tests ensuring APIs fail fast without secrets and accept/reject tokens according to the new claims policy.
3. **Operational Guardrails**
   - Add alerting when repeated invalid tokens occur.
   - Document incident response for suspected key compromise (revoke tokens, rotate keys, invalidate refresh tokens).

## 5. Deliverables
- Clean `.env` hygiene + documentation.
- Configurable JWT module with multi-key support.
- Revised token issuance & middleware with explicit claims, logging, and observability.
- CI/CD workflows provisioning secrets securely and enforcing validation.
- Runbooks for rotation and incident management.

## 6. Success Metrics
- ✅ No committed secrets detected by automated scanners.
- ✅ Token lifetime and claims align with documented policy.
- ✅ Rotation can occur without downtime, verified via staging exercise.
- ✅ Auth-related alerts and dashboards exist for failed verifications and unusual activity.
