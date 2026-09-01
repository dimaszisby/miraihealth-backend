# Todo — unify and document the error envelope (C3)

- **Status:** Ready to start — this is the brief, not a plan
- **Created:** 2026-09-01
- **Owner:** unassigned
- **Prepared for:** a fresh Claude Code session with a full context window
- **Origin:** `C3` in the SaaS-readiness audit —
  [`FINAL-AUDIT-SUMMARY.md:126`](../audits/saas-readiness/FINAL-AUDIT-SUMMARY.md), P1, sized ≤1d,
  open and unchanged across three audit rounds (2026-05-01, 2026-05-24, 2026-06-05)

The audit entry reads: _"Error envelope inconsistent + undocumented — `error.ts` hand-rolls 3 shapes
(incl. an undocumented `fail` status), bypassing `errorResponse()`, violating `api-design.md`;
OpenAPI documents no 4xx/5xx schema (only 429)."_

Two clauses of that are now stale, and the finding is **larger** than it describes. Corrections are
in the next section — read them before trusting the audit row.

---

## Corrections to the audit entry, measured 2026-09-01

**"3 shapes" undercounts. There are 8 emission sites across 6 files**, and `error.ts` is only half
of them:

| Site                           | Emits                                                                  |
| ------------------------------ | ---------------------------------------------------------------------- |
| `error.ts:32` malformed JSON   | `{status:"fail", errors:[{field,message}]}`                            |
| `error.ts:46` Zod              | `{status:"fail", errors:[{field,message}]}`                            |
| `error.ts:74` **production**   | `{status:"error", message:"Something went wrong!"}`                    |
| `error.ts:79` dev/test         | `{status, message, stack?}`                                            |
| `validation.ts:16`             | `{status:"fail", errors:[{field,message}]}` — duplicates `error.ts:46` |
| `method-guard.ts:15,32`        | `{status:"fail", …}` at **405**                                        |
| `require-json-object.ts:12`    | `{status:"fail", …}`                                                   |
| `server.ts:181` `/ready` catch | `{status:"error"}` — **no `message` at all**                           |

**"OpenAPI documents no 4xx/5xx schema (only 429)" is no longer true.** Seven response components
now exist in `openapi-config.ts` (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`,
`NotFoundError`, `ConflictError`, `TooManyRequestsError`, `InternalServerError`) and are `$ref`'d
across the spec: 43 operations document a 400, 45 a 500, 41 a 401. The problem is no longer absence
— it is that **what they document is wrong, and structurally cannot fail**.

**`errorResponse()` has zero production callers.** `api-design.md:39` mandates it; `grep` finds only
its own definition (`response-formatter.ts:61`) and its unit test. Its sibling `successResponse()`
has **52**. So the success path is consistent and the error path was never wired up — the helper is
aspirational, not a migration target. Decide whether to wire it in or delete it; do not assume.

## The three defects worth fixing

### 1. `errors[].field` is emitted; `errors[].path` is documented

`zod-error-formatter.ts:9-12` produces a **dotted string**:

```ts
export const formatZodIssues = (error: ZodError): FormattedIssue[] =>
  error.errors.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));
```

`openapi-config.ts` `BadRequestError` declares `errors[].path` as `{type:"array", items:{type:"string"}}`.

This reaches a consumer. `lakira-frontend` generates its types from this spec, and
`src/types/api/generated/lakira-backend.d.ts:3079-3082` has:

```ts
errors?: { message?: string; path?: string[] }[];
```

`path` is always `undefined` at runtime, and `field` is not typed at all.

**Direction of the fix: change the spec to match the code, not the reverse.** `field` is what 30
integration assertions already expect, and a dotted string is more useful to a form than a segment
array. This is also the precedent already set in this file — see the comment above
`TooManyRequestsError`, which deliberately documents the number `status` the rate limiter really
sends and cites this very caveat by name.

**Why now rather than later:** no frontend code reads `errors` at runtime yet. The `errors` hits in
`InviteMemberForm.tsx` and `MetricForm.tsx` are react-hook-form's local `formState.errors`, not API
payloads. Both forms are one feature away from wanting server-side field mapping, and
`lakira-frontend/src/types/generics/ApiResponse.ts:18` already hand-declares a **third** shape,
`errors?: string[]`. Fix it while nothing depends on the wrong answer.

### 2. Production returns the wrong body for every 4xx

`error.ts:74` is not conditioned on status code:

```ts
if (env.NODE_ENV === "production") {
  res.status(appError.statusCode).json({
    status: "error",
    message: "Something went wrong!",
  });
}
```

So in production a 404 answers `{"status":"error","message":"Something went wrong!"}` while the spec
promises `{"status":"fail","message":"Resource not found"}`. Same for 400, 403, 409. The client is
told nothing actionable about an error that is entirely its own fault, and dev and production return
**different envelopes for the same request** — a Factor X parity break on top of the contract break.

`AppError` already computes the right discriminator (`AppError.ts:16`):

```ts
this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
```

The dev branch at `:79` uses it. The production branch throws it away.

**Preserve the masking for 5xx.** It exists so internal failures do not leak messages or stack
traces, and that is correct — `error.ts:79` appends `stack` in development only. The fix is to gate
the masking on `statusCode >= 500`, not to remove it. A security reviewer should confirm no 4xx
`AppError` message anywhere in `src/` embeds a database string or internal identifier before this
lands; `UniqueConstraintError` is mapped to a fixed `"Duplicate value"` at `error.ts:63`, which is
the one that would otherwise be a candidate.

### 3. `response_schema_conformance` is a gate that cannot fail

Every one of the seven components declares `properties` and **no `required`**, and none sets
`additionalProperties: false`:

```
UnauthorizedError     required=<none>
ForbiddenError        required=<none>
NotFoundError         required=<none>
BadRequestError       required=<none>
ConflictError         required=<none>
InternalServerError   required=<none>
TooManyRequestsError  required=<none>
```

A JSON Schema with no `required` and no `additionalProperties` validates `{}`. It validates
`{"anything":1}`. So Schemathesis's `response_schema_conformance` check passes trivially for all
seven error responses across 46 operations.

This is not hypothetical. PR #77 reported that the malformed-JSON body _"already conforms to the
existing `BadRequestError` component, which declares no required properties"_ — technically true and
substantively empty. It is the same shape as `docs:openapi:check` validating drift but not validity
(fixed 2026-08-27), and `contract_staging` having never issued a request (fixed 2026-08-29). **A
gate that proves less than it appears to is the recurring defect class in this repo.**

Adding `required` is what converts the fix into something CI can defend.

## THE TRAP: adding `required` will turn the local gate red, and that is the point

`npm run contract:local:gate` currently exits 0 with 1371/1371 passing. Tighten the schemas **before**
unifying the emitters and it will fail immediately — every 400 that omits `message`, every 405 that
has no documented response at all.

Do it in this order, and the red is diagnostic rather than confusing:

1. **Unify the emitters first**, so one shape is actually produced.
2. **Then tighten the schemas** to require exactly that shape.
3. **Then re-run the gate.** It should return to green with the checks now doing real work.

Reversing steps 1 and 2 means debugging a red gate with two candidate causes — the same reasoning
that kept the analytics 304 fix out of the newman PR
(`2026-08-31-todo-analytics-304-etag.md`).

**405 is emitted and entirely undocumented.** A status-code census of the generated spec returns
`{200, 201, 202, 400, 401, 403, 404, 409, 429, 500}` — no 405, though `method-guard.ts` returns one
on two paths. Either document it with a `MethodNotAllowedError` component or accept it explicitly;
tightening the other schemas without deciding will surface it as a mystery failure.

**`/health` and `/ready` are in no path in the spec.** `server.ts:181`'s `{status:"error"}` is
therefore unvalidated by anything. Out of scope — noted so it is not mistaken for a regression when
the census above does not mention them. `tests/smoke/run-smoke.mjs` exercises both.

## Scope

**Unify** — one envelope, emitted from one place. The eight sites collapse to a single helper. The
shape should be the one the code already predominantly sends and the tests already assert:

```json
{ "status": "fail" | "error", "message": "...", "errors": [{ "field": "...", "message": "..." }] }
```

`errors` present only where there are field-level issues. Decide `message`'s status deliberately: it
is currently **absent** from both `fail` bodies (`error.ts:33`, `:47`, `validation.ts:16`), which is
why `BadRequestError` cannot require it today. Requiring it means adding it at those sites.

**Then document** — set `required` on all seven components, rename `path` → `field`, and decide 405.

**Then reconcile the consumer** — regenerate `lakira-backend.d.ts` in `lakira-frontend` and collapse
its hand-written `ApiResponse.ts:18` `errors?: string[]` onto the generated type. That is a separate
PR in a separate repo, but the backend PR should say it is needed, because the last spec defect that
crossed this boundary (a dangling `$ref` to `TooManyRequestsError`) broke frontend type generation
and had to be fixed there in PR #68.

**Do not touch** — `successResponse()` and its 52 callers. The success envelope is consistent and is
not what C3 is about.

### Test blast radius, measured

- **29** `expect(res.body.status).toBe("fail")` assertions across eight files in
  `__tests__/integration/api/` (`auth`, `metric`, `metric-category`, `metric-log`,
  `metric-settings`, `analytics`, `analytics-caching`, `json-body-guard`), plus **1** in
  `__tests__/integration/docs/swagger.test.ts:7` — 30 in total
- **4** unit suites assert bodies directly: `error.test.ts` (`:56`, `:74`, `:88-89` — including the
  literal `"Something went wrong!"`), `validation.test.ts:99`, `method-guard.test.ts:27`,
  `response-formatter.test.ts:65,79`

`error.test.ts:88-89` is the one that encodes defect 2. Inverting it is the proof the fix landed;
if it still passes unchanged, production 4xx masking was not actually addressed.

## Current state, verified 2026-09-01

- `dev` @ `6ee8417` (PR #77), clean; `main` still on `Initial commit`
- `contract:local:gate` exits 0 — 1371 generated, 1371 passed, 4 advisory warnings characterised in
  `2026-09-01-todo-schemathesis-gate-warnings.md` (they are **not** defects; do not try to fix them
  as part of this)
- 46 operations, Schemathesis selects 37 — **neither number should move**
- `npm audit`: 3 moderate, 0 high/critical; `overrides` block is 3 entries
- `lakira-frontend` is checked out at `../lakira-frontend` and its generated types are readable

## Conventions this repo expects

- **Plan mode** for anything 3+ steps (`.claude/rules/workflow.md`)
- **Branch off `dev`.** Verify with `git rev-parse --abbrev-ref HEAD` **before** committing — a
  recent handover wrote the commit onto the previous branch because this was not checked, and a
  squash merge silently carried two unrelated commits into one PR
- **Conventional Commits**, enforced by a `commit-msg` hook and in CI since PR #74
- **Never blanket-stage.** A `pre-commit` hook rejects staged `.env*`; name explicit paths
- Commit messages go to `$(git rev-parse --git-dir)/COMMIT_DRAFT`, are shown in chat for review, and
  are applied with `git commit -F`. No `Co-Authored-By` or Claude references
- The user opens PRs and merges — Claude does not commit, push, or open PRs
- Record the outcome as a Review section appended to **this** file

## Verification the PR must show

```bash
npm run lint && npm run typecheck && npm run format:check && npm run docs:openapi:check
npm test

# The load-bearing check — the gate must be green with schemas that can now actually fail.
docker compose up -d
npm run build && npm run db:migrate:test
npm run seed:contract-tests
npm run contract:local:gate     # expect exit 0, 46 operations, 37 selected

# Prove the tightened schemas are not still vacuous:
python3 -c "
import json; s=json.load(open('docs/reference/api/lakira-backend-openapi.json'))
for k,v in s['components']['responses'].items():
    sch=v['content']['application/json']['schema']
    print(k, 'required=', sch.get('required','<NONE — NOT FIXED>'))
"
```

The last command is the one that distinguishes this work from cosmetic tidying. If any component
still prints `<NONE — NOT FIXED>`, the gate remains incapable of failing and defect 3 is unaddressed
regardless of how consistent the emitters became.

State the production-4xx behaviour change explicitly in the PR body: it changes what deployed
clients receive, and it is the only part of this work that is not backward compatible.
