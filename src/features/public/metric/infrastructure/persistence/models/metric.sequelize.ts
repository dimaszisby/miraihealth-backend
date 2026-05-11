import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { MetricAttributesBase } from "@/types/db/metric.types.js";
import type { DbModels } from "@/infrastructure/db/types.js";
import { MetricCategory } from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize.js";
import { MetricSettings } from "@/features/metric-settings/infrastructure/persistence/models/metric-settings.sequelize.js";
import { MetricLog } from "@/features/metric-log/infrastructure/persistence/models/metric-log.sequelize.js";

export interface MetricAttributes extends MetricAttributesBase {
  id: string;
  userId: string;
  organizationId: string;
  categoryId: string | null;
  originalMetricId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MetricCreationAttributes = Optional<MetricAttributes, "id">;

export class Metric
  extends Model<MetricAttributes, MetricCreationAttributes>
  implements MetricAttributes
{
  declare id: string;
  declare userId: string;
  declare organizationId: string;
  declare categoryId: string | null;
  declare originalMetricId: string | null;
  declare name: string;
  declare description: string | null;
  declare defaultUnit: string;
  declare isPublic: boolean;
  declare deletedAt?: Date | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  declare MetricCategory?: MetricCategory;
  declare MetricSettings?: MetricSettings;
  declare MetricLogs?: MetricLog[];

  static initModel(sequelize: Sequelize) {
    Metric.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
        },
        organizationId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "organizations",
            key: "id",
          },
        },
        categoryId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: "metric_categories",
            key: "id",
          },
        },
        originalMetricId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: "metrics",
            key: "id",
          },
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        defaultUnit: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        isPublic: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "Metric",
        tableName: "metrics",
        paranoid: true,
        underscored: true,
        schema: "public",
      },
    );

    return Metric;
  }

  static associate(models: DbModels) {
    Metric.belongsTo(models.User, {
      as: "user",
      foreignKey: { name: "userId", field: "user_id", allowNull: false },
      onDelete: "CASCADE",
    });

    Metric.belongsTo(models.Organization, {
      as: "organization",
      foreignKey: {
        name: "organizationId",
        field: "organization_id",
        allowNull: false,
      },
      onDelete: "RESTRICT",
    });

    Metric.belongsTo(models.MetricCategory, {
      as: "category",
      foreignKey: { name: "categoryId", field: "category_id", allowNull: true },
      onDelete: "SET NULL",
    });

    Metric.belongsTo(models.Metric, {
      as: "originalMetric",
      foreignKey: {
        name: "originalMetricId",
        field: "original_metric_id",
        allowNull: true,
      },
      onDelete: "SET NULL",
    });

    Metric.hasOne(models.MetricSettings, {
      as: "settings",
      foreignKey: { name: "metricId", field: "metric_id", allowNull: false },
      onDelete: "CASCADE",
    });

    Metric.hasMany(models.MetricLog, {
      as: "logs",
      foreignKey: { name: "metricId", field: "metric_id", allowNull: false },
      onDelete: "CASCADE",
    });
  }
}

export function initMetric(sequelize: Sequelize) {
  return Metric.initModel(sequelize);
}
export function associateMetric(models: DbModels) {
  Metric.associate(models);
}

export const registerMetricModels = (sequelize: Sequelize) => {
  initMetric(sequelize);
  return { Metric };
};

export const associateMetricModels = (models: DbModels) => {
  associateMetric(models);
};
