# Documentation Overhaul — Checklist

- **Status:** Proposed — awaiting approval
- **Companion:** [PLAN.md](./PLAN.md)
- **Branch:** create off `dev` (per `.claude/rules/workflow.md`)

Every move uses `git mv` so history survives. Each phase ends with a verification gate; do not
start the next phase until the current gate is green.

---

## Phase 0 — Unblock ✅ DONE (2026-08-16)

- [x] Read `.gitignore:100`. The bare `docs` pattern (comment: "actionlint docs") is unanchored
      and matches a `docs` directory at any depth.
- [x] Determine what actionlint actually creates. **Finding:** actionlint is not wired into
      `package.json` or any workflow — it is a purely manual local tool, and its release tarball
      extracts `actionlint`, `man/`, **and `docs/`** at the extraction root. The rule was added
      2026-02-05 in `cfee189`. Since the collision is on the directory _name_, no anchored form
      can keep it (`/docs/` would still swallow the new tree), so the rule was **removed** and
      replaced with a NOTE explaining why it must not be re-added. The adjacent `actionlint`,
      `actionlint_*.tar.gz`, `man/actionlint.1` rules are retained.
- [x] Create a throwaway `docs/README.md` and confirm it is trackable.

### Additional finding — the pattern was already causing a latent bug

`docs` also matched the **tracked** file `__tests__/integration/docs/swagger.test.ts`:

```
.gitignore:100:docs	__tests__/integration/docs/swagger.test.ts
```

It survived only because it was committed _before_ the rule was added. Any **new** file added to
`__tests__/integration/docs/` would have been silently ignored. Fixed by the same change — this
was worth doing independently of the docs migration.

**Gate — all passed**

```bash
git check-ignore -v --no-index docs/README.md                          # exit 1 → not ignored ✅
git status --short docs/                                               # "?? docs/" → visible ✅
git check-ignore -v --no-index __tests__/integration/docs/swagger.test.ts  # exit 1 → freed ✅
git status --short                                                     # no unintended unignores ✅
```

> Use `--no-index`: plain `git check-ignore` reports exit 1 for already-tracked files regardless
> of the rules, which masks exactly this class of bug.

---

## Phase 1 — Move executables out of the docs tree ✅ DONE (2026-08-16)

> Riskiest phase. Runs first and alone, while `docs/` is otherwise untouched, so any CI
> failure is unambiguously attributable.

### 1a. Move the files

- [x] `git mv docs/internal/initiatives/tests-4-contract-tests/postman-newman/{collections,environments,scripts} tests/contract/postman-newman/`
- [x] `git mv docs/internal/initiatives/tests-4-contract-tests/schemathesis/{scripts,requirements.txt} tests/contract/schemathesis/`
- [x] `git mv tests/contract/hooks/seeded_ids.py tests/contract/hooks/seeded_ids.py`
- [x] Leave all `*.md` prose behind for now — it moves in Phase 3.
- [x] Moved `schemathesis/reports/staging/.gitkeep` to the new location to preserve the
      report-directory placeholder.

### 1b. Re-root the Python package chain

- [x] Create `tests/__init__.py`, `tests/contract/__init__.py`, `tests/contract/hooks/__init__.py`.
- [x] `git rm` the three old `__init__.py` markers.
- [x] `SCHEMATHESIS_HOOKS` default → `tests.contract.hooks.seeded_ids`; `hookFilePath` re-pointed.
- [x] Swept the dotted module path — one extra hit beyond the plan:
      **`docs/how-to/ci-cd/daily-pipeline-playbook.md:155`** carried a copy-pasteable
      `export SCHEMATHESIS_HOOKS=…` with the old module. Updated. (`schemathesis.toml` has no
      path references; no workflow sets the var.)

### 1c. Update every consumer

- [x] `package.json:31,32,33,38` · `backend-ci.yml:309,353,359,432,482` · `.gitignore:93,94`
- [x] `tsconfig.eslint.json` — added `tests/**/*` so ESLint still covers the moved JS.
- [x] Removed the two committed generated Newman reports.
- [x] **Not in the plan:** `.dockerignore` excluded `docs/` and `__tests__/` but not
      `tests/`, so the moved assets would have entered the Docker build context. Added `tests/`.
- [x] **Not in the plan:** internal path math. Both script families compute `repoRoot` by
      counting parent levels, and the depth changed from 5 to 4: - logger import `../../../../../scripts/logger.js` → `../../../../scripts/logger.js` (×4 files) - `run-contract-local.js` `repoRoot`: 4 parents → 3 - schemathesis `repoRoot`: `../../../../..` → `../../../..`; `schemathesisDir` rebuilt - pip-install path in two error messages
      `specPath` still points at `docs/reference/api/` — correct until Phase 3.

### Deviation — `tsconfig.json`, not `tsconfig.eslint.json`

`tsconfig.json:51` already listed `"tests/**/*"` in `include`, a **no-op while no top-level
`tests/` existed**. The move populated it, and with `checkJs: true` + `strict` the four plain
Node scripts produced 29 type errors — they were never type-checked under `docs/`. Added
`"tests/contract/**/*.js"` to `exclude` to preserve prior behavior rather than annotate the
scripts (out of scope).

**Gate — results**

| Check                                  | Result                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `npm run lint`                         | ✅ 0 (needed one `lint:fix` pass for Prettier width)                           |
| `npm run typecheck`                    | ✅ 0                                                                           |
| `npm run format:check`                 | ✅ 0                                                                           |
| `npm run test:unit`                    | ✅ **84 suites / 497 tests** — matches the pre-move audit baseline exactly     |
| `npm run test:unit:security-framework` | ✅ 1 suite / 8 tests                                                           |
| Stale-path sweep (non-`.md`)           | ✅ zero hits for `4-contract-tests` / `contract_hooks`                         |
| Python module resolves                 | ✅ `tests.contract.hooks.seeded_ids` **FOUND**; old path `ModuleNotFoundError` |
| JS `repoRoot` + asset paths            | ✅ all resolve to repo root; all assets present                                |
| Script smoke-load                      | ✅ all 4 load and fail at env validation, not on import/path                   |
| `run-local.js` spec check              | ✅ passes `fs.access(specPath)`, reaches the health check                      |

### Full contract gate — run locally against real infra (Colima/Docker)

The CI `contract_local` job was mirrored end to end: `docker compose up db redis` → `build` →
`docs:openapi:generate` → `db:migrate:test` (26 migrations) → `start:test` on :4000 → both suites.

| Check                                      | Result                                                                                                                                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs:openapi:check` (drift gate)          | ✅ 0 — generator still writes where CI diffs                                                                                                                                                  |
| `npm run test:contract:local` (Newman)     | ✅ **5/5 collections, 60 assertions, 0 failures**                                                                                                                                             |
| Newman reports written                     | ✅ 10 files under `tests/contract/postman-newman/reports/local/`                                                                                                                              |
| `npm run test:contract:schemathesis:local` | ✅ 0 — 38/43 operations selected, **32 generated / 32 passed**                                                                                                                                |
| Schemathesis reports written               | ✅ JUNIT + HAR under `tests/contract/schemathesis/reports/local/`                                                                                                                             |
| **Hook actually executed**                 | ✅ 5 `[schemathesis-hook]` lines from `_debug_case_path` (via `SCHEMATHESIS_HOOK_DEBUG=1`) covering `/auth/register`, `/auth/login`, `/metric-categories`, `/metric-logs`, `/metric-settings` |
| **Negative control**                       | ✅ forcing `SCHEMATHESIS_HOOKS=documents.tests.contract_hooks.seeded_ids` → **exit 1, `ModuleNotFoundError`**                                                                                 |

The negative control is the important one: it proves Schemathesis **fails loudly** on a bad hook
module rather than passing vacuously — so the green run above genuinely loaded the relocated hook.
This fully satisfies the "comparable finding count" gate, which was written before we knew a
cleaner check existed.

### Two more issues found only by running it

- **`__pycache__` was never gitignored.** Importing the hook generates it; previously it landed in
  `tests/contract/hooks/__pycache__/`, now in `tests/`. Never committed only by luck.
  Added `__pycache__/` and `*.py[cod]` to `.gitignore`. Pre-existing gap, exposed by this phase.
- **`PORT` mismatch.** `.env.test.example` ships `PORT=8002`, but the contract scripts default to
  `http://localhost:4000` and `backend-ci.yml:250` sets `PORT: 4000` at job level. A developer
  following the example alone gets a server the contract suite cannot reach. Not changed here
  (pre-existing, outside Phase 1) — **logged as a follow-up**.

### Local environment notes (no repo changes)

All gitignored: `.env`, `.env.test` (from the examples; without them every unit suite fails on a
missing `JWT_SECRET`), `.venv-schemathesis` (Python 3.12 — local `python3` is 3.9.6, CI uses 3.11).

`npm run db:migrate:test` **fails on Node 26** — `.sequelizerc` uses `require()` in a
`"type": "module"` repo, which only works on the mandated Node 20 (`.nvmrc`). Worked around
locally with `--options-path /dev/null --migrations-path src/migrations`. CI is unaffected (Node
20), but anyone on newer Node hits this. **Logged as a follow-up.**

**Commit boundary: Phases 0–1.**

---

## Phase 2 — Rename the docs tree to `docs/` ✅ DONE (2026-08-16)

- [x] `git mv documents docs` — **272 renames** detected by git (123 pure, 149 rename+edit), so
      history follows every file.
- [x] Rewrote the path prefix in **181 files**; all hardcoded consumers updated
      (`package.json:62`, both OpenAPI scripts, both security scripts, `backend-ci.yml`,
      `backend-prd-drift-warning.yml`, `CODEOWNERS`, `pull_request_template.md`, `.gitignore`,
      `.gitattributes`, `.dockerignore`, `tsconfig.eslint.json`, `protect-files.sh`).
- [x] Prose links updated: `README.md`, `CONTRIBUTING.md`, `SAAS-BASE-CHECKLIST.md`, `CLAUDE.md`,
      `.claude/rules/*`, `.claude/skills/*`, `.claude/agents/doc-writer.md`, agent-memory files.

### A prefix sweep is not enough — four path **segments** had no slash

`grep "documents/"` cannot see a path assembled from quoted segments. These were found by
searching for the bare quoted word and would otherwise have broken silently:

| Location                                             | Form                                             |
| ---------------------------------------------------- | ------------------------------------------------ |
| `tsconfig.build.json:9`                              | `"exclude": [… "documents" …]`                   |
| `tests/contract/schemathesis/scripts/run-local.js`   | `path.join(repoRoot, "documents", "openapi", …)` |
| `tests/contract/schemathesis/scripts/run-staging.js` | same                                             |
| `scripts/generate-documentation.ts:12`               | `path.join(__dirname, "../documents")`           |

### Cleanup of rot introduced by Phase 1

Doc prose still pointed at contract assets that Phase 1 moved. Repointed to `tests/contract/**`
in the **actionable** docs only (runbooks, READMEs, pipeline checklists, the CI/CD guide).
**Historical review evidence was deliberately left untouched** — e.g. the 2025-12-14 consistency
checklist records "runner script missing at `…/run-contract-local.js`" as an observation made at
the time; rewriting it would falsify the record. Same for the superseded
`test-structure-concern.md`, which quotes `package.json` as it then was.

Also removed two dead entries from `docs/README.md`: the "Root Files" table (both rows pointed at
files that no longer exist) and the two remaining `LLM_CONTEXT.md` references — the most visible
broken link in the tree, since the file opened by telling every reader and agent to read it first.

> **Watch for sed self-corruption.** The sweep rewrote this checklist too, turning the Phase 2
> heading into "Rename `docs/` → `docs/`" and its own gate command into a grep for `docs/`.
> Passages that describe the _pre-migration_ state must keep saying `documents/`; restored here
> and in PLAN.md §4.

**Gate — results**

| Check                                         | Result                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `grep -rn "documents/"` repo-wide             | ✅ **0 hits**                                                            |
| `npm run lint` / `typecheck` / `format:check` | ✅ 0                                                                     |
| `npm run test:unit`                           | ✅ 84 suites / 497 tests                                                 |
| `npm run test:unit:security-framework`        | ✅ 1 suite / 8 tests                                                     |
| `npm run docs:openapi:check`                  | ✅ 0 — generator writes to `docs/reference/api/`, CI diffs the same path |
| `npm run test:contract:local`                 | ✅ 5/5 collections, 60 assertions, 0 failures                            |
| `npm run test:contract:schemathesis:local`    | ✅ 38/43 operations, 32/32 passed, 5 hook traces                         |
| Security scripts + Jest schema gate           | ✅ all three `docs/security/**` paths resolve                            |

Re-running both contract suites mattered here: `specPath` in the Schemathesis runners now
resolves `docs/reference/api/lakira-backend-openapi.json`, and the runner aborts on `fs.access` if the
spec is missing — so a green run proves the new path resolves.

### Prettier reformatted 8 files under the schema-validated `docs/security/**`

`documents/` → `docs/` is 5 characters shorter, so Prettier re-flowed every markdown table
containing a path. `.claude/lessons.md` forbids restructuring these files (a Jest suite validates
their columns), so the diff was proven safe before accepting it: normalising away the
substitution and table-rule padding left **162 changed lines matching exactly**, and
`test:unit:security-framework` passes. No column, header, or row was lost.

**Commit boundary: Phase 2.**

---

## Phase 3 — Reshape into Diátaxis quadrants ✅ DONE (2026-08-16)

Result: **45 shipped files** across the four quadrants, **224 files** fenced under `internal/`.

### 3a. `internal/`

- [x] `initiatives/` ← 13 architecture kits, the feature kits, 4 test-layer kits, `tests-overhaul`,
      and the CI pipeline plan/checklist/backlog.
- [x] `audits/saas-readiness/` and `audits/security/` — **moved, not archived**; saas-readiness
      tracks open P0s.
- [x] `incidents/`, `dev-log/`, `todos/`, and `archive/` (code reviews, product genesis, Jenkins
      notes, superseded test plans, docker runner plan).
- [x] `archive/frontend/` ← the frontend CI/CD tree and both frontend PRDs — they document a
      separate Next.js repository.
- [x] `internal/README.md` written: states the fork prune, points at the quadrants, and warns that
      saas-readiness is live risk rather than history.

### 3b–3d. The four quadrants

- [x] `reference/` — `api/` (generated spec), `security/` (framework + `audit-run-template/`),
      `database-schema.md`, `environments.md`, `ci-pipeline/`, `branch-protection.md`,
      `frontend-handoff.md`.
- [x] `how-to/` — `development/`, `testing/`, `ci-cd/`, `security/`.
- [x] `explanation/` — `architecture/` (3 durable references lifted out of the migration kit),
      `testing-strategy.md`, `product-requirements.md`, `documentation-standards.md`.
- [x] `tutorials/README.md` placeholder — git cannot track an empty directory, so the quadrant
      would not exist for anyone else until Phase 7 fills it.

### Deviations from the plan

- **`reference/ci-pipeline/` is a directory, not a single `ci-pipeline.md`.** The plan called for
  merging `CI_CD_STRATEGY` + `backend/README` + `PIPELINE_PLAN` + `WORKFLOW_GUIDELINES` into one
  file — roughly 1,260 lines. Kept as `strategy.md`, `pipeline-overview.md`, and
  `workflow-guidelines.md`; the plan document went to `internal/initiatives/ci-pipeline/`.
- **`branch-protection.md` went to `reference/`, not `internal/`.** It is a durable ruleset
  reference, not a record of past work.
- **Phase 4 pruning was pulled forward** (the plan already groups 3–4 in one commit) so no legacy
  `documentation/`, `development/`, `ci-cd/`, `tests/`, `docker/` directories were left standing.

### The move breaks every cross-reference — a 47-rule remap was required

Relocating the tree beneath its own documents invalidated their internal links. Rebuilt with an
ordered, most-specific-first `sed` script applied to 168 files. The failure that surfaced it:

`security-framework.validation.test.ts` failed on _"audit index links valid run folders"_ —
`docs/internal/audits/security/index.md` stores **repo-root-relative** folder paths in a table
column, and the test resolves them with `path.join(ROOT, folderPath)`. A structural doc move
therefore breaks a **test**, not just a link. Green again after the remap.

Two classes the remap could not see, fixed separately:

- **Relative kit-internal links** (`../references/shared-middleware.md`) — invisible to an
  absolute-path regex. Rewritten to repo-root-relative form, per the convention in
  `explanation/documentation-standards.md`.
- **`CODEOWNERS` guarded `docs/security/**`\*\*, which no longer exists. Security content is now
  split three ways by purpose, so all three paths are listed explicitly — otherwise the security
  tree would have silently lost its required reviewer.

---

## Phase 4 — Prune ✅ DONE (2026-08-16)

- [x] `lakira-backend-types.md` (2,065 lines of copy-pasted `src/types/`) — deleted.
- [x] `lakira-backend-routes.md` (390 lines, zero organization routes) — deleted; superseded by
      the generated, CI-gated spec.
- [x] `metric-feature-codes-ARCHIVED` + `metric-category-feature-codes-ARCHIVED` (2,881 lines of
      raw source dump) — deleted.
- [x] `scripts/generate-documentation.ts` and `scripts/generate-export-reference.ts` — deleted;
      no npm script or workflow referenced either.
- [x] `.gitignore` rule for `code-for-export-reference/` removed with the script that wrote it.

**5,815 deletions** across 273 files.

**Gate — results**

| Check                                 | Result                                                            |
| ------------------------------------- | ----------------------------------------------------------------- |
| `lint` / `typecheck` / `format:check` | ✅ 0                                                              |
| `test:unit`                           | ✅ 84 suites / 497 tests                                          |
| `test:unit:security-framework`        | ✅ 8 tests — passes against relocated audit + template roots      |
| `docs:openapi:check`                  | ✅ 0 — generator and CI diff both follow to `docs/reference/api/` |
| `test:contract:local`                 | ✅ 5/5 collections, 60 assertions, 0 failures                     |
| `test:contract:schemathesis:local`    | ✅ 38/43 operations, 32/32 passed, 5 hook traces                  |

Contract suites were re-run because `specPath` moved again, to
`docs/reference/api/lakira-backend-openapi.json`.

**Commit boundary: Phases 3–4.**

---

## Phase 5 — Rewrite the reference layer

- [ ] `reference/database-schema.md` — rewrite from `src/migrations/` (26 migrations). Must cover
      all current tables including `organizations`, `memberships`, `organization_invites`,
      `refresh_tokens`, `email_verification_tokens`, `processed_messages`. Remove `enum_users_role`
      (dropped in `20260516000001-drop-users-role-column.cjs`). Stamp "as of migration `<latest id>`".
- [ ] `reference/api/README.md` — new: Swagger UI at `/api/v1/docs`, raw spec at
      `/api/v1/docs/openapi.json`, regeneration command, and a "do not hand-edit" note matching
      `protect-files.sh`.
- [ ] `reference/configuration.md` — new: env var table from `.env.example` + `src/config/envManager.ts`,
      noting the `SENSITIVE_KEY_PATTERN` redaction behavior.
- [ ] `reference/commands.md` — new: promote `.claude/rules/commands.md` content; make the rule file
      a pointer so there is one source.
- [ ] Note the undocumented `/api/v1/admin/_ping` route — either register it in
      `src/lib/openapi/openapi-docs.ts` or record why it is intentionally absent.

**Gate**

```bash
# every table named in database-schema.md exists in a migration, and vice versa
npm run migrate:dev && psql -c '\dt'   # cross-check against the doc
```

---

## Phase 6 — Build the ADR registry

- [ ] Triage all 52 entries across the 19 `decisions.md` files into **architecture** (promote) vs
      **process/scheduling** (leave in the kit). Expect roughly 30 promotions.
- [ ] Assign global numbers by original decision date so the registry reads chronologically.
- [ ] Split each promoted entry into `docs/explanation/decisions/adr-NNNN-<slug>.md` using the
      Nygard template. Bodies already carry Context / Decision / Status / Options considered /
      Consequences / Links — **preserve statuses verbatim**.
- [ ] ADR-009, ADR-010, ADR-011 (saas-readiness) enter as **Proposed**. They are not implemented;
      the cache-key P0 is still live in `VisualizationCacheRedis.ts`.
- [ ] Backfill the placeholder `YYYY-MM-DD` dates in `feature-audience-restructure/decisions.md`
      from git history, and correct that kit's status — the work shipped, the doc says "Planning".
- [ ] Leave `ADR-SEC-*` entries with their audit runs under `internal/audits/security/`.
- [ ] Leave a one-line stub at each promoted entry's original location pointing at its new number,
      so existing cross-references keep resolving.
- [ ] Write `docs/explanation/decisions/README.md` — index table: № · title · status · date · supersedes.

**Gate**

- [ ] No ADR number appears twice in `docs/explanation/decisions/`.
- [ ] Every `Superseded` entry names its successor; every promoted entry has a resolving stub.

**Commit boundary: Phases 5–6.**

---

## Phase 7 — Author new content

- [ ] `explanation/architecture/c4-context.md` — L1 mermaid: users, the API, and external systems.
- [ ] `explanation/architecture/c4-containers.md` — L2 mermaid: `src/server.ts` API, `src/worker.ts`
      consumer, Postgres, Redis, RabbitMQ, mail provider.
- [ ] `explanation/architecture/c4-components-auth.md` — L3 mermaid for `src/features/shared/auth/`,
      including Organization / Membership / OrganizationInvite and the `TokenProvider` port.
- [ ] `explanation/architecture/README.md` — index tying the three levels together.
- [ ] `tutorials/getting-started.md` — clone → `docker compose up -d` → migrate → `npm run dev` →
      register → authenticated request. Every command copy-pasteable and actually run once.
- [ ] `tutorials/your-first-feature-slice.md` — walk one slice end to end against a real example
      (`src/features/public/metric-category/` is the smallest complete one).
- [ ] `tutorials/fork-and-rebrand.md` — from `README.md` §Forking + the forkability kit.
- [ ] `docs/README.md` — the Diátaxis map and single "start here".

Use mermaid throughout — it renders natively on GitHub with no toolchain.

**Gate**

- [ ] Run every command in `getting-started.md` from a clean clone. It must work verbatim.
- [ ] All mermaid blocks render (check the GitHub preview on the pushed branch).

**Commit boundary: Phase 7.**

---

## Phase 8 — Realign the rules

- [ ] Rewrite `.claude/rules/documentation.md`: frontmatter `paths: ["docs/**"]`, and a placement
      table keyed on **Diátaxis quadrant**, not artifact type.
- [ ] Rewrite the placement rules in `.claude/agents/doc-writer.md` to match **exactly**. This is
      the contradiction that produced the two architecture trees — the two files must agree.
- [ ] Update `CLAUDE.md` §Documentation to the new tree.
- [ ] Rewrite `docs/explanation/documentation-standards.md`: keep the doc-kit pattern for
      `internal/initiatives/`, and add the Diátaxis rule for the shipped quadrants.
- [ ] Point `.claude/rules/commands.md` at `docs/reference/commands.md`.
- [ ] Update `.claude/rules/{security,validation,workflow}.md` and both `SKILL.md` files.

**Gate**

- [ ] The placement tables in `.claude/rules/documentation.md` and `.claude/agents/doc-writer.md`
      are byte-comparable — same destinations for the same inputs.

---

## Phase 9 — Fork-proofing

- [ ] Add a prune step to `scripts/bootstrap-fork.sh`: remove `docs/internal/` by default, with a
      `--keep-internal` escape hatch. Report what was removed.
- [ ] Make `__tests__/unit/security/security-framework.validation.test.ts` treat a missing or empty
      `AUDIT_ROOT` as a **pass**, while still validating `TEMPLATE_ROOT`. Without this, a fresh fork
      has a red test suite.
- [ ] Make `scripts/security/init-audit-doc-kit.mjs` create the audit directory when absent.
- [ ] Update `README.md` §Forking to mention the docs prune.

**Gate — full fork dry-run**

```bash
git clone . /tmp/fork-dryrun && cd /tmp/fork-dryrun
./scripts/bootstrap-fork.sh --name tmp-app
test ! -d docs/internal && echo "internal pruned"
npm ci && npm run typecheck && npm run test:unit    # must be GREEN
```

**Commit boundary: Phases 8–9.**

---

## Final verification

- [ ] `npm run lint && npm run typecheck && npm run format:check` — clean.
- [ ] `npm test` — run as the project defines it (`test:unit` then `test:integration`). A combined
      `--selectProjects unit integration` run under `SKIP_DB_LIFECYCLE=true` produces **false**
      failures; do not use it.
- [ ] `npm run docs:openapi:check` — exit 0.
- [ ] `npm run test:contract:local` and `npm run test:contract:schemathesis:local` — pass.
- [ ] `npm run security:delta:gate` and `npm run test:unit:security-framework` — pass.
- [ ] **Link sweep: broken internal references 30 → 0.**

```bash
grep -rhoE '(docs)/[A-Za-z0-9._/-]+\.(md|json|ts|js|mjs|py|yml)' docs *.md .claude \
  | sort -u | while read p; do [ -e "$p" ] || echo "BROKEN: $p"; done
```

- [ ] Push the branch; `backend-ci.yml` green end to end, including the artifact-upload steps that
      reference the moved report paths.
- [ ] Fork dry-run green (Phase 9 gate).

---

## Follow-ups (explicitly out of scope)

Surfaced during the audit; each deserves its own ticket:

- [ ] **Open P0s** — ADR-009/010/011 remain unimplemented. `VisualizationCacheRedis.ts` cache keys
      lack `organizationId`; `DISABLE_RATE_LIMITING` has no production guard.
- [ ] `security/audit/audit-2026-05-18/` is still marked "Planned" — three months past its scheduled
      execution date, with the next quarterly cycle now due.
- [ ] `express-openapi-validator` is a declared dependency with zero imports anywhere in `src/`.
- [ ] `/api/v1/admin/_ping` is served but unregistered in the OpenAPI spec.
- [ ] `docs/internal/todos/2026-06-04-*.md` carries an unchecked "2026-07-02 review" item, now ~6 weeks
      overdue.

Surfaced while running the Phase 1 gate on real infrastructure:

- [ ] **`.sequelizerc` breaks on Node > 20.** It uses `require()` while `package.json` sets
      `"type": "module"`, so `npm run db:migrate:test` dies with
      `ReferenceError: require is not defined in ES module scope` on Node 22+/26. CI is fine
      (Node 20), but any contributor on a newer runtime is blocked. Fix: rename to
      `.sequelizerc.cjs`, or convert it to ESM.
- [ ] **`PORT` mismatch between the example env and the contract suite.**
      `.env.test.example` ships `PORT=8002`; the contract scripts default to
      `http://localhost:4000/api/v1` and `backend-ci.yml:250` sets `PORT: 4000`. Following the
      example alone produces a server the contract tests cannot reach. Fix: set `PORT=4000` in
      `.env.test.example`, or make the scripts read `PORT`.
