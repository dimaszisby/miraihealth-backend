# JWT Overhaul Checklist

## Phase A – Foundations
- [ ] Remove committed secrets from `.env.development`, `.env.test`, `.env.staging`, `.env.production`; replace with `.env.example` (placeholders only).
- [ ] Add secret-scanning tool (e.g., `gitleaks`) to CI and pre-commit hooks with allowlists for intentional patterns.
- [ ] Create `src/config/jwtConfig.ts` exposing validated settings (secret(s), issuer, audience, algorithm, TTLs, clock skew).
- [ ] Update `tokenGenerator`, `JwtTokenProvider`, and `authMiddleware` to consume the centralized config module.

## Phase B – Token Semantics
- [ ] Configure `jwt.sign` / `jwt.verify` with explicit `algorithm`, `issuer`, `audience`, and `subject`.
- [ ] Adjust lifetimes (short-lived access token + optional refresh token) and document policy.
- [ ] Implement refresh-token store (DB/Redis) with rotation & revocation handling if product scope allows.
- [ ] Add structured logging + metrics for token issuance, verification failures, and refresh operations.

## Phase C – Rotation & Operations
- [ ] Extend config to support multiple secrets / key IDs; emit `kid` in tokens.
- [ ] Implement key-rotation flow (load active + next keys, verify by `kid`, document runbook).
- [ ] Evaluate migration to asymmetric signing (RS256/ES256) and optional JWKS endpoint.
- [ ] Update GitHub Actions workflow to provision secrets via environment/organization secrets and fail fast if missing.
- [ ] Add automated tests covering missing secret behavior, invalid claims, rotation, and refresh logic.
- [ ] Create monitoring + alerting rules for repeated token failures or suspicious refresh attempts.
