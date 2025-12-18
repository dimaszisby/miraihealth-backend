# Contract Test Pipeline Overview – Lakira Backend

## 1. Purpose

This document describes **how** Postman/Newman contract tests fit into the Lakira **CI/CD pipeline**, which environments they run against, and how they act as a **gate** for backend changes that impact client-facing APIs.

---

## 2. Pipeline Position

A typical Lakira pipeline (high-level):

```text
commit / PR
  ↓
Build & Lint
  ↓
Unit Tests
  ↓
Integration Tests
  ↓
Deploy Test/Staging Environment
  ↓
Contract Tests (Postman/Newman)
  ↓
End-to-End Tests (optional)
  ↓
Deploy to Production (manual or automated)
