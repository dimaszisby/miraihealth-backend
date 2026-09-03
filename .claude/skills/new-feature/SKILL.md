---
name: new-feature
description: Scaffold a complete DDD feature with all layers. Use when the user wants to create a new feature, module, or domain entity in src/features/.
disable-model-invocation: true
argument-hint: "[feature-name] [brief description]"
---

# Scaffold a New DDD Feature

Create a complete feature module at `src/features/$0/` following this project's Domain-Driven Design architecture.

## Steps

1. **Read reference features** to match the exact patterns used in this codebase:
   - `src/features/auth/` — simple feature (entity, use cases, queries, providers)
   - `src/features/metric-log/` — complex feature (cache, access checks, query repos)
   - Read the `.claude/rules/architecture.md` for architectural constraints

2. **Create the domain layer** (`src/features/$0/domain/`):
   - `entities/{EntityName}.ts` — private constructor, `static fromPersistence()` factory, getter methods, business logic methods, `private touch()` for updatedAt
   - `repositories/{EntityName}Repository.ts` — interface defining CRUD + query methods

3. **Create the application layer** (`src/features/$0/application/`):
   - `use-cases/` — one class per write operation, constructor-injected deps (repo + ports), `async execute(input): Promise<Result>`
   - `queries/` — one class per read operation, same pattern
   - `ports/` — interfaces for external services if needed (cache, notifications, etc.)

4. **Create the infrastructure layer** (`src/features/$0/infrastructure/`):
   - `http/schema.zod.ts` — Zod schemas using base rules from `src/constants/zod/zod-rules.ts`, error messages from `ZodMessages` in `src/constants/zod/zod-messages.ts`, OpenAPI metadata via `.openapi()`
   - `http/controller.ts` — use `catchAsync`, `pickValidated`, `successResponse` for success and `throw new AppError(...)` for failures (there is no `errorResponse()`), build feature via `buildXFeature()`
   - `http/router.ts` — factory `createXRouter()`, middleware pipeline: `requireJsonObjectBody()` → `validate(schema)` → `authMiddleware` → handler, then `methodNotAllowed()` catch-alls
   - `http/dto.ts` — response DTOs if needed
   - `persistence/models/{name}.sequelize.ts` — Sequelize model with `registerXModels(sequelize)` and `associateXModels(models)`
   - `persistence/repositories/{Name}RepositorySequelize.ts` — implements domain repository interface
   - `mappers/{Name}Mapper.ts` — `toDomain(sequelizeModel)` and `toPersistence(domainEntity)`, handles `snake_case` ↔ `camelCase`

5. **Create the wiring files**:
   - `feature.ts` — `export const buildXFeature = () => { ... }` instantiating repos, providers, use cases
   - `index.ts` — export `buildXFeature` and `xRouter`/`createXRouter`

6. **Register the feature**:
   - Register Sequelize model in `src/infrastructure/db/models.ts`
   - Mount router in `src/server.ts` under the appropriate API path

7. **Add Zod base rules** if new field types are needed:
   - Add reusable validators to `src/constants/zod/zod-rules.ts` (prefix with `z`)
   - Add error messages to `src/constants/zod/zod-messages.ts` under a new domain key

## Critical Conventions

- All imports use `.js` extensions (ESM)
- Path aliases: `@/*` for `src/*`, `@utils/*`, `@config/*`
- Domain layer has ZERO infrastructure imports
- Use `AppError` for known errors, never raw `throw new Error()`
- Double quotes, semicolons, 2-space indent
- Feature name in kebab-case for directory, PascalCase for classes
