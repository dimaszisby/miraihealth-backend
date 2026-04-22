# Security

## Global Middleware Stack

Applied in order on every request:

1. `helmet()` — secure HTTP headers
2. `xss-clean` — sanitize request payloads
3. `hpp()` — prevent HTTP parameter pollution
4. `disallowTraceMethod` — blocks TRACE requests
5. Rate limiters (global, user, analytics)

## Rate Limiting

- **Global**: 100 req / 15 min (IP-based)
- **User**: 50 req / 15 min (user ID or IP fallback)
- **Analytics**: 30 req / 1 min (user ID or IP fallback)
- Store: Redis in production, in-memory fallback in dev/test
- `DISABLE_RATE_LIMITING=true` disables all limiters (test/fuzzing only)

## Authentication Flow

1. Client sends `Authorization: Bearer <JWT>` header
2. `authMiddleware` validates token via `TokenProvider` port
3. Loads user from `UserRepository`, sets `req.user`
4. Protected routes use `assertAuthenticated(req)` to narrow type

## Sensitive Data Handling

- Env vars matching `/(password|secret|token|key|certificate|url)$/i` are masked as `***REDACTED***` in logs
- Never log passwords, tokens, or PII
- Passwords hashed with bcrypt via `PasswordHasher` port

## Security CI Pipeline

- `npm run test:unit:security-framework` — framework validation tests
- `npm run security:delta:check` — dependency vulnerability delta analysis
- `npm run security:gate:evaluate` — soft gate (uploads artifacts, doesn't block)
- Security audit docs: `documents/security/`
- Release SOP: `documents/security/guides/security-release-delta-sop.md`
