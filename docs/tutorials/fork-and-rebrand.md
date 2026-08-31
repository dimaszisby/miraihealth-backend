# Fork and rebrand

Turn this template into your own project. One script does the mechanical part; this walks through
what it changes and what you still have to decide.

## 1. Take a copy

```bash
git clone https://github.com/<owner>/lakira-backend.git my-app
cd my-app
rm -rf .git && git init && git add -A && git commit -m "chore: initial commit from template"
```

Dropping `.git` gives you a clean history. Keep it instead if you want to pull upstream fixes
later — `bootstrap-fork.sh` records the upstream SHA either way.

## 2. Rebrand

```bash
./scripts/bootstrap-fork.sh --name my-app
```

The name must match `^[a-z][a-z0-9-]*$` — lowercase, digits, hyphens, starting with a letter. The
script rejects anything else, deliberately: the name is interpolated into `sed` patterns, and a
`/` or `|` would break them.

It is idempotent, so running it twice with the same name changes nothing.

What it does:

|                                  |                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `lakira-backend` → `my-app`      | `package.json`, `package-lock.json`, `docker-compose.test.yml`, CI workflows, scripts |
| `lakira` → `my-app` (short name) | queue topology, database names, CI database references                                |
| Rotates `JWT_SECRET`             | in `.env.development`                                                                 |
| Sets `APP_NAME=my-app`           | in `.env.development`                                                                 |
| Writes `FORKED-FROM.md`          | recording the upstream commit SHA                                                     |

The short name is the full name minus a trailing `-backend` or `-api`, so `my-app-backend`
becomes `my-app`. A display name is derived by title-casing it — `my-app` → `My App` — matching
`src/config/app-name.ts`.

## 3. Check what it could not reach

The script covers file contents. These are yours:

- **`.env.development` is the only env file it touches.** Set `APP_NAME` and a fresh `JWT_SECRET`
  in every other environment yourself.
- **`LICENSE`** still names the original author.
- **`README.md`** still describes Lakira's domain — metrics, logs, categories.
- **The domain model itself.** `metrics`, `metric_logs`, `metric_categories`, and
  `metric_settings` are a metric-tracking product. Auth, organizations, memberships, and invites
  are the reusable half; the metric slices are the example.

## 4. Decide what to keep

The parts worth keeping regardless of what you are building:

| Keep                        | Why                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/features/shared/auth/` | Registration, login, refresh-token rotation, password reset, email verification, organizations, memberships, invites |
| `src/shared/middleware/`    | Rate limiting, error handling, request-ID correlation, method guard                                                  |
| `src/config/`               | Zod-validated environment loading                                                                                    |
| `docs/reference/security/`  | ASVS/SSDF-mapped audit framework, gate policy, run template                                                          |
| `tests/contract/`           | Schemathesis harness                                                                                                 |
| `.github/workflows/`        | The full pipeline                                                                                                    |

The parts to replace with your own domain:

```
src/features/public/metric*/     the example domain
src/migrations/2025*-*metric*    and their tables
docs/explanation/product-requirements.md
```

## 5. Read the open findings before you ship

`docs/internal/audits/saas-readiness/` is the honest assessment of this template, and as of
`audit-2026-06-05.md` it carries **two open P0s and one open HIGH**:

Both of the caveats that used to sit here are now **closed**:

- Cache keys are scoped by `organizationId` as well as `userId`
  ([ADR-0035](../explanation/decisions/adr-0035-tenant-scoped-cache-keys.md)), and an
  architecture test fails CI if a new cache key omits the organization segment.
- Production-unsafe env switches — `DISABLE_RATE_LIMITING`, `ALLOW_TEST_HTTP_SERVER`,
  `SWAGGER_REQUIRE_AUTH=false`, and default `guest` RabbitMQ credentials — are refused at
  startup when `NODE_ENV=production`
  ([ADR-0036](../explanation/decisions/adr-0036-refuse-production-unsafe-env-switches.md)).

## 6. Prune the internal docs

```bash
rm -rf docs/internal
```

That tree is this project's working material — doc kits, audit runs, incidents, todos. Your fork
inherits the four Diátaxis quadrants, which describe the template; it does not need Lakira's
history. Keep `docs/internal/audits/saas-readiness/` if you want the findings above to hand.

## 7. Verify

```bash
npm ci
docker compose up -d db redis
npm run migrate:development
npm run lint && npm run typecheck && npm test
```

Green means the rebrand did not break anything. Then walk
[Getting started](./getting-started.md) against your new name.

## What you now own

A Node 20 / Express / TypeScript API with multi-tenant auth, refresh-token rotation, Zod-validated
config and requests, a generated and CI-gated OpenAPI contract, four test layers including
contract fuzzing, a security audit framework, and a deployment pipeline.

What it is not: a billing system. `docs/internal/initiatives/subscription-billing/` is a scaffolded
plan with nothing implemented — [ADR-0025](../explanation/decisions/adr-0025-billingprovider-port-over-stripe-sdk.md)
and [ADR-0026](../explanation/decisions/adr-0026-subscription-attaches-to-organization.md) record
the intended shape, both **Proposed**.
