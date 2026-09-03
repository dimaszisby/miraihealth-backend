---
paths:
  - "src/features/**/http/**"
  - "src/shared/middleware/**"
---

# API Design Patterns

## Route Definition

Each feature owns its Express router via a factory function:

```typescript
function createMyRouter(): Router {
  const router = Router();
  router.post("/", validate(createSchema), authMiddleware, controller.create);
  router.all("/", methodNotAllowed(["POST", "GET"]));
  return router;
}
export const myRouter = createMyRouter();
```

## Middleware Pipeline Order

1. `validate(schema)` — Zod validation
2. `authMiddleware` — JWT authentication (sets `req.user`)
3. Controller handler (wrapped in `catchAsync()`)
4. `methodNotAllowed([...methods])` — 405 for unsupported methods
5. Global `errorHandler` — catches all thrown errors

## Request Types

- `AuthRequest` extends Express Request with `user?: AuthUser` and `validated?: Record<string, unknown>`
- Always use `assertAuthenticated(req)` from `src/utils/auth-guards.ts` to narrow `req.user`
- Access validated data from `req.validated`, not `req.body` / `req.query` / `req.params`

## Response Format

**Success** — return it. Use `successResponse()` from `src/utils/response-formatter.ts`:

```json
{ "status": "success", "message": "...", "data": { ... }, "success": true }
```

**Errors** — throw them. Handlers `throw new AppError(message, statusCode)`; the global
`errorHandler` renders the single envelope through `sendError()` in
`src/shared/utils/error-envelope.ts`. Do not hand-format an error body in a controller.

```json
// 4xx — the caller's fault
{ "status": "fail", "message": "...", "errors": [{ "field": "body.name", "message": "..." }] }

// 5xx — ours; the message is replaced with "Something went wrong!" in production
{ "status": "error", "message": "..." }
```

`status` is always derived from the status code, never passed in. `errors` appears only where
there is field-level detail, and `field` is a dotted path (`"body.name"`), never an array of
segments. This is what the OpenAPI `BadRequestError` component documents.

There is no `errorResponse()` helper. One existed in `response-formatter.ts` with zero callers
and a body shape incompatible with everything the API actually sent; it was removed rather than
wired in (C3, `docs/internal/todos/2026-09-01-todo-error-envelope.md`).

## HTTP Status Codes

- **200**: Successful GET/PUT/DELETE
- **201**: Resource created (POST)
- **400**: Validation error, malformed JSON
- **401**: Missing or invalid JWT
- **404**: Resource not found
- **405**: Method not allowed
- **409**: Conflict (duplicate unique constraint)
- **429**: Rate limit exceeded
- **500**: Internal server error

## Error Handling

- Throw `AppError(message, statusCode)` for known errors
- Async handlers must be wrapped with `catchAsync()` from `src/utils/catch-async.ts`
- Global `errorHandler` dispatches: `ZodError` → 400, `AppError` → custom status, `UniqueConstraintError` → 409
- Development: full error + stack trace; Production: generic message

## Body Enforcement

- `requireJsonObjectBody` middleware rejects scalar payloads on POST/PUT/PATCH (must be plain object)
