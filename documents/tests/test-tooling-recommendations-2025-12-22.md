# Test Tooling & Config Recommendations — 2025-12-22

> Status update (2025-12-22): multi-project Jest + the script changes below are now applied in-repo. This document remains the reference for what those settings should look like and how to extend them.

## Current State Snapshot

- `package.json`
  - `test` chains `npm run test:unit && npm run test:integration`.
  - `test:unit` targets the Jest `unit` project with `SKIP_DB_LIFECYCLE=true`; `test:integration` runs the integration project without skipping DB bootstrap.
  - `test:contract:*` scripts run the Newman collections under `documents/tests/4-contract-tests/postman-newman/**`.
- `jest.config.mjs`
  - Uses a shared base config plus `projects: ["unit", "integration"]`.
  - `jest.setup.unit.ts` keeps unit suites lightweight; `jest.setup.ts` still boots the server/DB for integration suites.
  - Coverage collection configured via `collectCoverageFrom`, `coverageDirectory`, and `coverageThreshold`.
- Helper layout
  - `__tests__/integration/helpers/test-utils.ts` remains the shared HTTP helper for API suites. Consider promoting it into `tests/support/integration.ts` + a tsconfig alias if additional helpers emerge.

## Proposed `package.json` Scripts

Ready-to-paste block covering only the affected commands:

```jsonc
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "NODE_ENV=test SKIP_DB_LIFECYCLE=true jest --runInBand --selectProjects unit",
    "test:integration": "NODE_ENV=test jest --runInBand --selectProjects integration",
    "test:contract:local": "node documents/tests/4-contract-tests/postman-newman/scripts/run-contract-local.js",
    "test:contract:staging": "node documents/tests/4-contract-tests/postman-newman/scripts/run-contract-staging.js",
  },
}
```

Notes:

- `test:contract:*` remain untouched; they already match the desired shape.
- Only the unit script exports `SKIP_DB_LIFECYCLE=true`; integration suites always boot the stack.
- CI can call `npm run test` so unit + integration stages run sequentially without watch mode.

## Proposed Jest Configuration

Switch to a multi-project setup so `--selectProjects` works and unit suites can skip expensive DB hooks.

```ts
// jest.config.mjs
const shared = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/(.*)\\.js$": "<rootDir>/src/$1.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  reporters: [
    "default",
    [
      "jest-summary-reporter",
      {
        failuresOnly: false,
        showPassed: false,
      },
    ],
  ],
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{ts,tsx}",
    "!<rootDir>/src/main.ts",
    "!<rootDir>/src/server.ts",
    "!<rootDir>/**/index.ts",
    "!<rootDir>/src/infrastructure/db/migrations/**",
    "!<rootDir>/src/tests/**",
  ],
  coverageDirectory: "<rootDir>/coverage/jest",
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
};

export default {
  ...shared,
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/__tests__/unit/**/*.test.ts"],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.unit.ts"],
      testTimeout: 10000,
    },
    {
      displayName: "integration",
      testMatch: ["<rootDir>/__tests__/integration/**/*.test.ts"],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.integration.ts"],
      testTimeout: 40000,
    },
  ],
};
```

> Tip: pointing `ts-jest` at the repo’s root `tsconfig.json` (instead of an inline override) keeps support for features like top-level `await` in `src/server.ts` and ensures path aliases/ESM flags stay consistent between Jest runs and the build.

Supporting setup files:

```ts
// jest.setup.unit.ts
import { setImmediate } from "timers";
import { withTestEnv } from "@/tests/env-test-utils";

global.setImmediate = setImmediate;

beforeEach(async () => {
  // ensure env cache/mocks reset per spec
  await withTestEnv(async () => undefined);
});
```

```ts
// jest.setup.integration.ts
import type { Server } from "http";
import app from "./src/server.js";
import sequelize from "./src/config/db.js";
import { disconnectRedis } from "./src/utils/redis-client.js";
import { QueryTypes } from "sequelize";

let server: Server;

beforeAll(async () => {
  server = app.listen(0);
  await sequelize.authenticate();
});

beforeEach(async () => {
  const tables = (await sequelize.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`,
    { type: QueryTypes.SELECT },
  )) as { tablename: string }[];
  for (const table of tables) {
    if (["SequelizeMeta", "SequelizeData"].includes(table.tablename)) continue;
    await sequelize.query(
      `TRUNCATE TABLE "${table.tablename}" RESTART IDENTITY CASCADE;`,
    );
  }
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await sequelize.close();
  await disconnectRedis();
});
```

> The integration setup above mirrors the current `jest.setup.ts`. Migrating that logic verbatim preserves behavior while giving unit suites a lightweight alternative.

## Coverage & Reporting

- With the shared `collectCoverageFrom`/`coverageDirectory` above, running either `test:unit` or `test:integration` will produce coverage data in `coverage/jest`. Consider naming subfolders if you want to upload per-stage artifacts (e.g., `coverage/jest/unit` vs `integration`).
- Configure CI (e.g., `backend-ci.yml`) to:
  1. Run `npm run test:unit -- --coverage` and upload `coverage/jest/unit`.
  2. Run `npm run test:integration -- --coverage` with DB services up; upload `coverage/jest/integration`.
- For PR summaries, enable `--coverageReporters=text-summary,lcov` so GitHub annotations or Codecov can ingest data later.

## Helper Layout Recommendation

- Keep `__tests__/integration/helpers/test-utils.ts` as the canonical API helper for now. If the helper surface area grows, consider a dedicated alias (e.g., `"@/tests/integration-helpers": ["__tests__/integration/helpers/test-utils.ts"]`) or a `tests/support` package to avoid deep relatives.
