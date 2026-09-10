# Todo — remove the orphaned OpenAPI schemas

- **Status:** Open — small, self-contained, no blockers
- **Created:** 2026-09-10
- **Owner:** unassigned
- **Origin:** follow-up 2 from the C3 error-envelope work
  ([`2026-09-01-todo-error-envelope.md`](./2026-09-01-todo-error-envelope.md)), which aligned
  `components/schemas/ValidationError` rather than deleting it, to keep the cross-repo type change
  to a single rename

---

## What C3 reported, and what is actually there

C3's review named **two** unreferenced schemas, `Error` and `ValidationError`. A census of the
generated spec finds **sixteen** schemas with zero `$ref`s — but only **seven** of those are dead.
The distinction matters, because deleting the other nine would break the spec.

### Genuinely dead — registered, referenced by nothing, imported by nothing (7)

| Schema                       | Note                                                            |
| ---------------------------- | --------------------------------------------------------------- |
| `Error`                      | superseded by the seven response components                     |
| `ValidationError`            | duplicates `BadRequestError`; aligned by C3 rather than deleted |
| `GetTrendRequest`            | —                                                               |
| `MetricListResponse`         | superseded by cursor pagination (`MetricCursorResponse`)        |
| `MetricCategoryListResponse` | same                                                            |
| `MetricLogListResponse`      | same                                                            |
| `MetricSettingsListResponse` | same                                                            |

Verified two ways: zero `"#/components/schemas/<name>"` occurrences anywhere in the generated
document, and zero importers of the corresponding `<name>Schema` export outside its own definition
in `src/lib/openapi/openapi-schemas.ts`.

### NOT dead — registered and used, but inlined rather than `$ref`'d (9)

**Do not delete these.** They are query-parameter schemas, and `zod-to-openapi` inlines parameter
schemas into each operation instead of emitting a `$ref`. Each is used twice in
`src/lib/openapi/openapi-docs.ts`, so the spec would fail to generate without them:

`DashboardVisualizationQueryParams`, `MetricCategoryCursorQueryParams`, `MetricCursorQueryParams`,
`MetricDetailQueryParams`, `MetricIdQuery`, `MetricIdRequiredQuery`, `MetricLogCursorQueryParams`,
`MetricSettingsCursorQueryParams`, `VisualizationQueryParams`

They appear in `components/schemas` only because `registerSchema()` puts them there. That is the
cosmetic artifact, not a defect — but it is exactly the trap a naive "delete every unreferenced
schema" pass would fall into.

## Why it is worth doing

Low stakes, but not zero. `lakira-frontend` generates its types from this spec, so every orphan
becomes an exported TypeScript type nobody can use — `Error` and `ValidationError` are especially
misleading there, since both look like the error envelope and neither is. The frontend has a
hand-written `ApiFailure` that already drifted from the real shape; competing near-identical
definitions are how that happens.

`ValidationError` is also the second copy of the `path`-vs-`field` mistake C3 fixed. It carried
`path: string[]` for as long as it existed, and no response has ever sent it. C3 aligned it to
`field` rather than deleting it, deliberately, to keep that PR's cross-repo surface to one rename.
Deleting it now finishes that thought.

## Scope

Remove the seven dead schema definitions from `src/lib/openapi/openapi-schemas.ts` and regenerate
the spec. Nothing else imports them, so no call sites change.

**Sequence this after the frontend sync lands.** `lakira-frontend`'s snapshot is currently a week
behind and its `api-contract` CI job is red until it catches up; shipping a second spec change
mid-sync gives that work a moving target. Once the sync is merged, this is a clean follow-on and the
frontend picks it up on its next sync.

## The open question worth deciding at the same time

`scripts/validate-openapi.ts` has three checks — every `$ref` resolves and none is external,
operation ids are unique, no operation has empty responses. **It does not detect orphans**, which is
why seven accumulated silently.

Adding a fourth check is the obvious move, and this repo's recurring lesson is that a gate which
cannot fail is worse than none — `docs:openapi:check` validated drift but not validity,
`contract_staging` never issued a request, the error components validated `{}`. But a naive orphan
check flags all sixteen, including the nine live parameter schemas, so it needs a decision first:

1. **Allowlist the parameter schemas.** Simple, but a hand-maintained list drifts — the same failure
   mode being fixed.
2. **Stop registering parameter schemas.** If they do not call `registerSchema()` they never enter
   `components/schemas`, and the orphan check becomes exact with no allowlist. Requires confirming
   `zod-to-openapi` inlines them identically when unregistered — likely, since it already inlines
   them today, but it must be verified against a regenerated spec rather than assumed.
3. **Do not add a gate.** Delete the seven and accept that orphans can recur.

Option 2 is the better shape and the reason to think about it now rather than after the deletion:
it removes the artifact instead of documenting around it. It is also the only one of the three that
could turn out to be impossible, so verify before committing to it.

## Verification

```bash
npm run docs:openapi:generate
npm run lint && npm run typecheck && npm run format:check && npm run docs:openapi:check

# The census, which must show 9 remaining — the live parameter schemas — and none of the 7:
python3 -c "
import json; s=json.load(open('docs/reference/api/lakira-backend-openapi.json'))
blob=json.dumps(s)
dead=[n for n in s['components']['schemas'] if blob.count(f'\"#/components/schemas/{n}\"')==0]
print(len(s['components']['schemas']), 'schemas,', len(dead), 'unreferenced')
for n in sorted(dead): print('  -', n)
"
```

Operation count must stay **46** and Schemathesis selection **37/46**. Removing an unreferenced
schema must move neither; a change in either means something referenced was deleted.
