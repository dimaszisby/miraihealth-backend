import {
  associateMetricCategory,
  initMetricCategory,
  MetricCategory,
} from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize";
import { associateUser, initUser, User } from "./user.model";
import { associateMetric, initMetric, Metric } from "./metric.model";
import {
  associateMetricSettings,
  initMetricSettings,
  MetricSettings,
} from "./metric-settings.model";
import {
  associatedMetricLog,
  initMetriclog,
  MetricLog,
} from "./metric-log.model";
import sequelize from "@/config/db";

import type { DbModels } from "./types";

export function loadModels() {
  // INIT: every model gets registered
  initUser(sequelize);
  initMetricCategory(sequelize);
  initMetric(sequelize);
  initMetricSettings(sequelize);
  initMetriclog(sequelize);

  // ASSOCIATE: safely wires relationship
  const models: DbModels = {
    User,
    MetricCategory,
    Metric,
    MetricSettings,
    MetricLog,
  };
  associateUser(models);
  associateMetricCategory(models);
  associateMetric(models);
  associateMetricSettings(models);
  associatedMetricLog(models);

  return models;
}

// Call this once at boot (before syncing/using models)
export const models = loadModels();
export type UserInstance = InstanceType<typeof User>;
