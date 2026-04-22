# Lakira Backend Product Requirements Document (PRD)

**Status:** Active
**Last updated:** 2026-03-12
**Review cadence:** Event-based (contract changes) + every 4 weeks (drift sweep)
**Scope:** Lakira backend API (`/api/v1`) only

## 1. Purpose

This PRD defines the current, implemented product requirements for the Lakira backend service and separates known production-hardening gaps. It replaces the legacy blueprint-based PRD and uses the running codebase as the source of truth.

This document is intended for:

- Backend engineers
- Frontend engineers integrating with Lakira API
- QA and contract-test maintainers
- CI/CD and release maintainers

## 2. Product Intent

Lakira backend provides authenticated APIs for:

- User identity and profile management
- Metric category management
- Metric library management
- Metric settings and goal state management
- Metric logging and statistics
- Analytics visualizations for dashboards and per-metric charts

The backend is a Node.js + Express + TypeScript service with PostgreSQL persistence, Redis-backed caching/rate-limiter stores (when enabled), Zod validation, and OpenAPI documentation.

## 3. Source of Truth and Normative Artifacts

Requirements in this PRD are derived from, and must stay aligned with:

- Route contracts in `src/features/*/infrastructure/http/router.ts` and `src/server.ts`
- Request validation in `src/features/*/infrastructure/http/schema.zod.ts` and analytics validators
- Domain and persistence behavior in `src/features/**`, Sequelize models, and migrations
- OpenAPI artifact at `documents/openapi/lakira-backend-openapi.json`
- Integration and contract tests in `__tests__/integration/**` and `documents/tests/**`

If this PRD conflicts with runtime behavior, runtime behavior wins and this PRD must be updated.

## 4. Users and Primary Jobs

### 4.1 Actors

- Authenticated end-user: manages personal metrics, goals, logs, and visualizations.
- Frontend client application: consumes backend APIs with JWT authentication.
- Internal maintainer: operates docs, tests, CI/CD, and deployment.

### 4.2 Core Jobs To Be Done

- Register/login and manage own profile.
- Organize metrics with categories.
- Track metrics over time through logs.
- Configure metric goals and dashboard display options.
- View trend and dashboard visualizations.

## 5. Scope Boundaries

### 5.1 In Scope (Current Backend Product)

- REST API under `/api/v1`
- JWT auth and protected route access
- Cursor-based list APIs with filters/sorting
- Metric settings lifecycle and goal-achievement updates
- Metric log CRUD, duplicate timestamp prevention, and stats
- Analytics dashboard/per-metric visualization endpoints
- OpenAPI/Swagger docs endpoint and raw OpenAPI JSON endpoint
- Health endpoint

### 5.2 Out of Scope (This Backend PRD)

- Frontend UX/UI requirements
- Mobile app requirements
- Pricing/billing/legal product policy implementation
- Social graph/community features not currently exposed by backend routes

## 6. Functional Requirements (As-Built)

### 6.1 Common API Contract Rules

- Base path: `/api/v1`
- Content type for body endpoints: JSON object payloads only
- Protected routes require `Authorization: Bearer <jwt>`
- Success envelope (typical): `status=success`, `message`, `data`
- Validation failures: `status=fail` with structured `errors[]`
- Unsupported methods on known routes: `405 Method Not Allowed`

### 6.2 Auth Domain (`/api/v1/auth`)

Implemented endpoints:

- `POST /register`
- `POST /login`
- `GET /profile`
- `PUT /profile`
- `POST /logout`

Requirements:

- Register requires `username`, `email`, `password`, `passwordConfirmation` and enforces password confirmation match.
- Login requires `email` and `password`.
- Passwords are bcrypt-hashed before persistence.
- JWT tokens are issued on register/login and currently expire in 7 days.
- Profile update allows `username`, `email`, `password`, `isPublicProfile` updates.
- Role escalation through profile update is not permitted by API validation/behavior.
- Logout is logical/API-level acknowledgement; token revocation list is not implemented.

### 6.3 Metric Category Domain (`/api/v1/metric-categories`)

Implemented endpoints:

- `POST /`
- `GET /`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`
- `POST /dummy` (only when `ENABLE_DUMMY_ENDPOINTS=true`)

Requirements:

- Categories are user-owned resources.
- Fields: `name`, `color`, `icon`.
- Cursor list supports `limit`, `sort`, `q`, `after`, `includeTotal`, and name filter variants.
- Duplicate category names are blocked per user (case-insensitive uniqueness via index strategy).

### 6.4 Metric Domain (`/api/v1/metrics`)

Implemented endpoints:

- `POST /`
- `GET /`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`
- `GET /:metricId/trends`
- `POST /dummy` (only when `ENABLE_DUMMY_ENDPOINTS=true`)

Requirements:

- Metrics are user-owned resources with fields:
  `categoryId`, `originalMetricId`, `name`, `description`, `defaultUnit`, `isPublic`.
- On metric creation, default metric settings are auto-created transactionally.
- Name uniqueness is enforced per user (case-insensitive).
- `categoryId` must reference an owned category when provided.
- `originalMetricId` must reference an owned metric when provided.
- Cursor list supports `limit`, `sort`, `q`, `after`, `includeTotal`, and filter object/query-key variants.
- Detail endpoint supports include modes:
  `flat`, `full`, or CSV subset (`settings,category,logs`) with `logsLimit`.
- Trend endpoint currently returns recent trend points from metric logs (default last 30 days behavior in query service).

### 6.5 Metric Settings Domain (`/api/v1/metric-settings`)

Implemented endpoints:

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`
- `PATCH /:id/achieve`
- `PATCH /:id/display`

Requirements:

- One settings record per metric (unique by `metric_id`).
- Goal invariants:
  - if `goalEnabled=true`, `goalType` and `goalValue` are required.
- Time-frame invariants:
  - if `timeFrameEnabled=true`, `startDate` and `deadlineDate` are required.
  - `deadlineDate` must be after `startDate`.
- Display options support updates for `showOnDashboard`, `priority`, `chartType`, `color`.
- Cursor list supports `limit`, `sort`, `after`, `includeTotal`, and filter by `metricId`/`isActive`.

### 6.6 Metric Log Domain (`/api/v1/metric-logs`)

Implemented endpoints:

- `GET /`
- `GET /stats`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`
- `POST /:metricId/dummy` (only when `ENABLE_DUMMY_ENDPOINTS=true`)

Requirements:

- Log create requires explicit `type` (`manual` or `automatic`), `metricId`, `logValue`.
- Duplicate logs for the same `metric_id` + `logged_at` are prevented.
- Cursor list supports `limit`, `sort`, `q`, `after`, `includeTotal`, and filter by `metricId`/`logValue`.
- `GET /:id` additionally requires `metricId` query input for ownership/context validation.
- `GET /stats` returns average/min/max and supports optional metric scope.

### 6.7 Analytics Domain (`/api/v1/analytics`)

Implemented endpoints:

- `GET /dashboard`
- `GET /metrics/:metricId`

Requirements:

- Auth is required; analytics-specific rate limiter is applied.
- Supported query concepts:
  - `bucket`: `1h`, `1d`, `1w`, `1m`, `1y`
  - `tz`: IANA timezone (default from env, typically `Asia/Jakarta`)
  - `fill`: `none`, `zero`, `nan`
  - Range via either `last=<Nh|d|w|m|y>` or `start`+`end`
- If range is omitted, validator resolves to a default relative window (`last=30d`).
- Range size is guarded against excessive bucket counts.
- Dashboard only includes active settings where `displayOptions.showOnDashboard=true`.
- ETag and cache-control semantics are used for visualization responses.
- Analytics cache invalidates when metric logs mutate.

### 6.8 Platform Utility Surfaces

Implemented endpoints:

- `GET /api/v1/health`
- `GET /api/v1/docs`
- `GET /api/v1/docs/openapi.json`

Requirements:

- Health endpoint returns service status metadata.
- Swagger and raw OpenAPI JSON routes are available.
- Docs routes can be auth-protected depending on `SWAGGER_REQUIRE_AUTH`.

## 7. Data Model Requirements

### 7.1 Tables and Enums

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

### 7.2 Key Relational Rules

- User owns many metrics and categories.
- Category belongs to user; metric may reference category (`SET NULL` on delete).
- Metric may reference original metric (`SET NULL` on delete).
- Metric has one settings record.
- Metric has many logs.
- Soft delete is used for several entities (`deleted_at` patterns).

### 7.3 Key Constraints and Indexing Expectations

- Unique user email and username.
- Unique metric name per user (case-insensitive active scope).
- Unique category name per user (case-insensitive active scope).
- Unique metric settings per metric.
- Unique metric-log timestamp per metric (`metric_id`, `logged_at`).
- Performance indexes exist for cursor/sort/filter-heavy query paths.
- `metrics.description` has been migrated to `TEXT`.

## 8. Non-Functional Requirements (As-Built)

### 8.1 Security Baseline

- JWT auth on protected routes.
- Bcrypt password hashing.
- Middleware hardening: `helmet`, `xss-clean`, `hpp`.
- TRACE is explicitly disallowed (method guard).
- Request body JSON parse errors return deterministic 400 payloads.
- Validation via Zod across params/query/body.

### 8.2 Reliability and Error Handling

- Central error middleware normalizes operational errors.
- App-level errors use typed `AppError` with status semantics (`fail` vs `error`).
- Graceful shutdown path closes HTTP server, DB, and Redis connections.

### 8.3 Performance and Caching

- Redis-backed cache middleware is used on selected GET routes.
- Redis-backed rate-limit store is used when available.
- Fallback to in-memory rate-limit store when Redis is optional and unavailable.
- Analytics and cursor endpoints use bounded query parameters.

### 8.4 Configurability and Environment

- Typed env validation via Zod.
- Multi-environment DB URL/credential normalization.
- Feature toggles include:
  - `ENABLE_DUMMY_ENDPOINTS`
  - `SWAGGER_REQUIRE_AUTH`
  - `DISABLE_RATE_LIMITING`
  - `ENABLE_REDIS_INTEGRATION`

## 9. Operational Readiness

### 9.1 CI/CD and Release Gate Expectations

Primary CI expectations:

- lint
- typecheck
- unit tests
- integration tests
- OpenAPI consistency check (`docs:openapi:check`)
- local/staging contract test stages

Staging pipeline includes deployment + contract validation and is documented under `documents/ci-cd/backend/`.

### 9.2 API Contract Governance

- OpenAPI spec must stay synchronized with route + schema code.
- Contract-test suites (Postman/Newman and Schemathesis) validate externally visible behavior.
- Any API behavior change requires coordinated updates to code, tests, OpenAPI artifact, and PRD.

## 10. Acceptance Criteria for This Backend Product Baseline

A release-quality backend documentation baseline is considered met when:

- Each documented endpoint exists in active routers.
- Documented request/query constraints align with active Zod schemas.
- Documented table/constraint behavior aligns with Sequelize models + migrations.
- Non-functional behavior reflects active middleware and env configuration.
- Features not implemented as first-class backend capabilities are explicitly documented as gaps, not implied as shipped.

## 11. Production-Hardening Gaps and Backlog Mapping

The following legacy PRD themes are not currently productized as backend capabilities and are tracked as gaps:

### 11.1 Product Capability Gaps

- Smart reminders/notifications: no reminder scheduler or notification delivery subsystem.
- Public profile discovery/social sharing: profile visibility field exists, but public profile browsing and social APIs are not exposed.
- Metric adoption marketplace/library UX flow: `originalMetricId` exists, but no dedicated cross-user adoption discovery API surface is shipped.
- Formal legal/compliance execution (GDPR workflows, consent/audit APIs): policy/process docs may exist, but backend APIs for full compliance operations are not yet defined as product requirements.

### 11.2 Engineering Hardening Gaps

- Explicit SLO/SLI instrumentation and alerting thresholds are not formalized in this repo as enforceable runtime gates.
- Token revocation/session invalidation mechanism is not implemented (logout is logical acknowledgement).
- Error envelope uniformity is partially mixed (`success` envelope helper vs direct middleware responses) and can be standardized further.

### 11.3 Backlog Direction (Non-Implementation)

Recommended backlog epics:

- EPIC-BE-REMINDERS: reminder scheduling and delivery APIs
- EPIC-BE-PUBLIC-PROFILES: public profile read model and privacy-safe queries
- EPIC-BE-METRIC-ADOPTION: curated discover/adopt APIs using `originalMetricId`
- EPIC-BE-COMPLIANCE: DSAR/delete/export/auditability APIs
- EPIC-BE-OBS-SLO: service-level objectives and runtime observability gates

## 12. Success Metrics for Documentation Quality

This PRD refresh is successful when:

- No placeholder/TBD sections remain in backend PRD/outline.
- Backend and QA teams can map every major API behavior from PRD to a concrete code path.
- Frontend integration confusion from legacy endpoint blueprints is removed.
- Future feature planning can start from explicit "as-built vs gap" separation.

## 13. Change Management

- Update this PRD in the same change set as significant API/domain contract changes.
- Keep `lakira-backend-prd-outline.md` synchronized as the template for future revisions.
- Do not duplicate frontend-specific requirements in this backend PRD.
- Review cadence workflow:
  - Event-based (required): review and update this PRD when changing backend contract files (routes, request schemas, models/migrations, auth behavior, OpenAPI sources/artifacts).
  - Time-based (required): run a 15-30 minute documentation drift sweep at least every 4 weeks, even with no feature releases.
  - Completion rule: if content changes, update `Last updated`; if no content changes, keep the content and optionally record a `Reviewed on YYYY-MM-DD (no changes)` note in PR/commit context.
