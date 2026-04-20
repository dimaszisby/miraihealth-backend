# Code Style

## Formatting (Prettier defaults via ESLint)

- Semicolons: always required
- Quotes: double quotes (`"`, with `avoidEscape: true`)
- Indentation: 2 spaces
- Trailing commas: ES5-style (Prettier default)
- Print width: 80 characters (Prettier default)

## ESM Imports

- Always use `.js` extension in import paths, even for TypeScript files (ESM convention)
- Use ES module syntax (`import`/`export`), never CommonJS (`require`/`module.exports`)
- Use path aliases: `@/*` for `src/*`, `@utils/*` for `src/utils/*`, `@config/*` for `src/config/*`

## Naming Conventions

- **Variables/functions**: camelCase (`getUserById`, `isActive`)
- **Classes/types/interfaces**: PascalCase (`AuthUser`, `ResponseDTO`)
- **Constants**: UPPER_SNAKE_CASE (`UUID_PATTERN`, `METRIC_NAME_RULE`)
- **Files**: kebab-case for features/modules, PascalCase for entity classes (`AuthUser.ts`)
- **Feature directories**: kebab-case (`metric-settings`, `metric-log`)
- **Booleans**: `is*` or `has*` prefix (`isPublicProfile`, `goalEnabled` for domain flags)
- **Enum values**: lowercase strings (`"user" | "admin"`, `"manual" | "automatic"`)

## Logging

- Use Winston logger (`src/utils/logger.ts`) in application code
- `console.log` with `[DB PROCESS]`/`[DB ERROR]` prefix is acceptable only in migration files
- ESLint warns on bare `console.log` usage outside migrations/tests/scripts
