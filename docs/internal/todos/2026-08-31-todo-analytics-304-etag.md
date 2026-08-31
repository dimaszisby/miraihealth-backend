# Todo — analytics 304 responses omit validators

- **Status:** Open
- **Created:** 2026-08-31
- **Owner:** unassigned
- **Found by:** the newman retirement (`2026-08-31-todo-retire-newman.md`), while migrating the
  collections' only conditional-request assertion into Jest

## The defect

`src/features/public/analytics/infrastructure/http/controller.ts:46-48`, in
`handleGetVisualization` (`GET /analytics/metrics/:metricId`):

```ts
const etag = makeEtag(data);
if (req.headers["if-none-match"] === etag) return res.status(304).end();
res.setHeader("ETag", etag);
```

The 304 short-circuits **before** the header is set, so the response carries no `ETag`.
RFC 9110 §15.4.5 requires a 304 to send the validator that would have accompanied a 200 —
without it a client cannot refresh its cache entry, and some intermediaries treat the
revalidation as failed.

The same handler sets **no `Cache-Control` at all**, so the route is only conditionally
cacheable by accident. `handleGetDashboardVisualization` (`:76-84`) gets both right: it sets
`ETag` and `Cache-Control` before the conditional, so its 304 is well-formed.

## Why it was not fixed on discovery

The retirement PR removes a devDependency, deletes five collections, and rewires CI seeding.
Landing a behaviour change alongside that would mean a red pipeline has two candidate causes.
The migrated test therefore asserts today's behaviour and points here:

`__tests__/integration/api/analytics-caching.test.ts` → `"returns 304 for a conditional single
metric request"` asserts `etag` and `cache-control` are **undefined** on the 304.

## The fix

Move the two header writes above the conditional and give the route a `Cache-Control`
consistent with the dashboard's (`private, max-age=${VIZ_CACHE_MAX_AGE_SEC},
stale-while-revalidate=${VIZ_CACHE_STALE_SEC}`). Then invert the two `toBeUndefined()`
expectations in that test to `toBe(first.headers.etag)` / `toContain("private")`.

Worth checking in the same pass whether `makeEtag` should be a strong validator at all: it is a
27-character base64 slice of `JSON.stringify(data)`, so it is a truncated hash presented as a
strong ETag. `deriveEtagSeed` (`VisualizationReadRepoSequelize.ts:457`) does the same with sha1.
Collisions are unlikely but the truncation is arbitrary.
