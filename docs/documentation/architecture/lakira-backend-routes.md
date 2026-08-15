# Lakira Backend API Routes

- **Base URL (all environments):** `/api/v1`
- **Auth:** JSON Web Token (JWT) via `Authorization: Bearer <token>`
- **Content-Type:** `application/json`
- **OpenAPI / Swagger UI:** `GET /api/v1/docs`
- **OpenAPI JSON (offline):** `docs/openapi/lakira-backend-openapi.json`

This document is aimed at the Lakira frontend (Next.js) project as a practical reference for calling the backend.

> For detailed field-level validation rules and DTOs, see  
> `docs/documentation/architecture/lakira-backend-types.md`.

---

## Overview of Route Groups

| Group              | Prefix                      | Auth                | Notes                                     |
| ------------------ | --------------------------- | ------------------- | ----------------------------------------- |
| Auth               | `/api/v1/auth`              | Public + JWT        | Register, login, profile, logout          |
| Metrics            | `/api/v1/metrics`           | JWT                 | Create/list/update/delete metrics, trends |
| Metric Categories  | `/api/v1/metric-categories` | JWT                 | CRUD for metric categories                |
| Metric Settings    | `/api/v1/metric-settings`   | JWT                 | Goal, alert, display settings per metric  |
| Metric Logs        | `/api/v1/metric-logs`       | JWT                 | Create/list/update/delete logs, stats     |
| Analytics          | `/api/v1/analytics`         | JWT                 | Dashboard and per-metric visualizations   |
| API Docs (Swagger) | `/api/v1/docs`              | Public or JWT (env) | Interactive API reference                 |

---

## Authentication & Headers

- All **protected** routes require:
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type: application/json` (for requests with bodies)
- Tokens are returned by auth routes (`/auth/register`, `/auth/login`).
- CORS origin is configured via backend env (`CORS_ORIGIN`, default `http://localhost:3000`).

---

## 1. Auth Routes – `/api/v1/auth`

### Summary

| Method | Path        | Auth   | Rate Limit        | Description                          |
| ------ | ----------- | ------ | ----------------- | ------------------------------------ |
| POST   | `/register` | Public | Standard (global) | Register a new user and return token |
| POST   | `/login`    | Public | `userRateLimiter` | Login and return token               |
| GET    | `/profile`  | JWT    | Standard (global) | Get current user profile             |
| PUT    | `/profile`  | JWT    | `userRateLimiter` | Update current user profile          |
| POST   | `/logout`   | JWT    | Standard (global) | Logical logout (client clears token) |

### Request & Response Shapes (high-level)

#### POST `/api/v1/auth/register`

- **Body**

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secret123",
  "passwordConfirmation": "secret123",
  "isPublicProfile": true
}
```

- **Response 201**

```json
{
  "data": {
    "token": "<JWT_TOKEN>",
    "user": {
      "id": "uuid",
      "username": "alice",
      "email": "alice@example.com",
      "isPublicProfile": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  },
  "message": "User created successfully"
}
```

#### POST `/api/v1/auth/login`

- **Body**

```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

- **Response 200**

```json
{
  "data": {
    "token": "<JWT_TOKEN>",
    "user": {
      "id": "uuid",
      "username": "alice",
      "email": "alice@example.com",
      "isPublicProfile": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

#### GET `/api/v1/auth/profile`

- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response 200** – user profile (same shape as above, without token).

#### PUT `/api/v1/auth/profile`

- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Body (all fields optional)** – any subset of:

```json
{
  "username": "new-name",
  "email": "new-email@example.com",
  "password": "newPassword123",
  "isPublicProfile": false
}
```

---

## 2. Metric Routes – `/api/v1/metrics`

All metric routes are **protected** and use `authMiddleware`.

### Summary

| Method | Path                | Auth | Description                                        |
| ------ | ------------------- | ---- | -------------------------------------------------- |
| POST   | `/`                 | JWT  | Create a metric                                    |
| GET    | `/`                 | JWT  | List metrics (cursor-based pagination)             |
| GET    | `/:id`              | JWT  | Get metric detail (optional includes & logs)       |
| PUT    | `/:id`              | JWT  | Update metric                                      |
| DELETE | `/:id`              | JWT  | Delete metric                                      |
| GET    | `/:metricId/trends` | JWT  | Get trend data for a metric                        |
| POST   | `/dummy` (optional) | JWT  | Generate dummy metrics (enabled only in some envs) |

> Note: `/dummy` endpoints are primarily for testing and should not be used by the production frontend unless explicitly intended.

### Create Metric – POST `/api/v1/metrics`

- **Body**

```json
{
  "categoryId": "uuid-or-null",
  "originalMetricId": "uuid-or-null",
  "name": "Steps",
  "description": "Daily step count",
  "defaultUnit": "steps",
  "isPublic": false
}
```

### List Metrics (Cursor) – GET `/api/v1/metrics`

Supported **query params** (all optional):

- `limit` (number, `1–100`, default `20`)
- `sort` (string; e.g. `-createdAt`, `createdAt`, `-name`, `-logCount`)
- `q` (string; free-text search on metric name)
- `after` (string; cursor token from previous response)
- `includeTotal` (`true`/`false`; default `false`)
- Filters (either form is accepted):
  - `filter[name]` or `filter.name`
  - `filter[categoryId]` or `filter.categoryId`

### Get Metric Detail – GET `/api/v1/metrics/:id`

Query options:

- `include`:
  - `"flat"` (default) – basic metric only
  - `"full"` – includes `settings`, `category`, `logs`
  - CSV subset, e.g. `"settings,logs"`
- `logsLimit` – number of logs to include (1–200, default `20`).

### Metric Trends – GET `/api/v1/metrics/:metricId/trends`

- Path param: `metricId` (UUID).
- No body; query params are minimal and validated server-side.

---

## 3. Metric Category Routes – `/api/v1/metric-categories`

All routes are **protected** and use `authMiddleware`.

### Summary

| Method | Path     | Auth | Description                              |
| ------ | -------- | ---- | ---------------------------------------- |
| POST   | `/`      | JWT  | Create a metric category                 |
| GET    | `/`      | JWT  | List metric categories (cursor-based)    |
| GET    | `/:id`   | JWT  | Get category by id                       |
| PUT    | `/:id`   | JWT  | Update category                          |
| DELETE | `/:id`   | JWT  | Delete category                          |
| POST   | `/dummy` | JWT  | Generate dummy categories (testing only) |

### List Categories – GET `/api/v1/metric-categories`

Supported **query params**:

- `limit` (1–100, default `20`)
- `sort` (e.g. `-createdAt`, `name`, `-metricCount`)
- `q` – free-text search
- `filter[name]` – exact or partial name filtering
- `after` – cursor token
- `includeTotal` (`true` / `false`)

### Create / Update Category

Body fields:

- `name` – category label (e.g. `"Health"`)
- `color` – color code for UI (e.g. `"#00B894"`)
- `icon` – icon identifier/name for UI.

---

## 4. Metric Settings Routes – `/api/v1/metric-settings`

All routes are **protected** and use `authMiddleware`.

### Summary

| Method | Path           | Auth | Description                                      |
| ------ | -------------- | ---- | ------------------------------------------------ |
| GET    | `/`            | JWT  | List settings (cursor-based; filter by metricId) |
| GET    | `/:id`         | JWT  | Get settings by id                               |
| POST   | `/`            | JWT  | Create settings for a metric                     |
| PUT    | `/:id`         | JWT  | Update settings                                  |
| DELETE | `/:id`         | JWT  | Delete settings                                  |
| PATCH  | `/:id/achieve` | JWT  | Mark goal as achieved / update achievement flag  |
| PATCH  | `/:id/display` | JWT  | Update display options                           |

### List Settings – GET `/api/v1/metric-settings`

Cursor-based list with **query params** (all optional):

- `limit` – number of items per page (default `20`)
- `sort` – e.g. `-createdAt`
- `after` – cursor token
- `includeTotal` – whether to calculate total count
- `metricId` / `filter[metricId]` / `filter.metricId` – filter settings for a specific metric.

### Create Settings – POST `/api/v1/metric-settings`

Body shape (simplified):

- `metricId` – metric UUID
- `goalEnabled` (bool)
- `goalType` – `'cumulative'` or `'incremental'`
- `goalValue` (number)
- `timeFrameEnabled` (bool)
- `startDate` / `deadlineDate` (ISO date strings)
- `alertEnabled` (bool)
- `alertThresholds` (number, e.g. `80` for 80%)
- `displayOptions` – object with fields such as `showOnDashboard`, `priority`, `chartType`, `color`.

See types documentation for full details and constraints.

---

## 5. Metric Log Routes – `/api/v1/metric-logs`

All log routes are **protected** and use `authMiddleware`.

### Summary

| Method | Path               | Auth | Description                                        |
| ------ | ------------------ | ---- | -------------------------------------------------- |
| GET    | `/`                | JWT  | List logs (cursor-based; filter by metric, value)  |
| GET    | `/stats`           | JWT  | Aggregated stats for logs                          |
| GET    | `/:id`             | JWT  | Get a single log by id                             |
| POST   | `/`                | JWT  | Create a log                                       |
| PUT    | `/:id`             | JWT  | Update a log                                       |
| DELETE | `/:id`             | JWT  | Delete a log                                       |
| POST   | `/:metricId/dummy` | JWT  | Generate dummy logs (testing only; env controlled) |

### Create Log – POST `/api/v1/metric-logs`

- **Body**

```json
{
  "metricId": "uuid",
  "type": "manual",
  "logValue": 123.45,
  "loggedAt": "2025-01-01T12:00:00.000Z"
}
```

### List Logs (Cursor) – GET `/api/v1/metric-logs`

Supported **query params**:

- `limit` – items per page (1–100, default `20`)
- `sort` – e.g. `-createdAt`, `-loggedAt`, `logValue`
- `q` – search string
- `after` – cursor token
- `includeTotal` – include total count
- Filters (either form):
  - `filter[metricId]` / `filter.metricId`
  - `filter[logValue]` / `filter.logValue`

### Log Stats – GET `/api/v1/metric-logs/stats`

Query params:

- `metricId` (optional) – restrict stats to a metric
- `startDate`, `endDate` – optional ISO datetimes for range.

---

## 6. Analytics Routes – `/api/v1/analytics`

All analytics routes are **protected** and use `authMiddleware` + `analyticsRateLimiter`.

### Summary

| Method | Path                 | Auth | Description                                |
| ------ | -------------------- | ---- | ------------------------------------------ |
| GET    | `/dashboard`         | JWT  | Multi-metric dashboard visualization       |
| GET    | `/metrics/:metricId` | JWT  | Detailed visualization for a single metric |

### Shared Query Concepts

Many analytics queries share the same parameters:

- `bucket` – aggregation bucket; one of: `1h`, `1d`, `1w`, `1m`, `1y` (default `1d`).
- `tz` – IANA timezone string (e.g. `"Asia/Jakarta"`) – default from backend.
- `fill` – how to fill missing buckets: `"none"`, `"zero"`, or `"nan"` (default `"none"`).

For time ranges, clients may use **either**:

- Relative range: `last=<number><unit>` (e.g. `last=7d`, `last=30d`, `last=12m`, `last=1y`)
- Absolute range:
  - `start=<ISO datetime>`
  - `end=<ISO datetime>`

At least a relative or absolute range is required (validation enforced in backend).

### Dashboard Visualization – GET `/api/v1/analytics/dashboard`

Query params:

- `bucket`, `tz`, `fill` – as above
- `limit` – maximum number of metrics to include (1–48, default `12`)
- `last` **or** (`start` + `end`) – range selection

### Metric Visualization – GET `/api/v1/analytics/metrics/:metricId`

Path param:

- `metricId` – metric UUID

Query params:

- `bucket`, `tz`, `fill` – as above
- `last` **or** (`start` + `end`) – range selection

---

## 7. API Documentation – `/api/v1/docs`

- **Route:** `GET /api/v1/docs`
- **Description:** Serves Swagger UI based on the generated OpenAPI spec.
- **Auth:** Controlled via `SWAGGER_REQUIRE_AUTH` env:
  - `false` – public
  - `true` – protected by `authMiddleware`

For deep integration or client SDK generation, the frontend can also rely on the OpenAPI JSON at:

- `docs/openapi/lakira-backend-openapi.json`
