# Lakira Backend Unit Tests

## Layout

- All unit suites live under `__tests__/unit/**`, mirroring the feature folders in `src/`.
- Common categories:
  - `analytics/**` – pure services/domain utilities (e.g., fallback range).
  - `config/**` – helpers like `envManager`.
  - `features/**` – domain entities, application services, and infrastructure adapters exercised with mocks only.

## Commands

- Run the full unit suite: `npm run test:unit`
  - Uses the Jest `unit` project, `jest.setup.unit.ts`, and `SKIP_DB_LIFECYCLE=true` so no DB/HTTP servers start.
  - Ideal for local TDD and PR pre-checks; averages seconds to run.
- Collect coverage for unit suites: `npm run test:unit:coverage`
  - Runs the same Jest project with `--coverage`, writing artifacts under `coverage/jest/unit`.
- Watch mode: `npm run test:dev` still works but remember it launches both Jest projects with `SKIP_DB_LIFECYCLE=true`, so integration suites will skip DB bootstrapping.

## Expectations & Conventions

- Do **not** hit real Postgres, Redis, or Express instances.
- Mock repositories, caches, and providers; focus on pure business logic.
- Prefer deterministic data builders/factories; avoid relying on global helper state.
- Keep imports absolute (`@/...`) so moving suites across folders stays painless.
- When environment overrides are needed, wrap logic in `withTestEnv` inside the test body.
