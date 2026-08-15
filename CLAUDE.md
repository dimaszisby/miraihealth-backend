# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lakira Backend is an Express.js REST API built with TypeScript using Domain-Driven Design (DDD) with feature slices. It uses Sequelize ORM with PostgreSQL, JWT authentication, Zod validation, and Redis caching.

**Node version**: 20.x (see `.nvmrc`)
**Module system**: ESM (`"type": "module"`)

## Rules & Conventions

Detailed rules are in `.claude/rules/`:

- `architecture.md` — Feature-Slice DDD patterns, dependency rules, entity conventions
- `code-style.md` — Formatting, naming, ESM imports, logging
- `testing.md` — Jest setup, test structure, coverage thresholds
- `security.md` — Middleware stack, auth flow, rate limiting, sensitive data
- `api-design.md` — HTTP conventions, Zod schemas, DTO patterns
- `database.md` — Sequelize models, migrations, query patterns
- `validation.md` — Input validation rules
- `environment.md` — Env var handling
- `commands.md` — All development, test, build, and migration commands
- `workflow.md` — Plan mode, task management, core principles
- `documentation.md` — Doc kit rules: when to create docs, folder placement, kit sizing, todos convention

## Architecture

Feature-Slice DDD with manual dependency injection. Entry point: `src/server.ts`. Path aliases: `@/*` → `src/*`, `@utils/*`, `@config/*`.

## Documentation

- `docs/internal/initiatives/features/` — Per-feature doc kits (auth, metric, metric-log, etc.)
- `docs/internal/initiatives/` — Infrastructure & architectural topic kits (jwt, rabbitmq, indexing, etc.)
- `docs/internal/dev-log/` — Dev notes, retros, one-off logs
- `docs/internal/todos/` — Ephemeral session TODOs (`YYYY-MM-DD-todo-<title>.md`); user-controlled, may be deleted
- `docs/explanation/documentation-standards.md` — Doc kit templates and sizing rules
- `docs/documentation/architecture/` — Routes, DB schema
- `docs/explanation/testing-strategy.md` — Testing approach
- `docs/reference/ci-pipeline/strategy.md` — CI/CD pipeline details
- `docs/reference/api/` — Generated OpenAPI spec

## Task Defaults

Before proposing model, effort, plan mode, or subagent strategy for a non-trivial task, consult the **effort + model matrix** in user memory (`feedback-effort-model-matrix`). Currently in experimental trial through **2026-07-02** — flag friction (delegation misfires, re-work, context loss) so the review has data.

**Commit & PR ownership:** Claude does not run `git commit`, `git push`, or `gh pr create`. Only the user does these manually. End every completed task with a ready-to-use PR message instead. Full rule: `.claude/rules/workflow.md` § Commit & PR Ownership.
