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
      2026-02-05 in `cfee189`. Since the collision is on the directory *name*, no anchored form
      can keep it (`/docs/` would still swallow the new tree), so the rule was **removed** and
      replaced with a NOTE explaining why it must not be re-added. The adjacent `actionlint`,
      `actionlint_*.tar.gz`, `man/actionlint.1` rules are retained.
- [x] Create a throwaway `docs/README.md` and confirm it is trackable.

### Additional finding — the pattern was already causing a latent bug

`docs` also matched the **tracked** file `__tests__/integration/docs/swagger.test.ts`:

```
.gitignore:100:docs	__tests__/integration/docs/swagger.test.ts
```

It survived only because it was committed *before* the rule was added. Any **new** file added to
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

## Phase 1 — Move executables out of the docs tree

> Riskiest phase. Runs first and alone, while `documents/` is otherwise untouched, so any CI
> failure is unambiguously attributable.

### 1a. Move the files

- [ ] `git mv documents/tests/4-contract-tests/postman-newman/{collections,environments,scripts} tests/contract/postman-newman/`
- [ ] `git mv documents/tests/4-contract-tests/schemathesis/{scripts,requirements.txt} tests/contract/schemathesis/`
- [ ] `git mv documents/tests/contract_hooks/seeded_ids.py tests/contract/hooks/seeded_ids.py`
- [ ] Leave all `*.md` prose behind for now — it moves in Phase 3.

### 1b. Re-root the Python package chain

- [ ] Create `tests/__init__.py`, `tests/contract/__init__.py`, `tests/contract/hooks/__init__.py`,
      carrying over the explanatory docstrings from the originals.
- [ ] `git rm documents/__init__.py documents/tests/__init__.py documents/tests/contract_hooks/__init__.py`
- [ ] Update the `SCHEMATHESIS_HOOKS` default in `tests/contract/schemathesis/scripts/run-local.js:26`:
      `documents.tests.contract_hooks.seeded_ids` → `tests.contract.hooks.seeded_ids`
- [ ] Grep for any other occurrence of the dotted module path (CI/CD guide §7, `schemathesis.toml`,
      workflow env blocks) and update each.

### 1c. Update every consumer

- [ ] `package.json:31,32,33,38` — four `test:contract:*` script paths.
- [ ] `.github/workflows/backend-ci.yml:309` — pip `requirements.txt` path.
- [ ] `.github/workflows/backend-ci.yml:353,359,432,482` — four artifact-upload report paths.
- [ ] `.gitignore:93,94` — report directories → `tests/contract/**/reports/`.
- [ ] `tsconfig.eslint.json:12` — add `tests/**/*` alongside (or in place of) `documents/**/*`.
- [ ] `git rm --cached` the two committed generated reports
      (`postman-newman/reports/staging/newman-analytics-staging.{html,xml}`) — they are build
      artifacts that predate the ignore rule.

**Gate**

```bash
npm run lint && npm run typecheck && npm run format:check
npm run test:contract:local
npm run test:contract:schemathesis:local     # must load the hook, not pass vacuously
```

- [ ] Confirm the Schemathesis run reports a **comparable finding/case count to before** — a
      silently-unloaded hook module produces a suspiciously fast, empty run.

**Commit boundary: Phases 0–1.**

---

## Phase 2 — Rename `documents/` → `docs/`

- [ ] `git mv documents docs`
- [ ] Sweep and update every hardcoded path (see PLAN.md §5). Working through the table:
  - [ ] `package.json:62` (OpenAPI diff target)
  - [ ] `scripts/generate-openapi.ts:13`, `scripts/normalize-openapi.ts:11`
  - [ ] `scripts/security/evaluate-gate.mjs:10`
  - [ ] `scripts/security/init-audit-doc-kit.mjs:7,8,113`
  - [ ] `.github/workflows/backend-ci.yml:101`
  - [ ] `.github/workflows/backend-prd-drift-warning.yml:70,75,96`
  - [ ] `.github/CODEOWNERS:3`
  - [ ] `.github/pull_request_template.md:23,24`
  - [ ] `.gitignore:97` · `.gitattributes:1` · `.dockerignore:9` · `tsconfig.eslint.json:12`
  - [ ] `.claude/hooks/protect-files.sh:62`
- [ ] Update prose links: `README.md`, `CONTRIBUTING.md:48`, `SAAS-BASE-CHECKLIST.md` (7 links),
      `CLAUDE.md`, `.claude/rules/*.md`, `.claude/skills/*/SKILL.md`,
      `__tests__/unit/features/analytics/README.md`.

**Gate**

```bash
grep -rn "documents/" --exclude-dir=node_modules --exclude-dir=.git . | grep -v "^./docs/"
# expected: zero hits
npm run lint && npm run typecheck && npm test
npm run docs:openapi:check                   # proves the generator writes where CI diffs
npm run test:unit:security-framework         # proves the gate policy + template paths resolve
git log --follow docs/README.md | head       # history survived the rename
```

**Commit boundary: Phase 2.**

---

## Phase 3 — Reshape into Diátaxis quadrants

Create `docs/{tutorials,how-to,reference,explanation,internal}/` and move with `git mv`.

### 3a. `internal/` first (largest volume, lowest risk)

- [ ] `initiatives/` ← all 15 kits under `development/architecture/` **except** `saas-readiness/`,
      plus the feature kits under `development/features/`, the four `tests/N-*/` kits,
      `tests/overhaul/`, and `ci-cd/backend/{GITHUB_ACTIONS_PIPELINE_CHECKLIST,FOLLOW_UP_BACKLOG}.md`
- [ ] `audits/saas-readiness/` ← `development/architecture/saas-readiness/` (**moved, not archived** — holds open P0s)
- [ ] `audits/security/` ← `security/audit/` (3 dated runs + `index.md`)
- [ ] `incidents/` ← `incidents/` · `dev-log/` ← `development/dev-log/` · `todos/` ← `todos/`
- [ ] `archive/` ← `code-review/`, `product/archive/`, `ci-cd/backend/JENKINS_NOTES.md`,
      `development/architecture/test/`, the three archived-stub `tests/*-2025-12-22.md` files,
      `documentation/backend-documentation-plan.md`, `product/lakira-backend-prd-outline.md`
- [ ] `archive/frontend/` ← `ci-cd/frontend/` (except the handoff doc), `product/lakira-frontend-prd*.md`,
      `development/features/analytics/analytics-frontend-*`, `visualization-frontend-analysis.md`
- [ ] Write `docs/internal/README.md` stating plainly that this tree is removed on fork.

### 3b. `reference/`

- [ ] `api/lakira-backend-openapi.json` ← `openapi/` ⚠ update `generate-openapi.ts`,
      `normalize-openapi.ts`, `package.json:62`, `.gitattributes`, `protect-files.sh`,
      `backend-prd-drift-warning.yml` **in the same commit**
- [ ] `security/` ← `security/framework/*` + `security/templates/audit-run/` → `security/audit-run-template/`
      ⚠ update `evaluate-gate.mjs`, `init-audit-doc-kit.mjs`, and the security Jest test
- [ ] `security/dependency-policy.md` ← `security/DEPENDENCY_POLICY.md`; split the appended
      "Current Audit Snapshot (2026-01-19)" section out to `internal/audits/security/`
- [ ] `environments.md` ← `ci-cd/backend/ENVIRONMENTS_MATRIX.md`
- [ ] `ci-pipeline.md` ← merge `ci-cd/CI_CD_STRATEGY.md` + `ci-cd/backend/{README,GITHUB_ACTIONS_PIPELINE_PLAN,GITHUB_ACTIONS_WORKFLOW_GUIDELINES}.md`
- [ ] `frontend-handoff.md` ← `ci-cd/frontend/BACKEND_HANDOFF_FOR_FE_CICD.md`

### 3c. `how-to/`

- [ ] `development/regenerate-the-openapi-spec.md` ← `documentation/openapi-zod-guide.md`
      (fix its dead §5 link to the non-existent `openapi-documentation-plan.md`)
- [ ] `development/run-postgres-in-docker.md` ← `docker/postgres-docker-guide.md`
      (fix its dead reference to `documents/analytics/...`)
- [ ] `testing/run-the-test-suites.md` ← `tests/README.md` + the four layer READMEs' command sections
- [ ] `testing/contract-testing.md` ← merge the 7 prose files left behind in Phase 1
      (`4-contract-tests/README.md`, `seed-strategy.md`, `postman-newman/{README,PIPELINE_OVERVIEW,STAGING_RUNBOOK,WORKFLOW_GUIDELINES}.md`, `schemathesis/README.md`)
- [ ] `ci-cd/daily-pipeline-playbook.md` ← `ci-cd/CI_CD_DEVELOPER_SIMPLIFIED_GUIDE.md`
- [ ] `security/{run-a-security-audit,release-delta-sop,audit-branch-model}.md` ← `security/guides/*`

### 3d. `explanation/`

- [ ] `architecture/{feature-slice-ddd,persistence-and-orm,shared-middleware}.md`
      ← `feature-vertical-slice-migration/references/*`
- [ ] `architecture/{multi-tenancy,auth-and-tokens,async-messaging,observability}.md`
      ← the durable half of the corresponding kit READMEs (the plan/checklist half stays in `internal/`)
- [ ] `testing-strategy.md` ← `tests/TESTING_STRATEGY.md` (verified current — move as-is)
- [ ] `product-requirements.md` ← `documentation/product/lakira-backend-prd.md`
      ⚠ update `backend-prd-drift-warning.yml:70,96`
- [ ] `documentation-standards.md` ← `documentation/dev-documentation-guidelines.md`
      (rewritten for Diátaxis in Phase 8)

**Gate**

```bash
npm test && npm run docs:openapi:check
npm run security:delta:gate && npm run test:unit:security-framework
```

---

## Phase 4 — Prune

- [ ] `git rm docs/.../lakira-backend-types.md` (2,065 lines of copy-pasted `src/types/` source)
- [ ] `git rm docs/.../lakira-backend-routes.md` (390 lines, zero org routes — superseded by the spec)
- [ ] `git rm docs/internal/archive/code-review/metric-feature-codes-ARCHIVED-20251208.md` (1,206)
- [ ] `git rm docs/internal/archive/code-review/metric-category-feature-codes-ARCHIVED-20251208.md` (1,675)
- [ ] `git rm scripts/generate-documentation.ts` (writes a non-existent file, no npm script calls it)
- [ ] `git rm scripts/generate-export-reference.ts` (~22 paths into a gitignored, absent directory)
- [ ] `.gitignore:97` — drop the now-meaningless `code-for-export-reference/` rule

**Gate**

```bash
npm run lint && npm run typecheck && npm test
grep -rn "generate-export-reference\|generate-documentation" package.json scripts .github  # zero hits
```

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
- [ ] `documents/todos/2026-06-04-*.md` carries an unchecked "2026-07-02 review" item, now ~6 weeks
      overdue.
