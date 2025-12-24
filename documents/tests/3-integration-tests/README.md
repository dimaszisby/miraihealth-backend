# Lakira Backend Integration Tests

## Layout

- Integration suites live under `__tests__/integration/**`.
  - `api/` – end-to-end HTTP flows (auth, metrics, analytics, etc.) that hit Express + Sequelize + Redis via `supertest`.
  - `docs/` – Swagger/OpenAPI verifications.
  - `helpers/` – shared utilities (`test-utils.ts` for HTTP flows, `db-fixtures.ts` for direct DB seeding + transactions).
  - `features/` – repository-level DB checks (e.g., `features/metric/MetricRepoSequelize.integration.test.ts`) being backfilled during Phase 2.

## Commands

- Run integration suites: `npm run test:integration`
  - Boots the app and real test DB via `jest.setup.ts`.
  - Assumes Postgres/Redis are available (Docker Compose or local services).
  - Expects `.env.test` to point DB/Redis at `127.0.0.1`, which is reachable from the host when the containers publish `5432`/`6379`.
  - Collects coverage into `coverage/jest`.
- Collect integration coverage explicitly: `npm run test:integration:coverage`
  - Runs the same suites with `--coverage`, ensuring the instrumentation lands in `coverage/jest/integration`.
- First-time or freshly recreated DBs need migrations before the suite:  
  `TEST_DATABASE_URL=postgres://lakira_user:lakira_password@127.0.0.1:5432/lakira_test_db DB_HOST=127.0.0.1 NODE_ENV=test npx sequelize-cli db:migrate --config src/config/config.cjs`
- Quick infra bootstrap: `docker compose -f docker-compose.yml -f docker-compose.test.yml up -d db redis`
  - If you run the tests _inside_ Docker (e.g., `docker compose run --rm app npm run test:integration`), override `DB_HOST`/`REDIS_HOST` back to `db`/`redis` so the containers resolve over the Compose network.
- CI workflow runs `test:integration` after `test:unit`; see `documents/ci-cd/backend/**` for job wiring.

## Expectations & Conventions

- Tests may create/destroy data through HTTP endpoints; DB tables are truncated between tests by `jest.setup.ts`.
- Use `__tests__/integration/helpers/test-utils.ts` for authenticated requests, payload builders, and API shortcuts to keep suites concise.
- Avoid reaching into the DB directly unless writing future repository-level suites under `integration/features/`.
- Keep suites idempotent: never rely on state created in other files, and always set auth headers explicitly.
- Repo-level suites can seed directly via `__tests__/integration/helpers/db-fixtures.ts`; `truncateAllTables()` there now references the real snake_case table names so targeted runs (with `SKIP_DB_LIFECYCLE=true`) can still reset state deterministically.
