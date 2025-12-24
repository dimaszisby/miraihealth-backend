# Postman / Newman Contract Tests – Lakira Backend

## 1. Overview

This folder contains the **API contract test suite** for the Lakira Backend, implemented using **Postman collections** and executed via **Newman**.

Contract tests verify that the **runtime behaviour** of backend APIs (status codes, payload shapes, and critical headers such as caching/ETag) remains consistent with the **documented API contract** (OpenAPI + feature docs).  
They act as a guardrail between:

- The **Lakira backend** (Express + Sequelize + PostgreSQL).
- The **Lakira frontend** (Next.js) and any other external consumers.

This suite covers the **core FE-facing APIs**:

- Analytics
- Metrics
- Metric Logs
- Metric Settings
- Auth

and is especially important for **analytics/dashboard** where small schema or caching changes can cause large UI regressions.

---

## 2. Goals

- Ensure **client-facing APIs** conform to the OpenAPI contract and feature documentation.
- Detect breaking changes early (status codes, response body structure, header changes).
- Provide a **reproducible test harness** FE can trust as a baseline before implementing or refactoring features.
- Integrate into **CI/CD** so contract regressions block merges to protected branches.
- Serve as a **living reference** of how the backend is expected to behave at the HTTP boundary.

> Special Note for Codex: When asked to “validate API contract” or “check analytics/metrics endpoints,” treat this folder (and its collections) as the primary reference for Postman/Newman-based contract testing.

---

## 3. Scope & Non-Goals

### 3.1 In Scope

- All **externally-consumed backend endpoints** defined in `lakira-backend-openapi.json` for:
  - Analytics (`/analytics/**`)
  - Metrics (`/metrics/**`)
  - Metric Logs (`/metric-logs/**`)
  - Metric Settings (`/metric-settings/**`)
  - Auth (`/auth/**`)
- Verification of:
  - HTTP methods, paths, and query/route parameters.
  - Status codes for success and error scenarios.
  - Response body shape and essential fields (aligned with OpenAPI schemas).
  - Important headers (e.g. `Content-Type`, `ETag`, `Cache-Control`).
  - Error response schema for common errors (`400`, `401`, `403`, `404`, `500`).

### 3.2 Out of Scope

- Deep business logic correctness (covered by unit/integration tests).
- Performance and load (covered by separate performance / web-vitals plans).
- Frontend integration and UI flows (covered by FE integration/E2E tests).
- Database internals and migrations (covered by schema / migration tests).

---

## 4. Prerequisites

To run these tests locally, you need:

- Node.js and npm (or yarn) installed.
- Newman installed (either globally or as a devDependency), for example:

  ```bash
  npm install --save-dev newman
  ```
