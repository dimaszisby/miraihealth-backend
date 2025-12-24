# Lakira Backend – GitHub Actions Workflow Guidelines

## 1. Purpose

These guidelines define **how to design, write, and maintain** GitHub Actions workflows for the Lakira Backend so that pipelines are:

- Fast and cost-effective,
- Deterministic and reproducible,
- Secure in their handling of secrets,
- Easy to debug and extend.

> Special Note for Codex: When generating or editing `.github/workflows/backend-ci.yml`, follow these guidelines unless explicitly overridden elsewhere.

---

## 2. General Principles

1. **Pipelines as Code**

   - All CI/CD logic lives in `.github/workflows/*.yml`.
   - Avoid manual, undocumented release steps for anything critical.

2. **Fail Fast, Then Go Deep**

   - Run lint and typecheck first.
   - Only run unit/integration/contract tests after basic checks pass.

3. **Deterministic & Idempotent**

   - Tests must not depend on wall-clock time or random data unless explicitly controlled.
   - DB migrations and seeds should be safe to re-run without corrupting data.

4. **Security by Default**

   - Secrets always come from `secrets.*`.
   - No credentials or tokens may be hard-coded in workflows.

5. **Observability**
   - Upload key reports (Jest, Newman) as artifacts.
   - When running coverage jobs, rename/persist per-suite folders (e.g., `coverage/jest-unit`, `coverage/jest-integration`) before uploading so they are not overwritten.
   - Configure timeouts and clear failure points.

---

## 3. Workflow Structure

### 3.1 Naming & Triggers

Use clear workflow names and consistent triggers:

```yaml
name: backend-ci

on:
  push:
    branches:
      - main
      - develop
      - "feature/**"
  pull_request:
    branches:
      - main
      - develop
```

### 3.2 Jobs & Dependencies

Standard jobs:

- `checks` – lint & typecheck
- `tests` – unit + integration tests
- `contract_local` – contract tests against locally started backend
- (Future) `deploy_staging` – deploy to Render staging
- (Future) `contract_staging` – contract tests against staging

Use `needs` to enforce ordering:

```yaml
jobs:
  checks:
    # first

  tests:
    needs: [checks]

  contract_local:
    needs: [tests]

  deploy_staging:
    needs: [contract_local]

  contract_staging:
    needs: [deploy_staging]
```

### 3.3 Concurrency

Ensure only one pipeline per branch runs at a time:

```yaml
concurrency:
  group: backend-ci-${{ github.ref }}
  cancel-in-progress: true
```

This cancels older runs for the same ref when new commits are pushed.

### 3.4 Timeouts

Set reasonable job timeouts:

```yaml
jobs:
  checks:
    timeout-minutes: 10
  tests:
    timeout-minutes: 20
  contract_local:
    timeout-minutes: 30
  deploy_staging:
    timeout-minutes: 15
  contract_staging:
    timeout-minutes: 20
```

Avoid unbounded runtimes; keep timeouts visible and justifiable.

---

## 4. Node Setup, Install Strategy & Caching

### 4.1 Node.js Setup

Use `actions/setup-node@v4` with a fixed version and npm caching:

```yaml
- name: Use Node.js 20
  uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm
```

Locking the version:

- Ensures consistency between local dev and CI,
- Reduces “works-on-my-machine” issues.

### 4.2 Dependency Installation

Use `npm ci` instead of `npm install`:

```yaml
- name: Install dependencies
  run: npm ci
```

- `npm ci` is deterministic and optimized for CI.
- Avoid running `npm ci` more than once per job.

---

## 5. Services: Postgres & Redis

Workflows that require data stores (e.g. `tests`, `contract_local`) should define service containers:

> Special Note for Codex: Reuse these exact service names, versions, and health checks when emitting workflow YAML so CI stays aligned with the environment matrix.

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD_TEST }}
      POSTGRES_DB: lakira_ci
    ports:
      - 5432:5432
    options: >-
      --health-cmd="pg_isready -U postgres"
      --health-interval=10s
      --health-timeout=5s
      --health-retries=5

  redis:
    image: redis:7
    ports:
      - 6379:6379
    options: >-
      --health-cmd="redis-cli ping"
      --health-interval=10s
      --health-timeout=5s
      --health-retries=5
```

Typical environment variables for these jobs:

```yaml
env:
  DATABASE_URL: postgres://postgres:${{ secrets.POSTGRES_PASSWORD_TEST }}@postgres:5432/lakira_ci
  REDIS_URL: redis://redis:6379
  NODE_ENV: test
  JWT_SECRET: ${{ secrets.JWT_SECRET_TEST }}
```

> Special Note for Codex: Treat `postgres` and `redis` as canonical service hostnames when generating DB/Redis configuration for CI—do not introduce alternative env var names without updating this guideline first.

---

## 6. Secrets & Security

### 6.1 Secret Storage

Store sensitive values only as GitHub Secrets, for example:

- `POSTGRES_PASSWORD_TEST`
- `JWT_SECRET_TEST`
- `RENDER_STAGING_DEPLOY_HOOK_URL`
- `STAGING_BASE_URL`
- `STAGING_HEALTH_URL`

Usage example:

```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET_TEST }}
```

> Special Note for Codex: Before proposing new secrets or env var names, cross-check `ENVIRONMENTS_MATRIX.md` so the same identifiers exist everywhere (GitHub, Render, docs).

Never:

- Commit real `.env` files,
- Put tokens/passwords directly into YAML.

### 6.2 Additional Security Gates (Optional but Recommended)

Enable GitHub’s built-in security features:

- Secret scanning,
- Dependabot alerts,
- Dependency review.

These complement your own tests and keep the portfolio aligned with real-world expectations.

---

## 7. Artifacts, Reports & Failure Triage

### 7.1 Uploading Artifacts

Upload key artifacts to simplify debugging:

- Jest reports (optional),
- Newman contract test reports (JUnit + HTML),
- Any custom logs if needed.

Example for Newman (local):

```yaml
- name: Upload Newman reports (local)
  uses: actions/upload-artifact@v4
  with:
    name: newman-local
    path: documents/tests/4-contract-tests/postman-newman/reports/local
    retention-days: 14
```

You can mirror this pattern for staging contract tests (`newman-staging`).

### 7.2 Failure Triage Flow

When a job fails:

1. **Read the job logs** in GitHub Actions UI:
   - Identify if the failure is in install, migrations, tests, or contract suite.
2. **If contract tests fail**:
   - Download the Newman HTML report,
   - Compare actual vs expected status codes / payloads,
   - Decide whether the bug is in:
     - Backend implementation,
     - OpenAPI spec,
     - Postman collection.
3. **If DB connectivity fails**:
   - Check Postgres/Redis service logs,
   - Ensure `DATABASE_URL` and `REDIS_URL` match your app’s configuration.
4. **If staging deploy fails**:
   - Inspect Render logs,
   - Check if migrations or app start command failed,
   - Fix the issue, redeploy, and re-run the workflow.

> Special Note for Codex: When summarizing a failed run, always point humans to the relevant artifact path(s) to inspect.

---

## 8. Example Skeleton: `backend-ci.yml`

The main backend CI workflow should roughly align with this skeleton:

```yaml
name: backend-ci

on:
  push:
    branches:
      - main
      - develop
      - "feature/**"
  pull_request:
    branches:
      - main
      - develop

concurrency:
  group: backend-ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  checks:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  tests:
    needs: checks
    runs-on: ubuntu-latest
    timeout-minutes: 20
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD_TEST }}
          POSTGRES_DB: lakira_ci
        ports:
          - 5432:5432
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
    env:
      DATABASE_URL: postgres://postgres:${{ secrets.POSTGRES_PASSWORD_TEST }}@postgres:5432/lakira_ci
      REDIS_URL: redis://redis:6379
      NODE_ENV: test
      JWT_SECRET: ${{ secrets.JWT_SECRET_TEST }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run db:migrate:test
      - run: npm run test:unit
      - run: npm run test:integration

  contract_local:
    needs: tests
    runs-on: ubuntu-latest
    timeout-minutes: 30
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD_TEST }}
          POSTGRES_DB: lakira_ci
        ports:
          - 5432:5432
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
    env:
      DATABASE_URL: postgres://postgres:${{ secrets.POSTGRES_PASSWORD_TEST }}@postgres:5432/lakira_ci
      REDIS_URL: redis://redis:6379
      NODE_ENV: test
      JWT_SECRET: ${{ secrets.JWT_SECRET_TEST }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run db:migrate:test
      - name: Start backend
        run: npm run start:test &
      - name: Wait for backend
        run: npx wait-on http://localhost:4000/api/v1/health
      - name: Run contract tests (local)
        run: npm run test:contract:local
      - name: Upload Newman reports (local)
        uses: actions/upload-artifact@v4
        with:
          name: newman-local
          path: documents/tests/4-contract-tests/postman-newman/reports/local
          retention-days: 14
```

---

## 9. Maintenance

When changing job structure, timeouts, secrets, or artifact paths:

- Update this file,
- Update `GITHUB_ACTIONS_PIPELINE_PLAN.md`,
- Update `GITHUB_ACTIONS_PIPELINE_CHECKLIST.md`,
- Keep `.github/workflows/backend-ci.yml` in sync.

This keeps the backend CI documentation and implementation aligned and ready for portfolio review.
