# Commands

Every script below is verified against `package.json`. Node 20 (`.nvmrc`) is the supported
version and what CI runs; migrations also work on newer runtimes since sequelize-cli paths are
passed explicitly rather than through a `.sequelizerc`.

## Daily loop

```bash
docker compose up -d db redis   # infrastructure
npm run migrate:development     # apply migrations
npm run dev                     # tsx watch, port 5000
```

| Command          | Does                                                    |
| ---------------- | ------------------------------------------------------- |
| `npm run dev`    | Dev server with hot reload                              |
| `npm run build`  | Compile to `dist/` and rewrite path aliases             |
| `npm start`      | Production server from `dist/`                          |
| `npm run worker` | RabbitMQ consumer process (`worker:dev` for watch mode) |

## Quality gates

Run these before pushing; CI runs the same four.

| Command                      | Does                                  |
| ---------------------------- | ------------------------------------- |
| `npm run lint`               | ESLint (`lint:fix` to autofix)        |
| `npm run typecheck`          | `tsc --noEmit`                        |
| `npm run format:check`       | Prettier (`format:write` to fix)      |
| `npm run docs:openapi:check` | Regenerate the spec and fail on drift |

## Tests

```bash
npm test        # unit, then integration — the canonical order
```

| Command                                | Needs    | Does                                      |
| -------------------------------------- | -------- | ----------------------------------------- |
| `npm run test:unit`                    | —        | Unit suites, no database                  |
| `npm run test:integration`             | Postgres | Full wiring against a real DB             |
| `npm run test:e2e`                     | Postgres | End-to-end                                |
| `npm run test:coverage`                | Postgres | Both layers with coverage                 |
| `npm run integration:local`            | Postgres | Migrate the test DB, then integration     |
| `npm run test:unit:security-framework` | —        | Validates the security audit docs' schema |

A single file:

```bash
npx jest --runInBand --selectProjects unit -- path/to/file.test.ts
```

> **Do not run `jest --selectProjects unit integration` in one pass.** Integration needs its DB
> lifecycle; combining the projects under `SKIP_DB_LIFECYCLE=true` produces failures that are an
> artefact of the invocation, not real. Use `npm test`, which runs them in sequence.

### Contract tests

Require a built server on port 4000 plus seeded fixtures. `contract:local:*` orchestrates all of
it; the `test:contract:*` scripts assume a server is already up.

| Command                                    | Does                                                     |
| ------------------------------------------ | -------------------------------------------------------- |
| `npm run contract:local:quick`             | Build, seed, boot, run both suites (fastest profile)     |
| `npm run contract:local:gate`              | Profile used as the CI gate                              |
| `npm run contract:local:full`              | Full fuzzing profile                                     |
| `npm run test:contract:local`              | Postman/Newman only, against a running server            |
| `npm run test:contract:schemathesis:local` | Schemathesis only, against a running server              |
| `npm run seed:contract-tests`              | Write deterministic fixtures to `tmp/contract-seed.json` |

Schemathesis needs Python ≥ 3.11:

```bash
python3.12 -m venv .venv-schemathesis
.venv-schemathesis/bin/pip install -r tests/contract/schemathesis/requirements.txt
```

## Migrations

Scripts are named after the **full** environment (`development`, not `dev`):

| Command                                          | Does                             |
| ------------------------------------------------ | -------------------------------- |
| `npm run migrate:development`                    | Apply pending migrations         |
| `npm run migrate:development:undo`               | Roll back the last migration     |
| `npm run migrate:development:undo:all`           | Roll back everything             |
| `npm run db:migrate:test`                        | Migrate the test DB (used by CI) |
| `npm run migrate:staging` / `migrate:production` | Same, per environment            |

`npm run migrate` and `npm run migrate:undo` are unqualified aliases that target **development**.

> Earlier documentation referenced `npm run migrate:dev` and `npm run migrate:undo:dev`. Those
> scripts have never existed — the correct names are above.

## Security

| Command                          | Does                                                     |
| -------------------------------- | -------------------------------------------------------- |
| `npm run security:delta:check`   | Dependency vulnerability delta                           |
| `npm run security:gate:evaluate` | Evaluate findings against `security/ci-gate-policy.json` |
| `npm run security:delta:gate`    | Both, in order                                           |
| `npm run security:audit:init`    | Scaffold a dated audit run from the template             |

## Documentation

| Command                         | Does                                                |
| ------------------------------- | --------------------------------------------------- |
| `npm run docs:openapi:generate` | Regenerate and normalise the OpenAPI spec           |
| `npm run docs:openapi:check`    | Regenerate and fail if the result differs from HEAD |

The spec is a build artifact — see [`api/README.md`](./api/README.md).
