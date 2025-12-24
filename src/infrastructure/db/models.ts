import sequelize from "@/config/db.js";
import type { DbModels } from "./types.js";
import {
  registerAuthModels,
  associateAuthModels,
  User,
} from "@/features/auth/infrastructure/persistence/models/user.sequelize.js";
import {
  registerMetricCategoryModels,
  associateMetricCategoryModels,
  MetricCategory,
} from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize.js";
import {
  registerMetricModels,
  associateMetricModels,
  Metric,
} from "@/features/metric/infrastructure/persistence/models/metric.sequelize.js";
import {
  registerMetricSettingsModels,
  associateMetricSettingsModels,
  MetricSettings,
} from "@/features/metric-settings/infrastructure/persistence/models/metric-settings.sequelize.js";
import {
  registerMetricLogModels,
  associateMetricLogModels,
  MetricLog,
} from "@/features/metric-log/infrastructure/persistence/models/metric-log.sequelize.js";

const registerFns = [
  registerAuthModels,
  registerMetricCategoryModels,
  registerMetricModels,
  registerMetricSettingsModels,
  registerMetricLogModels,
] as const;

const associateFns = [
  associateAuthModels,
  associateMetricCategoryModels,
  associateMetricModels,
  associateMetricSettingsModels,
  associateMetricLogModels,
] as const;

let cachedModels: DbModels | null = null;

export const loadModels = () => {
  if (cachedModels) {
    return cachedModels;
  }

  const partial: Partial<DbModels> = {};
  registerFns.forEach((register) =>
    Object.assign(partial, register(sequelize)),
  );
  const models = partial as DbModels;
  associateFns.forEach((associate) => associate(models));
  cachedModels = models;
  return models;
};

export const models = loadModels();

export { sequelize };
export type UserInstance = InstanceType<typeof User>;
