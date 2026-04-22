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

Use `successResponse()` and `errorResponse()` from `src/utils/response-formatter.ts`:

```json
// Success
{ "status": "success", "message": "...", "data": { ... }, "success": true }

// Error
{ "status": "error", "message": "...", "data": null, "success": false }
```

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
