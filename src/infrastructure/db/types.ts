import type { User } from "@/features/auth/infrastructure/persistence/models/user.sequelize.js";
import type { MetricCategory } from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize.js";
import type { Metric } from "@/features/metric/infrastructure/persistence/models/metric.sequelize.js";
import type { MetricSettings } from "@/features/metric-settings/infrastructure/persistence/models/metric-settings.sequelize.js";
import type { MetricLog } from "@/features/metric-log/infrastructure/persistence/models/metric-log.sequelize.js";

export type DbModels = {
  User: typeof User;
  MetricCategory: typeof MetricCategory;
  Metric: typeof Metric;
  MetricSettings: typeof MetricSettings;
  MetricLog: typeof MetricLog;
};
