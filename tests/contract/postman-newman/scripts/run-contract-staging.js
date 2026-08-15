#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import newman from "newman";
import logger from "../../../../scripts/logger.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const postmanDir = path.resolve(scriptDir, "..");

const collections = [
  {
    id: "analytics",
    name: "Analytics",
    file: "lakira-analytics-contract.postman_collection.json",
  },
  {
    id: "metrics",
    name: "Metrics",
    file: "lakira-metrics-contract.postman_collection.json",
  },
  {
    id: "metric-logs",
    name: "Metric Logs",
    file: "lakira-metric-logs-contract.postman_collection.json",
  },
  {
    id: "metric-settings",
    name: "Metric Settings",
    file: "lakira-metric-settings-contract.postman_collection.json",
  },
  {
    id: "auth",
    name: "Auth",
    file: "lakira-auth-contract.postman_collection.json",
  },
];

const envPath = path.join(
  postmanDir,
  "environments",
  "lakira-staging.postman_environment.json",
);
const reportsRoot = path.join(postmanDir, "reports", "staging");

const stagingVarMap = {
  STAGING_BASE_URL: "baseUrl",
  STAGING_CONTRACT_TOKEN: "contractAuthToken",
  STAGING_CONTRACT_USER_ID: "contractUserId",
  STAGING_CONTRACT_SECONDARY_USER_ID: "contractSecondaryUserId",
  STAGING_CATEGORY_REVENUE_ID: "categoryRevenueId",
  STAGING_CATEGORY_PRODUCTIVITY_ID: "categoryProductivityId",
  STAGING_METRIC_REVENUE_ID: "metricRevenueId",
  STAGING_METRIC_PRODUCTIVITY_ID: "metricProductivityId",
  STAGING_METRIC_SETTINGS_REVENUE_ID: "metricSettingsRevenueId",
  STAGING_METRIC_SETTINGS_PRODUCTIVITY_ID: "metricSettingsProductivityId",
  STAGING_METRIC_LOG_REVENUE_LATEST_ID: "metricLogRevenueLatestId",
  STAGING_METRIC_LOG_PRODUCTIVITY_LATEST_ID: "metricLogProductivityLatestId",
};

function buildEnvOverrides() {
  const envVar = [];
  for (const [envName, postmanKey] of Object.entries(stagingVarMap)) {
    const value = process.env[envName];
    if (!value) {
      throw new Error(
        `Missing required environment variable "${envName}". Populate it in CI secrets before running staging contract tests.`,
      );
    }
    envVar.push({ key: postmanKey, value });
  }
  return envVar;
}

function runNewman(options) {
  return new Promise((resolve, reject) => {
    newman.run(options, (err, summary) => {
      if (err) return reject(err);
      if (summary?.error || summary?.run?.failures?.length) {
        return reject(
          summary.error ??
            new Error(
              `Newman reported ${summary.run.failures?.length ?? 0} failure(s) for ${options.collection}`,
            ),
        );
      }
      resolve(summary);
    });
  });
}

async function main() {
  logger.info("[contract-staging] Starting Postman/Newman contract suite…");
  const envVar = buildEnvOverrides();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportDir = path.join(reportsRoot, timestamp);
  await fs.mkdir(reportDir, { recursive: true });

  for (const collection of collections) {
    const collectionPath = path.join(
      postmanDir,
      "collections",
      collection.file,
    );
    logger.info(`[contract-staging] Running ${collection.name} collection…`);
    await runNewman({
      collection: collectionPath,
      environment: envPath,
      reporters: ["cli", "junit", "html"],
      reporter: {
        junit: { export: path.join(reportDir, `${collection.id}.xml`) },
        html: { export: path.join(reportDir, `${collection.id}.html`) },
      },
      envVar,
    });
  }

  logger.info(
    `[contract-staging] All collections completed. Reports: ${reportDir}`,
  );
}

main().catch((error) => {
  logger.error("[contract-staging] Contract test run failed", error);
  process.exitCode = 1;
});
