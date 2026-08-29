/**
 * Post-deploy smoke suite.
 *
 * Deliberately fixture-free: it needs a base URL and nothing else. No seeded data, no
 * auth token, no fixture UUIDs. That is the whole point — the staging contract job it
 * replaces required twelve environment variables, of which CI supplied one, and one of
 * those (a stored auth token) could never work against a 900-second token TTL.
 *
 * WHAT THIS PROVES, AND WHAT IT DOES NOT
 *
 * It proves the target is healthy: serving, with Postgres and Redis reachable from the
 * deployed process, and with the auth middleware mounted.
 *
 * It does NOT prove the *new* deploy is live. Render deploys with zero downtime and the
 * app exposes no build identity, so polling cannot distinguish a new release from the
 * old one still serving. ADR-0039 (release identity) is what would close that gap; once
 * a release SHA is exposed, this suite should assert it matches the commit being
 * deployed. Until then, treat a green run as "staging is healthy", not "staging is
 * running your change".
 *
 * Usage:  SMOKE_BASE_URL=https://host/api/v1 node tests/smoke/run-smoke.mjs
 */

import logger from "../../scripts/logger.js";

const RAW_BASE =
  process.env.SMOKE_BASE_URL ?? process.env.STAGING_BASE_URL ?? "";
const WAIT_TIMEOUT_MS = Number(process.env.SMOKE_WAIT_TIMEOUT_MS ?? 180_000);
const REQUEST_TIMEOUT_MS = Number(
  process.env.SMOKE_REQUEST_TIMEOUT_MS ?? 10_000,
);

if (!RAW_BASE) {
  logger.error(
    "[smoke] SMOKE_BASE_URL (or STAGING_BASE_URL) is required, e.g. https://host/api/v1",
  );
  process.exit(1);
}

/**
 * STAGING_BASE_URL is documented as already including /api/v1
 * (docs/reference/environments.md:202), but a bare origin is the more natural thing to
 * pass locally. Accept either rather than making the caller remember which.
 */
const baseUrl = (() => {
  const trimmed = RAW_BASE.replace(/\/+$/, "");
  return /\/api\/v\d+$/.test(trimmed) ? trimmed : `${trimmed}/api/v1`;
})();

/** @param {string} path @returns {Promise<{status: number, body: any}>} */
const request = async (path) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * The deploy is fire-and-forget: deploy_staging POSTs the Render hook and the step ends,
 * so this can start while the platform is still rolling out. Poll before asserting, or
 * every check becomes a race.
 */
const waitUntilReachable = async () => {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  let attempt = 0;
  let lastError = "no attempt made";

  while (Date.now() < deadline) {
    attempt += 1;
    try {
      const { status } = await request("/health");
      if (status === 200) {
        logger.info(`[smoke] reachable after ${attempt} attempt(s)`);
        return;
      }
      lastError = `HTTP ${status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    const delay = Math.min(5000, 500 * attempt, Math.max(remaining, 0));
    logger.info(
      `[smoke] not reachable yet (${lastError}); retrying in ${delay}ms`,
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error(
    `Target never became reachable within ${WAIT_TIMEOUT_MS}ms — last error: ${lastError}`,
  );
};

const checks = [
  {
    name: "readiness reports every backing service healthy",
    detail:
      "GET /ready — Postgres and Redis reachable from the deployed process",
    run: async () => {
      const { status, body } = await request("/ready");
      if (status !== 200) {
        throw new Error(
          `expected 200, got ${status} — body: ${JSON.stringify(body)}`,
        );
      }
      const checksBody = body?.checks ?? {};
      const unhealthy = Object.entries(checksBody)
        .filter(([, value]) => value !== "ok")
        .map(([key, value]) => `${key}=${value}`);
      if (unhealthy.length > 0) {
        throw new Error(`unhealthy dependencies: ${unhealthy.join(", ")}`);
      }
      if (Object.keys(checksBody).length === 0) {
        throw new Error(
          `no dependency checks reported — body: ${JSON.stringify(body)}`,
        );
      }
      return Object.keys(checksBody).join(", ");
    },
  },
  {
    name: "health endpoint serves",
    detail: "GET /health — the process is up and knows its environment",
    run: async () => {
      const { status, body } = await request("/health");
      if (status !== 200) throw new Error(`expected 200, got ${status}`);
      if (body?.status !== "ok") {
        throw new Error(
          `expected status "ok", got ${JSON.stringify(body?.status)}`,
        );
      }
      if (!body?.environment) throw new Error("no environment reported");
      return `environment=${body.environment}`;
    },
  },
  {
    name: "protected routes reject unauthenticated requests",
    detail: "GET /metrics without a token — the auth middleware is mounted",
    run: async () => {
      const { status } = await request("/metrics");
      if (status !== 401) {
        throw new Error(
          `expected 401, got ${status} — auth middleware may not be mounted`,
        );
      }
      return "401 as expected";
    },
  },
];

const main = async () => {
  logger.info(`[smoke] target: ${baseUrl}`);
  await waitUntilReachable();

  const failures = [];
  for (const check of checks) {
    try {
      const note = await check.run();
      logger.info(`[smoke] PASS  ${check.name}${note ? ` (${note})` : ""}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[smoke] FAIL  ${check.name}`);
      logger.error(`              ${check.detail}`);
      logger.error(`              ${message}`);
      failures.push(check.name);
    }
  }

  if (failures.length > 0) {
    logger.error(
      `\n[smoke] ${failures.length} of ${checks.length} checks failed: ${failures.join("; ")}`,
    );
    process.exit(1);
  }

  logger.info(
    `\n[smoke] all ${checks.length} checks passed against ${baseUrl}`,
  );
};

main().catch((error) => {
  logger.error(
    `[smoke] ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
