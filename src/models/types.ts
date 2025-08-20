import type { User } from "./user.model";
import type { MetricCategory } from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize";
import type { Metric } from "./metric.model";
import type { MetricSettings } from "./metric-settings.model";
import type { MetricLog } from "./metric-log.model";

export type DbModels = {
  User: typeof User;
  MetricCategory: typeof MetricCategory;
  Metric: typeof Metric;
  MetricSettings: typeof MetricSettings;
  MetricLog: typeof MetricLog;
}