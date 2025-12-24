# Contract Test Pipeline Overview – Lakira Backend

## 1. Purpose

This document describes **how** the Postman/Newman contract tests fit into the Lakira Backend **CI/CD pipeline**, which environments they run against, and how they act as a **gate** for API changes that impact the frontend.

It is intended for:

- Backend and DevOps engineers maintaining Jenkins/CI configuration.
- Reviewers assessing the quality of Lakira’s deployment pipeline.
- FE developers who want to understand when API contracts are considered “safe”.

---

## 2. Pipeline Position

A typical Lakira Backend pipeline:

```text
commit / pull request
  ↓
Install, Lint & Type Check
  ↓
Unit Tests
  ↓
Integration Tests
  ↓
Build & Package (Docker image)
  ↓
Deploy to Staging
  ↓
Contract Tests (Postman/Newman)  ← THIS DOCUMENT
  ↓
End-to-End Tests (optional)
  ↓
Manual Approval / Automated Deploy to Production
```
