import fs from "node:fs/promises";
import path from "node:path";
import type { Transaction } from "sequelize";
import { sequelize, models } from "@/infrastructure/db/models.js";
import { tokenGenerator } from "@/utils/token-generator.js";
import logger from "./logger.js";

const OUTPUT_PATH = path.resolve(process.cwd(), "tmp/contract-seed.json");

const SEED_IDS = {
  primaryUser: "11111111-aaaa-4aaa-8aaa-000000000001",
  secondaryUser: "22222222-bbbb-4bbb-8bbb-000000000002",
  revenueCategory: "33333333-cccc-4ccc-8ccc-000000000003",
  productivityCategory: "44444444-dddd-4ddd-8ddd-000000000004",
  revenueMetric: "55555555-eeee-4eee-8eee-000000000005",
  productivityMetric: "66666666-ffff-4fff-8fff-000000000006",
  revenueMetricSettings: "77777777-aaaa-4aaa-8aaa-000000000007",
  productivityMetricSettings: "88888888-bbbb-4bbb-8bbb-000000000008",
  revenueLogLatest: "99999999-cccc-4ccc-8ccc-000000000009",
  revenueLogOldest: "99999999-cccc-4ccc-8ccc-00000000000a",
  productivityLogLatest: "aaaaaaa1-dddd-4ddd-8ddd-00000000000b",
  productivityLogOldest: "aaaaaaa1-dddd-4ddd-8ddd-00000000000c",
} as const;

const BASE_DATES = {
  oldest: new Date("2024-12-15T00:00:00.000Z"),
  mid: new Date("2024-12-22T00:00:00.000Z"),
  latest: new Date("2025-01-05T00:00:00.000Z"),
};

async function clearTables(transaction: Transaction) {
  const qi = sequelize.getQueryInterface();
  const tables = [
    "metric_logs",
    "metric_settings",
    "metrics",
    "metric_categories",
    "users",
  ];

  for (const table of tables) {
    await qi.bulkDelete(table, {}, { transaction });
  }
}

async function seedData(transaction: Transaction) {
  const now = new Date();

  const primaryUser = await models.User.create(
    {
      id: SEED_IDS.primaryUser,
      email: "contract-primary@lakira.dev",
      username: "contract_primary",
      password: "ContractPrimary!123",
      role: "user",
      isPublicProfile: true,
      createdAt: now,
      updatedAt: now,
    },
    { transaction },
  );

  const secondaryUser = await models.User.create(
    {
      id: SEED_IDS.secondaryUser,
      email: "contract-secondary@lakira.dev",
      username: "contract_secondary",
      password: "ContractSecondary!123",
      role: "user",
      isPublicProfile: true,
      createdAt: now,
      updatedAt: now,
    },
    { transaction },
  );

  const revenueCategory = await models.MetricCategory.create(
    {
      id: SEED_IDS.revenueCategory,
      userId: primaryUser.id,
      name: "Revenue",
      color: "#F59E0B",
      icon: "💰",
      createdAt: now,
      updatedAt: now,
    },
    { transaction },
  );

  const productivityCategory = await models.MetricCategory.create(
    {
      id: SEED_IDS.productivityCategory,
      userId: primaryUser.id,
      name: "Productivity",
      color: "#6366F1",
      icon: "⚙️",
      createdAt: now,
      updatedAt: now,
    },
    { transaction },
  );

  const revenueMetric = await models.Metric.create(
    {
      id: SEED_IDS.revenueMetric,
      userId: primaryUser.id,
      categoryId: revenueCategory.id,
      name: "Monthly Recurring Revenue",
      defaultUnit: "USD",
      description: "MRR pulled from finance dashboard",
      isPublic: true,
      createdAt: now,
      updatedAt: now,
    },
    { transaction },
  );

  const productivityMetric = await models.Metric.create(
    {
      id: SEED_IDS.productivityMetric,
      userId: primaryUser.id,
      categoryId: productivityCategory.id,
      name: "Daily Active Builders",
      defaultUnit: "count",
      description: "Number of active makers per day",
      isPublic: true,
      createdAt: now,
      updatedAt: now,
    },
    { transaction },
  );

  const revenueMetricSettings = await models.MetricSettings.create(
    {
      id: SEED_IDS.revenueMetricSettings,
      metricId: revenueMetric.id,
      goalEnabled: true,
      goalType: "cumulative",
      goalValue: 150000,
      timeFrameEnabled: true,
      startDate: new Date("2024-12-01"),
      deadlineDate: new Date("2025-03-31"),
      alertEnabled: true,
      alertThresholds: 80,
      displayOptions: {
        showOnDashboard: true,
        priority: 1,
        chartType: "area",
        color: "#F59E0B",
      },
      isAchieved: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    { transaction },
  );

  const productivityMetricSettings = await models.MetricSettings.create(
    {
      id: SEED_IDS.productivityMetricSettings,
      metricId: productivityMetric.id,
      goalEnabled: false,
      goalType: null,
      goalValue: null,
      timeFrameEnabled: false,
      startDate: null,
      deadlineDate: null,
      alertEnabled: false,
      alertThresholds: null,
      displayOptions: {
        showOnDashboard: true,
        priority: 2,
        chartType: "line",
        color: "#6366F1",
      },
      isAchieved: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    { transaction },
  );

  const revenueLogs = await models.MetricLog.bulkCreate(
    [
      {
        id: SEED_IDS.revenueLogOldest,
        metricId: revenueMetric.id,
        logValue: 120000,
        type: "manual",
        loggedAt: BASE_DATES.oldest,
        createdAt: BASE_DATES.oldest,
        updatedAt: BASE_DATES.oldest,
      },
      {
        id: SEED_IDS.revenueLogLatest,
        metricId: revenueMetric.id,
        logValue: 132500,
        type: "manual",
        loggedAt: BASE_DATES.latest,
        createdAt: BASE_DATES.latest,
        updatedAt: BASE_DATES.latest,
      },
    ],
    { transaction },
  );

  const productivityLogs = await models.MetricLog.bulkCreate(
    [
      {
        id: SEED_IDS.productivityLogOldest,
        metricId: productivityMetric.id,
        logValue: 65,
        type: "manual",
        loggedAt: BASE_DATES.oldest,
        createdAt: BASE_DATES.oldest,
        updatedAt: BASE_DATES.oldest,
      },
      {
        id: SEED_IDS.productivityLogLatest,
        metricId: productivityMetric.id,
        logValue: 92,
        type: "manual",
        loggedAt: BASE_DATES.latest,
        createdAt: BASE_DATES.latest,
        updatedAt: BASE_DATES.latest,
      },
    ],
    { transaction },
  );

  return {
    primaryUser,
    secondaryUser,
    revenueCategory,
    productivityCategory,
    revenueMetric,
    productivityMetric,
    revenueMetricSettings,
    productivityMetricSettings,
    revenueLogs,
    productivityLogs,
  };
}

async function writeSeedOutput(payload: Record<string, unknown>) {
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2));
}

async function main() {
  logger.info("[seed-contract-tests] Resetting contract-test fixtures…");

  const result = await sequelize.transaction(async (transaction) => {
    await clearTables(transaction);
    return seedData(transaction);
  });

  const primaryToken = tokenGenerator({
    id: result.primaryUser.id,
    email: result.primaryUser.email,
  });
  const secondaryToken = tokenGenerator({
    id: result.secondaryUser.id,
    email: result.secondaryUser.email,
  });

  const output = {
    generatedAt: new Date().toISOString(),
    primaryUser: {
      id: result.primaryUser.id,
      email: result.primaryUser.email,
      username: result.primaryUser.username,
      password: "ContractPrimary!123",
      token: primaryToken,
    },
    secondaryUser: {
      id: result.secondaryUser.id,
      email: result.secondaryUser.email,
      username: result.secondaryUser.username,
      password: "ContractSecondary!123",
      token: secondaryToken,
    },
    categories: {
      revenue: {
        id: result.revenueCategory.id,
        name: result.revenueCategory.name,
        color: result.revenueCategory.color,
        icon: result.revenueCategory.icon,
      },
      productivity: {
        id: result.productivityCategory.id,
        name: result.productivityCategory.name,
        color: result.productivityCategory.color,
        icon: result.productivityCategory.icon,
      },
    },
    metrics: {
      revenue: {
        id: result.revenueMetric.id,
        settingsId: result.revenueMetricSettings.id,
        latestLogId: result.revenueLogs[1]?.id ?? null,
        latestValue: result.revenueLogs[1]?.logValue ?? null,
      },
      productivity: {
        id: result.productivityMetric.id,
        settingsId: result.productivityMetricSettings.id,
        latestLogId: result.productivityLogs[1]?.id ?? null,
        latestValue: result.productivityLogs[1]?.logValue ?? null,
      },
    },
  };

  await writeSeedOutput(output);

  logger.info(
    `[seed-contract-tests] Completed. Output written to ${OUTPUT_PATH}`,
  );
}

main()
  .catch((error) => {
    logger.error("[seed-contract-tests] Failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
