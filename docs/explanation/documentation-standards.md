# Dev Documentation Guidelines

Create a predictable, portfolio-grade document kit for every major engineering topic (tests, CI, infra, migrations, etc.). Each kit lives inside `docs/<domain>/<topic>/` (e.g., `docs/internal/initiatives/tests-1-static-checks/`) and mirrors the structure completed under `docs/internal/initiatives/tests-overhaul/`.

## Purpose & Scope

- Provide a reusable pattern so contributors know **which document answers which question**.
- Capture the lifecycle of a topic: context → plan → execution → decisions/incidents → retro references.
- Keep artifacts under version control with Markdown + checklists for traceability and code-review friendliness.

## Core Principles

1. **Docs-as-code:** store in repo, reviewed via PR, keep diffs small and frequent.
2. **Single source:** each topic owns its README/plan/checklist/ticket; avoid duplicating content across domains—link instead.
3. **Traceability:** every decision or incident references the relevant test suite, CI job, or script and vice versa.
4. **Audience-aware:** begin with a brief purpose + owners + entrypoints; assume readers are engineers joining mid-stream.
5. **Industry-standard sections:** reuse headings such as “Context & Goals”, “Acceptance Criteria”, “Risks”, “Rollback”, mirroring mature RFC/ADR formats.

## Document Kit (per topic)

| Doc                                         | Purpose                                     | Required Sections                                                                          |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `README.md`                                 | High-level orientation + quickstart         | Overview, Scope/In-scope, Commands/API, Environment/Dependencies, Verification, References |
| `<topic>-plan.md`                           | Strategy & sequencing                       | Context & Goals, Phases/Milestones, Success Metrics, Risks & Trade-offs, Open Questions    |
| `<topic>-checklist.md`                      | Execution tracker                           | Phase headers, checkbox tasks, status notes, date/owner when completed                     |
| `<topic>-ticket.md`                         | Work package summary (like an internal RFC) | Summary, Background, Acceptance Criteria, Out of Scope, Stakeholders, Dependencies         |
| `decisions.md` (ADR style)                  | Key architectural/process decisions         | Date, Status, Context, Decision, Options Considered, Consequences, Links                   |
| `incidents.md` (optional)                   | Issues/conflicts during rollout             | Timestamp, Impact, Root Cause, Mitigation, Follow-up actions                               |
| `metrics-tracker.md` or `phaseX-tracker.md` | Quantitative progress                       | Table of targets, owner, status, next action (e.g., coverage %, lint time)                 |

> If a doc is not yet applicable (e.g., no incidents), create the file with a heading + “_No entries yet_” placeholder to signal intent.

## Right-Sizing the Kit

- **Full kit (README + plan + checklist + ticket + decisions + incidents + metrics):** use for initiatives that span multiple weeks, affect CI/process, or require stakeholder sign-off.
- **Standard kit (README + combined plan/ticket + checklist + decisions):** suitable for medium efforts (≈2–5 working days). Merge plan + ticket into `topic-plan.md` but retain headings.
- **Lean kit (README + checklist + decision snippet):** for quick infrastructure sweeps (<2 days). Still log at least one ADR/decision entry explaining the change.
- **Micro entries:** even for single-commit fixes, drop a short note in `decisions.md` or `incidents.md` referencing the commit so future you can trace why the change happened.

## File Naming & Placement

- Use kebab-case with clear prefixes (e.g., `test-structure-plan.md`) so CLI/glob searches group related files alphabetically.
- Place the kit under the closest domain folder: tests (`docs/tests`), architecture (`docs/internal/initiatives`), CI (`docs/ci-cd`), etc.
- If a topic spans multiple domains, host primary docs where the owning team lives and link out to supporting folders (e.g., CI doc referencing `docs/internal/initiatives/tests-1-static-checks/`).
- Reference paths relative to repo root in cross-links for portability (`[link](docs/internal/initiatives/tests-overhaul/test-structure-plan.md)`).

## Workflow for New Topics

1. **Create folder skeleton**
   ```bash
   mkdir -p docs/<domain>/<topic>
   touch docs/<domain>/<topic>/{README.md,<topic>-plan.md,<topic>-checklist.md,<topic>-ticket.md,decisions.md,incidents.md}
   ```
2. **Populate README first** so teammates know why the folder exists.
3. **Draft the plan** (phases, dependencies, guardrails). Reuse content blocks from `docs/internal/initiatives/tests-overhaul/test-structure-plan.md`.
4. **Open the ticket doc** with summary + acceptance criteria; link to the GitHub issue/Jira ID if relevant.
5. **Maintain checklist** as work proceeds; add `commit: <sha>` or branch references to every completed item for traceability in a single-developer workflow.
6. **Tag related docs** (`decisions.md`, `incidents.md`, trackers) with the same commit/branch links so readers can jump straight to the change.
7. **Log decisions/incidents** immediately after they occur; include owner + references to PRs, issues, or Slack threads.
8. **Review & socialize**: mention new docs in PR descriptions and Slack so others know the source of truth.

## Maintenance Expectations

- Update README/plan when scope changes; don’t leave stale instructions.
- Keep checklists honest: unchecked items signal outstanding work even if code shipped.
- For decisions, follow ADR statuses (`Proposed`, `Accepted`, `Superseded`) so future readers know what still applies.
- Incidents should include corrective actions; close the loop by linking to follow-up tasks or tickets.
- When a topic sunsets, add a “Status: Deprecated” section to README and link to the successor document.

### Cadence (Single-Developer Friendly)

- **After every merge/commit batch:** update the checklist entry with the latest SHA, and refresh README sections impacted by the change.
- **Weekly review:** skim the plan/checklist for stale items; move deferred work into a backlog note and note blockers in `decisions.md`.
- **Monthly/major release:** audit `incidents.md` and `metrics-tracker.md` to confirm targets are still relevant and record any trend changes.

## Templates

Use the snippets below as copy/paste starters.

### README Template

```md
# <Topic Name>

## Overview

- Purpose
- Owning squad / DRI

## Scope

- In Scope: …
- Out of Scope: …

## Commands & Tooling

- `npm run …` — description
- External services / env vars

## Verification

- How to run tests/checks locally
- Expected CI jobs/artifacts

## References

- [Plan](./<topic>-plan.md)
- [Checklist](./<topic>-checklist.md)
- Related docs / ADRs / tickets
```

### Plan Template

```md
# <Topic> Plan

## Context & Goals

- …

## Phases / Milestones

1. Phase 0 – …
2. Phase 1 – …

## Success Criteria

- KPI / SLAs / coverage targets

## Risks & Mitigations

- …

## Open Questions

- …
```

### Checklist Template

```md
# <Topic> Checklist

## Phase 0 – …

- [ ] Task — owner (target date)
- [x] Completed Task — link to PR #123
```

### Ticket Template

```md
# Ticket: <Concise goal>

## Summary

…

## Background

…

## Acceptance Criteria

- …

## Out of Scope

- …

## Dependencies / Stakeholders

- …
```

### Decision Log Entry

```md
## ADR-001 — <Decision Title> (Accepted YYYY-MM-DD)

**Context:** …

**Decision:** …

**Options considered:** …

**Consequences:** …
```

### Incident Log Entry

```md
## Incident YYYY-MM-DD — <Title>

- Impact: …
- Detected by: …
- Commit / Branch: `<sha>`
- Root cause: …
- Mitigation: …
- Follow-up actions: …
```

### Metrics Tracker Template

```md
| Metric        | Target | Baseline            | Current             | Owner          | Next Action / Link           |
| ------------- | ------ | ------------------- | ------------------- | -------------- | ---------------------------- |
| Lint duration | < 2m   | 3m 10s (2025-01-05) | 2m 45s (2025-02-10) | @dimaspramudya | Optimize ESLint cache (#123) |
```

Adhering to this guide ensures each future topic—static checks, observability, feature migrations—ships with the same high-quality documentation kit showcased in `docs/internal/initiatives/tests-overhaul/`, reinforcing both team DX and portfolio polish.
