# OpenAPI & Swagger Documentation Plan – Lakira Backend API

This plan describes how to evolve the current OpenAPI/Swagger setup into a production‑grade, maintainable, and auditable documentation system for the Lakira backend.

It assumes:
- Express.js backend entry at `src/server.ts`.
- Zod + `@asteasolutions/zod-to-openapi` integration in `src/lib/openapi`.
- Existing static OpenAPI JSON at `documents/openapi/lakira-backend-openapi.json`.

---

## 1. High‑Level Goals

1. Align all API documentation to a single source of truth (Zod schemas + `zod-to-openapi`).
2. Ensure OpenAPI 3.1.0 compliant spec, with consistent error & success envelopes.
3. Provide secure, environment‑aware Swagger UI for developers and auditors.
4. Make documentation changes traceable (versioned) and CI‑validated.
5. Keep docs tightly aligned with route/middleware behavior (auth, rate‑limit, validation).

---

## 2. Architecture and Source of Truth

### 2.1 Strategy

- **Primary source of truth**: Zod schemas + path registrations in `src/lib/openapi`:
  - Request/response DTOs live in `src/types/api`.
  - OpenAPI registration lives in:
    - `src/lib/openapi/openapi-config.ts` – base document, tags, shared components.
    - `src/lib/openapi/openapi-schemas.ts` – all Zod entities/DTOs registered with the registry.
    - `src/lib/openapi/openapi-docs.ts` – path definitions using `registry.registerPath` and generator.
- **Generated document**:
  - Swagger UI consumes `getOpenApiDocumentation()` at runtime in `src/server.ts`.
  - For external consumers, CI can export a static JSON (see section 6).
- **Static file** `documents/openapi/lakira-backend-openapi.json`:
  - Treat as a **snapshot artifact**, not the source of truth.
  - Refresh this file only via automated generation from the Zod/registry layer.

### 2.2 Actions

- Confirm that **every public API route** has:
  - A Zod schema defined under `src/types/api/**`.
  - A corresponding `registry.registerPath` call in `src/lib/openapi/openapi-docs.ts` (or sub‑modules).
- Deprecate manual edits to `documents/openapi/lakira-backend-openapi.json`; replace with a CI‑generated copy.

---

## 3. OpenAPI Specification Design

### 3.1 OpenAPI Version and Info

- Use **OpenAPI 3.1.0** (already set in `openapi-config.ts`).
- Extend `info` block:
  - Add `termsOfService`, `contact`, and `license` fields.
  - Add `x-build-hash` and/or `x-api-version` as custom extensions (filled at build time).

### 3.2 Servers

- Keep the base path `/api/v1`, but make it environment aware:
  - Development: `http://localhost:${PORT}/api/v1`
  - Staging/Production: inject via environment variables at generation time.
- Plan: expose an environment‑specific `/api/v1/docs/openapi.json` endpoint that returns the generated spec with the correct server URLs.

### 3.3 Tags and Grouping

- Keep and refine existing tags in `openapi-config.ts`:
  - `Auth`, `Metric Categories`, `Metrics`, `Metric Logs`, `Metric Settings`, `Trends`.
- Add:
  - `Health` for health‑check/status endpoints (if/when added).
  - `Admin` if privileged operations are introduced.

### 3.4 Components: Schemas & Responses

- Centralize common response envelopes:
  - Success envelope (e.g. `SuccessResponse` with `{ status, message, data }`).
  - Error envelope (`ErrorResponse`, `ValidationErrorResponse`), aligned with the actual `error-handler` middleware.
- Confirm that:
  - All `400` responses use `BadRequestError`.
  - All `401` responses use `UnauthorizedError`.
  - All `403` responses use `ForbiddenError` (role/permission failures).
  - All `404` responses use `NotFoundError`.
  - All `500` responses use `InternalServerError`.
- Ensure all domain entities (User, Metric, MetricCategory, MetricLog, MetricSettings, Trend) are defined as Zod schemas and registered as OpenAPI components via `openapi-schemas.ts`.

### 3.5 Security Schemes

- Keep `BearerAuth` (`http` + `bearer` + `JWT`).
- For production readiness:
  - Add a short description specifying header usage: `Authorization: Bearer <token>`.
  - Optionally introduce `ApiKeyAuth` if you add machine‑to‑machine endpoints later.

---

## 4. Keeping Routes, Middleware, and Docs in Sync

### 4.1 Route Coverage Checklist

For each route module:
- `src/routes/auth.routes.ts`
- `src/routes/metric.routes.ts`
- `src/routes/metric-settings.routes.ts`
- `src/routes/metric-log.routes.ts`
- `src/features/metric-category/infrastructure/http/routes.ts`
- `src/features/analytics/presentation/http/visualization.router.ts`

Plan:
- Map each Express route (method + path) to an OpenAPI path object:
  - Confirm that:
    - **Auth paths** (`/auth/register`, `/auth/login`, `/auth/profile`, `/auth/logout`) are documented and aligned with real URLs and HTTP methods.
    - **Metric + MetricCategory + MetricLog + MetricSettings** paths match the domain routes and DDD refactors.
    - **Analytics/Trends** paths (`/analytics/...`, `/trends/{metricId}`) are fully documented with params & query filters.
- For every route:
  - Ensure there is a Zod schema for:
    - `params`, `query`, and `body` (where applicable).
    - Response DTOs (success and error).
  - Ensure there is a matching `registry.registerPath` entry.

### 4.2 Middleware Reflection in Docs

- **Authentication**:
  - Wherever `authMiddleware` is present, include `security: [{ BearerAuth: [] }]` in the OpenAPI path.
- **Rate Limiting**:
  - For routes using `userRateLimiter` or custom limiters, encode:
    - A descriptive note in `summary` or `description`.
    - Optional `429` response component (`TooManyRequestsError`) if implemented.
- **Validation**:
  - The `validate` middleware should align strictly with the Zod schemas used for documentation.
  - Document validation patterns in `openapi-zod-guide.md` and reference them in this plan as the standard for new endpoints.

---

## 5. Swagger UI & API Docs Exposure

### 5.1 Existing Setup

- `src/server.ts` uses:
  - `swagger-ui-express`.
  - `getOpenApiDocumentation()` from `src/lib/openapi/openapi-docs.ts`.
  - Route: `/api/v1/docs`.
  - Optional guard `authMiddleware` based on `env.SWAGGER_REQUIRE_AUTH`.

### 5.2 Enhancements

- **Security for production**:
  - Default `SWAGGER_REQUIRE_AUTH=true` in non‑development environments.
  - Optionally gate behind role‑based checks (e.g., only admins or developers).
- **JSON endpoint**:
  - Add `GET /api/v1/docs/openapi.json` that returns `getOpenApiDocumentation()` as raw JSON for:
    - Frontend codegen.
    - External clients.
    - Postman collection import.
- **Theming and metadata**:
  - Customize Swagger UI title, favicon, and description (optional).

---

## 6. Tooling, Generation, and CI/CD

### 6.1 Local Generation Script

- File exists: `scripts/generate-documentation.ts` (to be leveraged/extended).
- Goal:
  - Implement/ensure this script:
    - Bootstraps the OpenAPI environment (imports `getOpenApiDocumentation`).
    - Generates JSON via `getOpenApiDocumentation()`.
    - Writes to:
      - `documents/openapi/lakira-backend-openapi.json` (snapshot).
      - Optionally another path like `documents/openapi/lakira-backend-openapi-${DATE}.json` for audit history.

### 6.2 NPM Scripts

- Add/update in `package.json`:
  - `docs:openapi:generate`: runs the TS script (via `ts-node` or compiled JS) to regenerate the spec.
  - `docs:openapi:lint`: (optional) uses an OpenAPI linter like `redocly` or `speccy`.
  - `docs:openapi:validate`: run a schema validation against the generated JSON (using `openapi-schema-validator` or similar).

### 6.3 CI/CD Integration

- In CI (GitHub Actions, GitLab CI, etc.):
  - Step `docs-openapi-generate`:
    - Install dependencies.
    - Run `npm run docs:openapi:generate`.
    - Run `npm run docs:openapi:validate`.
  - Optional:
    - Fail the pipeline if the generated JSON differs from the committed one (enforcing updated docs).
    - Publish the JSON artifact to an internal documentation portal or S3 bucket.

---

## 7. Documentation Quality Standards

### 7.1 Endpoint‑Level Requirements

Each OpenAPI path MUST include:
- `summary` and short, clear `description` (where non‑obvious).
- `tags` mapped to the domain/feature.
- `operationId` (optional but recommended) with stable naming convention:
  - Format: `<resource><Action>` (e.g., `metricCreate`, `metricLogGetAll`, `authLogin`).
- `security` matching actual middleware.
- Well‑defined `parameters` for:
  - `path` (with `format` like `uuid` where applicable).
  - `query` (with enums, ranges, defaults, etc.).
- `requestBody`:
  - Schema reference from Zod.
  - Explicit `required` flag when needed.
- `responses`:
  - At minimum: the main success status (200/201/204) plus error responses.
  - Content with schema refs under `components/schemas` or shared envelopes.

### 7.2 Data Modeling Requirements

- All IDs documented as `string` with `format: uuid` when applicable.
- Date/time fields documented as:
  - `format: date-time` for timestamps.
  - `format: date` for date‑only values.
- Enumerations:
  - Use `enum` in schemas.
  - Add `description` explaining semantics for each enum if non‑obvious (e.g., `"cumulative"`, `"incremental"`).
- Nullable fields:
  - Explicitly mark `nullable: true` when applicable.

### 7.3 Error Contract

- Align OpenAPI error schemas with the actual `error-handler` behavior:
  - Include fields like `status`, `message`, `errors`, and optional `code` or `details`.
- Document:
  - Validation errors (Zod) – include per‑field messages.
  - Authentication/authorization failures.
  - Not found.
  - Unexpected internal errors.

---

## 8. Developer Workflow

### 8.1 Adding a New Endpoint

1. Define/extend the Zod schemas under `src/types/api` for:
   - `params`, `query`, `body`, and the response DTO.
2. Register the schemas in `openapi-schemas.ts` using the shared `registry`.
3. Add the Express route in the appropriate router file.
4. Add a corresponding `registry.registerPath` in `openapi-docs.ts` (or a feature‑specific OpenAPI file imported there).
5. Ensure middleware (auth, rate limiting, validation) is reflected in the OpenAPI path (`security`, `responses`, `description`).
6. Run:
   - `npm run docs:openapi:generate`.
   - `npm run docs:openapi:validate`.
7. Commit both code and regenerated OpenAPI JSON snapshot.

### 8.2 Changing an Existing Endpoint

1. Update the Zod schema (request/response) to match the new behavior.
2. Adjust the Express route/middleware as needed.
3. Update `registry.registerPath` (if path, method, or semantics change).
4. Regenerate and validate OpenAPI docs.
5. Communicate breaking changes in a changelog or release notes.

---

## 9. Non‑Functional Considerations

### 9.1 Security & Privacy

- Do not expose internal error details or stack traces via OpenAPI examples.
- Ensure sensitive fields (passwords, tokens) are either:
  - Marked as `writeOnly`.
  - Omitted from response schemas.

### 9.2 Performance & Size

- For list endpoints:
  - Document pagination (`page`, `limit`, `total`) and any server‑side limits.
  - Describe heavy filters or aggregations in `description` and `examples`.

### 9.3 Observability

- Optionally annotate endpoints with custom OpenAPI extensions:
  - `x-metric-key`, `x-rate-limit-group`, etc., to help tie docs to monitoring/alerting.

---

## 10. Documentation Assets and Locations

- OpenAPI generator:
  - `src/lib/openapi/openapi-config.ts`
  - `src/lib/openapi/openapi-schemas.ts`
  - `src/lib/openapi/openapi-docs.ts`
- Swagger UI integration:
  - `src/server.ts` (`/api/v1/docs`).
- Static OpenAPI snapshot:
  - `documents/openapi/lakira-backend-openapi.json` (generated).
- Meta‑documentation:
  - `documents/documentation/openapi-zod-guide.md` – best practices for Zod + OpenAPI.
  - `documents/openapi/openapi-documentation-plan.md` – this plan.

This plan should be kept up to date as the API surface and tooling evolve. When key architectural or security changes are introduced, update this file alongside the implementation and OpenAPI spec changes.

---

## 11. Implementation Status

### 11.1 Completed (Current Cycle)

- OpenAPI generator wired:
  - `scripts/generate-openapi.ts` uses `getOpenApiDocumentation()` and writes to `documents/openapi/lakira-backend-openapi.json`.
  - NPM script `docs:openapi:generate` added and executed successfully.
- Auth route alignment in OpenAPI:
  - `/auth/profile` (GET and PUT) documented to match `src/routes/auth.routes.ts`.
  - `/auth/logout` documented (secured) using the shared success response schema.
- Documentation exposure:
  - Swagger UI available at `/api/v1/docs`.
  - Raw JSON spec available at `/api/v1/docs/openapi.json`, behind the same guards as Swagger UI.
- Local development access:
  - `SWAGGER_REQUIRE_AUTH` can be disabled via `.env.development` to allow unauthenticated docs access during development.

### 11.2 Next Cycle – TODO

- Route coverage audit:
  - For each router (`auth`, `metrics`, `metric-settings`, `metric-logs`, metric-category feature, analytics/visualization), confirm every route has:
    - A matching `registry.registerPath` entry.
    - Correct request/response schemas aligned with actual payloads.
- Documentation quality improvements:
  - Refine `summary`/`description` for key endpoints (auth, metrics, analytics).
  - Add representative request/response examples, including standard error responses.
- CI/CD safeguards for documentation:
  - Add a CI job that runs `npm run docs:openapi:generate` and fails if the generated JSON differs from the committed `documents/openapi/lakira-backend-openapi.json`.
  - Optionally add an OpenAPI validation/lint step.
- Optional client/codegen integration:
  - Use the `/api/v1/docs/openapi.json` endpoint as input for TypeScript client generation (e.g., `openapi-typescript`, `orval`) for frontend or other consumers.

