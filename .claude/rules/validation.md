---
paths:
  - "src/**/*schema*.ts"
  - "src/constants/zod/**"
  - "src/shared/middleware/validation.ts"
  - "src/shared/utils/zod-error-formatter.ts"
---

# Validation — Zod Schemas

## Schema File Convention

Each feature's HTTP layer has a `schema.zod.ts` file defining request validation schemas.

## Reusable Base Rules (`src/constants/zod/zod-rules.ts`)

Atomic field validators use `z` prefix:

- `zUUID`, `zEmail`, `zPassword`, `zUsername` — user fields
- `zMetricName`, `zMetricDescription`, `zMetricDefaultUnit` — metric fields
- `zGoalEnabled`, `zGoalType`, `zGoalValue` — metric settings
- `zPositiveFloat`, `zLogType` — metric log fields
- `zDateOptional`, `zISODateTime`, `zISODate`, `zISOTime` — date/time

Composite request schemas use descriptive names (no `z` prefix):

- `createUserBody`, `updateMetricSchema`, `listMetricsQuery`

## Error Messages (`src/constants/zod/zod-messages.ts`)

All Zod error messages are centralized in `ZodMessages` object, organized by domain:

- `ZodMessages.common.*` — shared (UUID, date)
- `ZodMessages.user.*` — auth-related
- `ZodMessages.metric.*` — metric fields
- `ZodMessages.metricSettings.*` — settings fields
- `ZodMessages.metricLog.*` — log fields

Always reference `ZodMessages` instead of inline error strings.

## Validation Middleware

`validate(schema)` from `src/shared/middleware/validation.ts`:

- Accepts a schema bag `{ body?, query?, params? }` or a single `ZodTypeAny`
- Parses input and attaches result to `req.validated`
- On failure: returns 400 with field-level errors via `formatZodIssues()`

## OpenAPI Integration

- `extendZodWithOpenApi(z)` must be called before defining schemas
- Chain `.openapi({ format, pattern, example })` on Zod schemas for OpenAPI metadata
- UUID fields require both `.uuid()` and `.regex()` with explicit pattern for OpenAPI 3.1 compatibility
- Generated spec: `documents/openapi/lakira-backend-openapi.json`
