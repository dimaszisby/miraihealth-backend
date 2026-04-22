# Common Commands Reference

## Development

```bash
npm run dev                    # Start dev server (tsx watch, port 5000)
docker compose up -d           # Start PostgreSQL + Redis
```

## Build & Run

```bash
npm run build                  # TypeScript compile + resolve path aliases
npm start                      # Production server (dist/server.js)
```

## Testing

```bash
npm test                       # Run unit + integration tests
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests only
npm run test:e2e               # End-to-end tests
npx jest --runInBand --selectProjects unit -- path/to/test  # Single test file
```

Tests use Jest with three projects: `unit`, `integration`, `e2e`. Integration tests require PostgreSQL running. Test server runs on port 4000+workerID.

## Code Quality

```bash
npm run lint                   # ESLint check
npm run lint:fix               # ESLint autofix
npm run format:check           # Prettier check
npm run format:write           # Prettier autofix
npm run typecheck              # TypeScript type check (tsc --noEmit)
```

## Database Migrations

```bash
npm run migrate:dev            # Run migrations (development)
npm run migrate:test           # Run migrations (test)
npm run migrate:undo:dev       # Undo last migration (development)
```

## Security & Docs

```bash
npm run security:delta:check   # Security delta analysis
npm run security:gate:evaluate # Security gate evaluation
npm run docs:openapi:generate  # Generate OpenAPI spec
```
