---
paths:
  - "docs/**"
---

# Documentation Conventions

## Rule: Every Significant Development Gets a Doc Kit

For any feature, infrastructure change, architectural decision, or initiative that spans more than one commit or introduces a new system concern, create a documentation kit under `docs/development/`.

Follow the structure and templates defined in `docs/documentation/dev-documentation-guidelines.md` exactly.

## Folder Placement

Place the kit under the closest context folder inside `docs/development/`:

| Context                         | Folder                                           |
| ------------------------------- | ------------------------------------------------ |
| New feature (domain slice)      | `docs/development/features/<feature-name>/`      |
| Infrastructure / shared tooling | `docs/development/architecture/<topic>/`         |
| Day-to-day dev notes, retros    | `docs/development/dev-log/`                      |
| New context with no match       | Create a new subfolder under `docs/development/` |

## Kit Size by Scope

| Scope                                             | Kit          | Contents                                                                     |
| ------------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| Large initiative (multi-week, affects CI/process) | Full kit     | README + plan + checklist + ticket + decisions + incidents + metrics-tracker |
| Medium effort (2–5 working days)                  | Standard kit | README + plan/ticket (merged) + checklist + decisions                        |
| Small infra change / quick sweep                  | Lean kit     | README + checklist + at least one `decisions.md` entry                       |
| Single-commit fix                                 | Micro entry  | One ADR entry in the nearest `decisions.md` referencing the commit SHA       |

## Mini/Ephemeral Work → `docs/todos/`

For mini-scoped tasks (one-off overhauls, small tooling fixes, session TODOs), use a single ephemeral file:

```
docs/todos/YYYY-MM-DD-todo-<kebab-title>.md
```

- Tracked in git but treated as user-controlled — may be deleted without a follow-up PR.
- Not expected to follow the full doc kit structure.
- If a todo grows into a real initiative, promote it to a proper kit under `docs/development/`.

## When Starting Any Non-Trivial Task

Before writing code, check:

1. Does a doc kit already exist for this topic? If yes, update it.
2. If not, create the folder and at minimum a `README.md` and `decisions.md`.
3. For migrations specifically: drop an ADR entry in `decisions.md` for every schema change, referencing the migration filename.

## Reference

- Guidelines + templates: `docs/documentation/dev-documentation-guidelines.md`
- Example complete kit: `docs/tests/overhaul/` (referenced in guidelines as the gold standard)
