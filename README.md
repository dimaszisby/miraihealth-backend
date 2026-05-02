# Lakira Backend

REST API backend for Lakira, a personal metrics tracking platform. Built with Express.js, TypeScript, and PostgreSQL using Domain-Driven Design (DDD) with feature slices.

## Tech Stack

- **Runtime**: Node.js 20 (ESM)
- **Framework**: Express.js + TypeScript
- **ORM**: Sequelize (PostgreSQL)
- **Auth**: JWT (RS256 via `jsonwebtoken`)
- **Validation**: Zod
- **Cache**: Redis (`ioredis`)
- **Queue**: RabbitMQ (`amqplib`)
- **Docs**: OpenAPI 3 + Swagger UI

## Prerequisites

- Node.js 20 (`nvm use` will pick the right version from `.nvmrc`)
- Docker & Docker Compose (for PostgreSQL, Redis, and RabbitMQ)

## Quick Start

```bash
# 1. Clone and install dependencies
npm install

# 2. Copy environment template and fill in values
cp .env.example .env

# 3. Start infrastructure services
docker compose up -d

# 4. Run database migrations
npm run migrate:dev

# 5. Start the development server (port 5000)
npm run dev
```

## Available Scripts

| Script                          | Description                              |
| ------------------------------- | ---------------------------------------- |
| `npm run dev`                   | Start development server with hot-reload |
| `npm test`                      | Run unit + integration tests             |
| `npm run test:unit`             | Unit tests only                          |
| `npm run test:integration`      | Integration tests (requires PostgreSQL)  |
| `npm run test:e2e`              | End-to-end tests                         |
| `npm run lint`                  | ESLint check                             |
| `npm run lint:fix`              | ESLint autofix                           |
| `npm run typecheck`             | TypeScript type check                    |
| `npm run build`                 | Compile to `dist/`                       |
| `npm run migrate:dev`           | Run pending migrations (development)     |
| `npm run migrate:undo:dev`      | Undo last migration                      |
| `npm run docs:openapi:generate` | Regenerate OpenAPI spec                  |

## Project Structure

```
src/
├── server.ts                 # App entry point
├── config/                   # Env loading, DB config
├── features/
│   ├── shared/auth/          # Authentication (JWT, register, login, password reset)
│   ├── public/
│   │   ├── metric/           # Metric CRUD
│   │   ├── metric-log/       # Metric log entries
│   │   ├── metric-settings/  # Per-metric configuration
│   │   └── metric-category/  # Metric categories
│   └── analytics/            # Visualization & aggregation queries
├── shared/
│   ├── middleware/           # Rate limiting, error handling, method guard
│   └── infrastructure/       # Queue adapters (RabbitMQ)
└── utils/                    # Logger, Redis client, helpers
```

Each feature slice follows DDD layering: `domain/` → `application/` → `infrastructure/`.

## Environment Configuration

Copy `.env.example` to `.env` and set all required values. The app validates every variable at boot via Zod and crashes early with a descriptive error if required vars are missing.

Key required variables:

| Variable                              | Description                                  |
| ------------------------------------- | -------------------------------------------- |
| `JWT_SECRET`                          | Secret for signing JWT tokens (required)     |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Database credentials (or use `DATABASE_URL`) |

See `.env.example` for the full list with descriptions.

## API Documentation

Swagger UI is served at `/api/v1/docs` (requires auth by default).
The raw OpenAPI JSON is available at `/api/v1/docs/openapi.json`.

Health check: `GET /api/v1/health`

## License

ISC — see [LICENSE](LICENSE).
