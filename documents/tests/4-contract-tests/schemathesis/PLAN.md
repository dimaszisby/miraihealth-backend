# Schemathesis Contract Test Plan – Lakira Backend

## 1. Purpose & Goals

Schemathesis supplements the handcrafted Postman/Newman suites by automatically generating requests from the OpenAPI spec and validating responses for schema and status-code compliance. Goals:

- Catch schema drift, unhandled errors, and undocumented status codes early.
- Reproduce issues deterministically via saved failing examples.
- Integrate the fuzzing runs into CI/nightly jobs without slowing down PR feedback loops.

## 2. Scope

- **APIs:** all `lakira-backend-openapi.json` paths tagged as `analytics`, `metrics`, `metric-logs`, `metric-settings`, and `auth`.
- **Environments:** local backend (during development + `contract_local`) and staging backend (via nightly cron).
- **Checks:** default Schemathesis checks (`not_a_server_error`, `status_code_conformance`, `negative_data`, `content_type_conformance`) plus custom hooks for caching headers on analytics endpoints.

Out of scope:

- Non-HTTP protocols.
- Third-party integrations not described in OpenAPI.

## 3. Approach

1. **Spec Preparation**

   - Regenerate OpenAPI via `npm run docs:openapi:generate` before each run.
   - Use the generated JSON file directly; avoid remote schemas to keep runs hermetic.

2. **Command Templates**

   ```bash
   # Local
   schemathesis run documents/openapi/lakira-backend-openapi.json \
     --base-url http://localhost:4000/api/v1 \
     --checks all \
     --hypothesis-phases explicit \
     --target-endpoint-tag analytics \
     --stateful=links \
     --workers auto \
     --report-file documents/tests/4-contract-tests/schemathesis/reports/local/latest.json

   # Staging
   STAGING_BASE_URL=https://lakira-backend-staging.onrender.com/api/v1
   schemathesis run documents/openapi/lakira-backend-openapi.json \
     --base-url "$STAGING_BASE_URL" \
     --checks all \
     --headers "Authorization: Bearer $STAGING_CONTRACT_TOKEN" \
     --report-file documents/tests/4-contract-tests/schemathesis/reports/staging/$(date +%Y%m%d-%H%M)-summary.json
   ```

   - Wrap these commands in npm scripts (`test:contract:schemathesis:local|staging`) and Node helpers under `schemathesis/scripts/`.

3. **State & Auth**

   - Use seeded users + tokens documented in Postman env files.
   - For endpoints requiring path IDs, configure Schemathesis `--stateful=links` and custom hooks to fetch IDs via setup calls (e.g., `GET /metrics` before fuzzing `GET /metrics/{id}`).

4. **Reporting**

   - Store JSON report + junit XML (via `--junit-xml`) under `schemathesis/reports/<env>/`.
   - Link report paths from README + metrics tracker.

5. **Failure Handling**
   - On failure, Schemathesis outputs a minimal reproducer. Save these to `schemathesis/reports/<env>/failures/`.
   - Log incidents if staging runs fail more than twice in a week.

## 4. Phases

1. **Phase A – Bootstrap (aligned with Contract Plan Phase 2)**

   - Install Schemathesis dev dependency.
   - Create CLI wrappers + base configs.
   - Limit to analytics + metrics tags to validate runtime (~5 min target).

2. **Phase B – Full Path Coverage**

   - Expand tags to include metric-logs, metric-settings, auth.
   - Add custom checks for analytics caching headers using Schemathesis hooks.
   - Document allowlists for known deviations (e.g., 202 accepted responses).

3. **Phase C – CI/Nightly Integration**

   - Run Schemathesis in GitHub Actions nightly (cron) hitting staging.
   - Upload JSON + junit reports as artifacts.
   - Triage failures via incidents log + metrics tracker updates.

4. **Phase D – Optimization & Portfolio Polish**
   - Tune hypothesis settings (examples per endpoint) to keep runtime predictable.
   - Add Slack/email hooks for nightly job.
   - Showcase sample reports / failure reproductions in documentation for recruiters.

## 5. Success Criteria

- Schemathesis runs execute ≥90% of documented paths with no unexpected 5xx responses in a rolling week.
- Average runtime ≤8 minutes locally, ≤12 minutes on staging nightly.
- Failing examples are reproducible locally via saved curl snippets.
- README + checklist document how to run, triage, and extend Schemathesis.
- Metrics tracker includes Schemathesis coverage + failure rate rows (see shared tracker).

## 6. Risks & Mitigations

- **Spec Drift:** outdated OpenAPI leads to false alarms. Mitigate by gating Schemathesis run on `docs:openapi:check`.
- **Auth & State Complexity:** Some endpoints require valid IDs; fuzzing may generate invalid combos. Mitigate using fixtures + `--stateful=links`.
- **Runtime Explosion:** Large search space may slow runs. Mitigate by limiting examples per endpoint (`--hypothesis-max-examples`) and splitting tags into batches if needed.
- **Environment Sensitivity:** Staging data differences may cause reproducibility issues. Mitigate by seeding staging with known fixtures before nightly run.

## 7. References

- [`schemathesis` documentation](https://schemathesis.readthedocs.io/)
- `documents/tests/4-contract-tests/contract-tests-plan.md`
- `documents/ci-cd/backend/GITHUB_ACTIONS_PIPELINE_PLAN.md`
- `documents/tests/4-contract-tests/schemathesis/CHECKLIST.md`
