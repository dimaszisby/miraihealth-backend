# Lakira Backend Product Requirements Document (PRD)

**Status:** Active
**Last updated:** 2026-04-13
**Scope:** Lakira backend API only (`/api/v1`)
**Review cadence:** Contract-change driven + 4-week drift sweep

## 1. Purpose

This PRD defines the backend product baseline as implemented in code today. It is intentionally "as-built" first, with non-implemented themes captured as explicit gaps.

Audience:

- Backend engineers
- Frontend engineers integrating with Lakira APIs
- QA and contract-test maintainers
- CI/CD maintainers

## 2. Product Intent

Lakira backend provides authenticated APIs for:

- Identity and profile management
- Metric categories
- Metrics
- Metric settings and goal state
- Metric logs and aggregate stats
- Analytics visualizations (dashboard and per-metric)

Service stack: Node.js + Express + TypeScript, PostgreSQL persistence, optional Redis-backed cache/rate-limit storage, Zod validation, and OpenAPI docs.

## 3. Source of Truth and Precedence

Normative artifacts:

- Routers: `src/features/*/infrastructure/http/router.ts`, `src/server.ts`
- Validation: `src/features/*/infrastructure/http/schema.zod.ts` and analytics validators
- Domain/persistence logic: `src/features/**`, models, migrations
- OpenAPI artifact: `documents/openapi/lakira-backend-openapi.json`
- Contract/integration test docs: `documents/tests/**`

Conflict rule: runtime behavior in code is authoritative; docs must be updated to match.

## 4. Scope Boundaries

In scope:

- REST endpoints under `/api/v1`
- JWT-protected business routes
- Cursor-based list APIs and domain filters
- API docs surfaces (`/api/v1/docs`, `/api/v1/docs/openapi.json`)
- Health surface (`/api/v1/health`)

Out of scope:

- Frontend UX/UI specification
- Native/mobile product requirements
- Commercial/legal policy implementation details unless represented by backend API behavior

## 5. Functional Requirements (As-Built)

### 5.1 Common API Rules

- Base path: `/api/v1`
- Protected routes require `Authorization: Bearer <jwt>`
- JSON request bodies for body endpoints
- Unsupported methods on known routes return `405`
- Dummy endpoints are gated by `ENABLE_DUMMY_ENDPOINTS`

### 5.2 Domain Requirements by Route Group

| Domain            | Prefix                                   | Implemented endpoints                                                                                     | Key requirements                                                                                                                                                                                                                                                             |
| ----------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth              | `/auth`                                  | `POST /register`, `POST /login`, `GET /profile`, `PUT /profile`, `POST /logout`                           | Register requires `username/email/password/passwordConfirmation`; password confirmation must match; password is bcrypt-hashed; JWT issued on register/login (current token provider default: 7d); logout is acknowledgement (no revocation list).                            |
| Metric Categories | `/metric-categories`                     | `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, optional `POST /dummy`                          | User-owned resource with `name/color/icon`; list supports cursor pagination/search/filter; duplicate names blocked per user (case-insensitive active-scope uniqueness strategy).                                                                                             |
| Metrics           | `/metrics`                               | `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `GET /:metricId/trends`, optional `POST /dummy` | User-owned metric with `categoryId/originalMetricId/name/description/defaultUnit/isPublic`; default settings created transactionally on metric create; per-user name uniqueness; optional ownership checks on linked category/original metric; detail supports `include=flat | full                                                                                                                                                                                               | settings,category,logs`+`logsLimit`. |
| Metric Settings   | `/metric-settings`                       | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/achieve`, `PATCH /:id/display`      | One settings row per metric; if `goalEnabled=true`, `goalType` and `goalValue` required; if `timeFrameEnabled=true`, `startDate` and `deadlineDate` required and `deadlineDate > startDate`; display options patch requires at least one field.                              |
| Metric Logs       | `/metric-logs`                           | `GET /`, `GET /stats`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, optional `POST /:metricId/dummy`  | Create requires `metricId`, `type` (`manual                                                                                                                                                                                                                                  | automatic`), `logValue`; duplicate (`metric_id`, `logged_at`) prevented; `GET /:id`requires`metricId`query for scoped ownership validation;`/stats` returns aggregate stats with optional filters. |
| Analytics         | `/analytics`                             | `GET /dashboard`, `GET /metrics/:metricId`                                                                | Auth required; analytics-specific rate limiter applied; supports `bucket(1h/1d/1w/1m/1y)`, `tz` (IANA), `fill(none/zero/nan)`, and either `last=<Nh                                                                                                                          | d                                                                                                                                                                                                  | w                                    | m   | y>`or`start+end`; when omitted, range defaults to `last=30d`; range-size guard prevents excessive bucket counts; dashboard includes active settings intended for dashboard display; cache + ETag semantics apply. |
| Platform          | `/health`, `/docs`, `/docs/openapi.json` | `GET /api/v1/health`, `GET /api/v1/docs`, `GET /api/v1/docs/openapi.json`                                 | Health returns service/environment/timestamp; docs routes may require auth via `SWAGGER_REQUIRE_AUTH`.                                                                                                                                                                       |

## 6. Data Model Requirements

Core tables:

- `users`
- `metric_categories`
- `metrics`
- `metric_settings`
- `metric_logs`

Core enums:

- `enum_users_role`: `user`, `admin`
- `enum_metric_settings_goal_type`: `cumulative`, `incremental`
- `enum_metric_log_type`: `manual`, `automatic`

Key relational and constraint requirements:

- User owns categories, metrics, and logs.
- Metric optionally references category and original metric (`SET NULL` semantics on delete).
- Metric has one settings row (`metric_id` uniqueness).
- Metric logs enforce unique (`metric_id`, `logged_at`).
- Per-user uniqueness constraints exist for active metric/category naming.
- Soft-delete patterns (`deleted_at`) are used for selected entities.

## 7. Non-Functional Requirements (As-Built)

Security baseline:

- JWT auth on protected routes
- Bcrypt password hashing
- `helmet`, `xss-clean`, `hpp`, and TRACE disallow guard
- Zod validation across body/query/params

Reliability and error handling:

- Central error middleware with typed `AppError` conventions
- Deterministic 400 behavior for malformed JSON body inputs
- Graceful shutdown closes HTTP server, DB, and Redis connections

Performance and caching:

- Cursor/list endpoints enforce bounded query params
- Optional Redis cache usage for selected GET routes
- Optional Redis-backed rate-limit store with fallback behavior
- Analytics invalidation is triggered on metric-log mutations

Configuration controls:

- Env validation via Zod schema
- Feature toggles include `ENABLE_DUMMY_ENDPOINTS`, `SWAGGER_REQUIRE_AUTH`, `DISABLE_RATE_LIMITING`, `ENABLE_REDIS_INTEGRATION`

## 8. Operational Readiness

Release-gate expectations:

- Lint + typecheck pass
- Unit and integration tests pass
- OpenAPI consistency check (`docs:openapi:check`) passes
- Contract-test stages are green for target environment

Contract governance:

- Any API behavior change must update route/schema code, OpenAPI artifact, tests, and this PRD together.

## 9. Known Gaps (Not Yet Productized)

Product capability gaps:

- Reminder scheduling and delivery APIs
- Public profile discovery/social APIs
- First-class metric adoption marketplace/discovery APIs
- End-to-end compliance APIs (for example DSAR/export/delete workflows)

Engineering hardening gaps:

- Formalized SLO/SLI objectives and alert thresholds as enforceable repo gates
- Token revocation/session invalidation mechanism
- Further standardization of response envelope consistency

## 10. Change Management

- Update this PRD in the same change set as contract-affecting backend changes.
- Keep `lakira-backend-prd-outline.md` synchronized with this baseline.
- Keep frontend product requirements in frontend docs; do not duplicate UI detail here.
- If no content changes during a drift sweep, record review evidence in PR/commit context.
