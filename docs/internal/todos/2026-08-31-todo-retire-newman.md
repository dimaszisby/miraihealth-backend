# Todo — retire newman

- **Status:** Ready to start — this is the brief, not a plan
- **Created:** 2026-08-31
- **Owner:** unassigned
- **Prepared for:** a fresh Claude Code session with a full context window
- **Supersedes the "Recommended direction (not yet agreed)" section of**
  `2026-08-23-todo-newman-vulnerability-chain.md`, which predates the decisions below

Retirement **is agreed**. Read this before that older doc — the older one's inventory and migration
analysis are still accurate and are the best starting point, but its framing of the decision is
stale.

---

## Why this is happening

Two independent reasons, both established by measurement rather than preference.

**The dependency debt compounds and has no upgrade path.** `newman@6.2.2` is already the latest
published release and ships known criticals upstream has not fixed. Any _new_ advisory in the
postman chain therefore has no version to upgrade to — the only responses are another `overrides`
entry or a security exception. We have been through that cycle once already.

**The assertions are ~68% duplicated.** An inventory found 17 of 25 semantic assertions already
covered in `__tests__/integration/api/`, usually more strictly (Jest asserts values where newman
asserts shape). Maintaining both means every API change needs updating in two places, and there is
already evidence of silent rot: the `.js`-suffix bug that meant the metric-log cursor cache was never
invalidated, dead invalidation patterns with no writer, and `metric-categories` listed as a coverage
target with no collection at all.

Deciding this was also a **precondition for the staging work** — see "What was deliberately left
undone" below.

## Correction to carry forward

An earlier claim that retiring newman "drops 7 of the 11 overrides" was **wrong**. Measured against
the actual dependency tree:

- **Exclusively newman's** — `node-forge`, `flatted`, `ip-address`, `jose` (4)
- **Shared with other consumers** — `handlebars`, `lodash`, `underscore`, `qs` (4). These may become
  unnecessary once newman goes, but only if the remaining consumers resolve safe versions. Check;
  do not assume.
- **Unrelated** — `js-yaml`, `brace-expansion`, `esbuild` (3). These stay regardless.

So: **4 definite, up to 8 at best.** Re-measure before claiming a number in the PR.

## What was deliberately left undone, for this work to finish

The staging smoke-suite change (`2026-08-29-todo-staging-smoke-suite.md`) replaced the staging
contract job but **intentionally did not delete newman's staging path**, because splitting a deletion
across two PRs leaves a half-removed feature. These are orphaned _on purpose_ and are yours to
remove:

- `tests/contract/postman-newman/scripts/run-contract-staging.js` — no longer invoked by anything
- the `test:contract:staging` npm script
- `tests/contract/postman-newman/environments/lakira-staging.postman_environment.json`

If you find these and think "why is this dead code here" — this is why.

## THE TRAP: `contract_local` must survive, and it seeds via newman

**`contract_local` runs Schemathesis as well as newman. Do not delete the job.** It is also a
required-looking gate in the pipeline (`needs: tests`, and `deploy_staging` needs it).

Worse, and easy to miss: **CI has no seed step.** The chain is

```
run-contract-local.js:74-75   ->  npm run seed:contract-tests
                                   writes tmp/contract-seed.json
backend-ci.yml (~:323)        ->  reads tmp/contract-seed.json for primaryUser.token
                                   passes it to Schemathesis as SCHEMATHESIS_LOCAL_TOKEN
```

So the newman runner is what seeds the database and produces the token Schemathesis authenticates
with. **Deleting `run-contract-local.js` without moving the seed step breaks Schemathesis**, and it
will fail in a way that looks unrelated to newman.

Before removing anything, add an explicit seed step to `contract_local` (`npm run seed:contract-tests`)
between the migration step and the server start, and confirm `tmp/contract-seed.json` still exists
when the Schemathesis token step runs.

`scripts/run-contract-local-full.mjs` already does this correctly (seeds at `:100`, then invokes the
runner with `SKIP_CONTRACT_SEED=true`) — copy that ordering.

## Scope

**Migrate** — roughly 9–12 new `it()` blocks plus ~6 one-line assertion additions, concentrated
almost entirely in analytics HTTP caching: `ETag`/`Cache-Control` presence, `If-None-Match` → 304,
invalid-bucket 400, unknown-metric 404, and the dashboard item shape (`metricId`, `category_name`,
`series[]`). Plus a few missing 404s and GET-verb 401s. The per-assertion mapping is in
`2026-08-23-todo-newman-vulnerability-chain.md`; re-verify it rather than trusting it, since the
collections may have changed.

**Then delete** — the five collections, both runner scripts, both environment files,
`tests/contract/postman-newman/` entirely, the `newman` devDependency, the `test:contract:local` and
`test:contract:staging` scripts, and the newman artifact upload in `contract_local`. Re-check the
`overrides` block afterwards and remove what is genuinely unused.

**Do not touch** — Schemathesis, `seed-contract-tests.ts` (Schemathesis consumes its output), the
`contract_local` job itself, or `tests/smoke/`.

### The one real capability being traded away

newman exercises a **deployed server over the network** (`start:test` + `wait-on`), while Jest
supertest runs the app in-process. Schemathesis still provides that signal against the same running
server in `contract_local`, and `tests/smoke/run-smoke.mjs` provides it for deployed environments —
so it is covered. But it is a deliberate trade, not a free win, and the PR should say so.

## Current state, verified 2026-08-31

- `dev` @ `b71bacd`, clean, no open feature branches
- `newman@^6.2.2` and `newman-reporter-htmlextra` **removed** — the reporter went in the overrides
  PR; only `newman` itself remains
- Schemathesis selects **37 of 46** operations; the three dummy routes are tagged `Dummy Data`,
  deliberately outside `DEFAULT_TAGS`, so they are documented but not fuzzed. Removing newman must
  not change that count for any reason other than newman's own absence
- `npm audit`: 9 moderate, 0 high/critical — all rooted in `uuid < 11.1.1` via `sequelize`

## Conventions this repo now expects

- **Plan mode** for anything 3+ steps (`.claude/rules/workflow.md`)
- **Conventional Commits**, enforced by a `commit-msg` hook _and_ in CI since PR #74
- **Never blanket-stage.** A `pre-commit` hook rejects staged `.env*`; name explicit paths
- Commit messages go to `$(git rev-parse --git-dir)/COMMIT_DRAFT`, are shown in chat for review, and
  are applied with `git commit -F`. No `Co-Authored-By` or Claude references in messages or PRs
- Branch off `dev`; the user opens PRs and merges — Claude does not commit, push, or open PRs
- Record the outcome in a todo doc under `docs/internal/todos/`

## Verification the PR must show

```bash
npm run lint && npm run typecheck && npm run format:check && npm run docs:openapi:check
npm test
npm run security:delta:gate
npm audit                      # expect the override block to shrink; state the real number

# The one that proves the trap was handled — Schemathesis must still authenticate:
docker compose up -d
npm run build && npm run db:migrate:test
npm run seed:contract-tests    # now explicit, no longer a side effect of the newman runner
npm run test:contract:schemathesis:local   # expect 37/46 selected, all passing
```

The Schemathesis run is the load-bearing check. If it passes without `tmp/contract-seed.json` having
been produced by newman, the seeding was successfully decoupled.
