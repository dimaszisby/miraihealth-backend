import type { User } from "@/features/auth/infrastructure/persistence/models/user.sequelize";
import type { MetricCategory } from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize";
import type { Metric } from "@/features/metric/infrastructure/persistence/models/metric.sequelize";
import type { MetricSettings } from "@/features/metric-settings/infrastructure/persistence/models/metric-settings.sequelize";
import type { MetricLog } from "@/features/metric-log/infrastructure/persistence/models/metric-log.sequelize";

export type DbModels = {
  User: typeof User;
  MetricCategory: typeof MetricCategory;
  Metric: typeof Metric;
  MetricSettings: typeof MetricSettings;
  MetricLog: typeof MetricLog;
};
