import { randomUUID } from "crypto";
import type { Transaction } from "sequelize";
import sequelize from "@/config/db.js";
import { models } from "@/infrastructure/db/models.js";
import type { MetricDisplayOptions } from "@/types/db/metric-settings.types.js";
import { Metric } from "@/features/metric/domain/entities/Metric.js";

const uniqueSuffix = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type UserOverrides = Partial<{
  id: string;
  email: string;
  username: string;
  password: string;
  role: "user" | "admin";
  isPublicProfile: boolean;
}>;

export async function createUserRow(overrides: UserOverrides = {}) {
  return models.User.create({
    id: overrides.id ?? randomUUID(),
    email: overrides.email ?? `${uniqueSuffix()}@example.com`,
    username: overrides.username ?? `user-${uniqueSuffix()}`,
    password: overrides.password ?? "hash",
    role: overrides.role ?? "user",
    isPublicProfile: overrides.isPublicProfile ?? true,
  });
}

export async function createMetricCategoryRow(
  userId: string,
  overrides: Partial<{
    id: string;
    name: string;
    color: string;
    icon: string;
  }> = {},
) {
  return models.MetricCategory.create({
    id: overrides.id ?? randomUUID(),
    userId,
    name: overrides.name ?? `Category-${uniqueSuffix()}`,
    color: overrides.color ?? "#E897A3",
    icon: overrides.icon ?? "🔥",
  });
}

type MetricDomainOverrides = Partial<{
  id: string;
  userId: string;
  name: string;
  defaultUnit: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string | null;
  originalMetricId: string | null;
  description: string | null;
  deletedAt: Date | null;
}>;

export const buildMetricDomain = (overrides: MetricDomainOverrides = {}) =>
  Metric.fromProps({
    id: overrides.id ?? randomUUID(),
    userId: overrides.userId ?? randomUUID(),
    name: overrides.name ?? `Metric-${uniqueSuffix()}`,
    defaultUnit: overrides.defaultUnit ?? "units",
    isPublic: overrides.isPublic ?? true,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    categoryId: overrides.categoryId ?? null,
    originalMetricId: overrides.originalMetricId ?? null,
    description: overrides.description ?? "desc",
    deletedAt: overrides.deletedAt ?? null,
  });

export async function runInTransaction<T>(
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  const tx = await sequelize.transaction();
  try {
    const result = await fn(tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function truncateAllTables() {
  const qi = sequelize.getQueryInterface();
  const tables = [
    "metric_logs",
    "metric_settings",
    "metrics",
    "metric_categories",
    "users",
  ];
  for (const table of tables) {
    await qi.bulkDelete(table, {});
  }
}

type MetricRowOverrides = Partial<{
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  defaultUnit: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}>;

export async function createMetricRow(data: MetricRowOverrides = {}) {
  return models.Metric.create({
    id: data.id ?? randomUUID(),
    userId: data.userId ?? randomUUID(),
    categoryId: typeof data.categoryId === "undefined" ? null : data.categoryId,
    name: data.name ?? `Metric-${uniqueSuffix()}`,
    defaultUnit: data.defaultUnit ?? "units",
    description: data.description ?? "desc",
    isPublic: data.isPublic ?? true,
    createdAt: data.createdAt ?? new Date(),
    updatedAt: data.updatedAt ?? new Date(),
    deletedAt:
      typeof data.deletedAt === "undefined" ? null : (data.deletedAt ?? null),
  });
}

export async function createMetricSettingsRow(
  overrides: Partial<{
    id: string;
    metricId: string;
    goalEnabled: boolean;
    goalType: "cumulative" | "incremental" | null;
    goalValue: number | null;
    timeFrameEnabled: boolean;
    startDate: Date | null;
    deadlineDate: Date | null;
    alertEnabled: boolean;
    alertThresholds: number | null;
    isActive: boolean;
    displayOptions: MetricDisplayOptions;
  }> = {},
) {
  return models.MetricSettings.create({
    id: overrides.id ?? randomUUID(),
    metricId: overrides.metricId!,
    isActive: overrides.isActive ?? true,
    goalEnabled: overrides.goalEnabled ?? false,
    goalType: overrides.goalType ?? null,
    goalValue: overrides.goalValue ?? null,
    timeFrameEnabled: overrides.timeFrameEnabled ?? false,
    startDate: overrides.startDate ?? null,
    deadlineDate: overrides.deadlineDate ?? null,
    alertEnabled: overrides.alertEnabled ?? false,
    alertThresholds: overrides.alertThresholds ?? null,
    isAchieved: false,
    displayOptions: overrides.displayOptions ?? {
      showOnDashboard: true,
      priority: 1,
      chartType: "line",
      color: "#E897A3",
    },
  });
}

export async function createMetricLogRow(
  overrides: Partial<{
    id: string;
    metricId: string;
    logValue: number;
    type: "manual" | "automatic";
    loggedAt: Date;
  }> = {},
) {
  return models.MetricLog.create({
    id: overrides.id ?? randomUUID(),
    metricId: overrides.metricId ?? randomUUID(),
    logValue: overrides.logValue ?? 1,
    type: overrides.type ?? "manual",
    loggedAt: overrides.loggedAt ?? new Date(),
  });
}
