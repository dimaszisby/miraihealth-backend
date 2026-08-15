# TODO: Revisit `multer` override in `package.json`

## Context

`express-openapi-validator@5.6.2` pulls in `multer@2.1.1` as a transitive
dependency, which is affected by two advisories:

- GHSA-72gw-mp4g-v24j (high, DoS via deeply nested field names)
- GHSA-3p4h-7m6x-2hcm (moderate, incomplete cleanup of aborted uploads)

Both are fixed in `multer@2.2.0`. `express-openapi-validator@5.6.2` declares
`multer: "^2.0.2"`, so `2.2.0` is within its accepted range — but its own
lockfile/resolution hadn't picked up the patched version yet.

## What was done (short-term fix)

Added a top-level `overrides.multer: "^2.2.0"` in `package.json` to force
npm's resolver to pick the patched version. This clears the CI security
gate (`AUTO-NPM-multer`, high severity) without touching
`express-openapi-validator` itself.

## Why this isn't the long-term fix

The override works only because it happens to fall inside the range
`express-openapi-validator` currently declares. If a future
`express-openapi-validator` release changes its own `multer` requirement
(e.g. bumps to a `multer@3.x` major), the override could silently force an
incompatible version instead of surfacing a clear dependency conflict.

## Action item

- When upgrading `express-openapi-validator` (watch for 5.7.x or a stable
  6.x release), check whether it now depends on `multer@>=2.2.0` natively.
- If so, remove the `overrides.multer` entry from `package.json` and let
  normal resolution take over.
- Re-run `npm run security:delta:check` after the upgrade to confirm no
  regression before removing the override.
