import {
  Model,
  DataTypes,
  Sequelize,
  Optional,
  NonAttribute,
  BelongsToGetAssociationMixin,
} from "sequelize";
import { MetricLogAttributesBase } from "@/types/db/metric-log.types.js";
import type { DbModels } from "@/infrastructure/db/types.js";
import { Metric } from "@/features/metric/infrastructure/persistence/models/metric.sequelize.js";

export interface MetricLogAttributes extends MetricLogAttributesBase {
  id: string;
  metricId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MetricLogCreationAttributes = Optional<MetricLogAttributes, "id">;

export class MetricLog
  extends Model<MetricLogAttributes, MetricLogCreationAttributes>
  implements MetricLogAttributes
{
  declare id: string;
  declare metricId: string;
  declare type: "manual" | "automatic";
  declare logValue: number;
  declare loggedAt: Date;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  declare metric?: NonAttribute<Metric>;
  declare getMetric: BelongsToGetAssociationMixin<Metric>;

  static initModel(sequelize: Sequelize) {
    MetricLog.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        metricId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "metrics",
            key: "id",
          },
        },
        type: {
          type: DataTypes.ENUM("manual", "automatic"),
          allowNull: false,
          defaultValue: "manual",
        },
        logValue: {
          type: DataTypes.FLOAT,
          allowNull: false,
          validate: {
            isPositive(value: number) {
              if (value <= 0) {
                throw new Error("Log value must be greater than 0.");
              }
            },
          },
        },
        loggedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("NOW()"),
        },
      },
      {
        sequelize,
        modelName: "MetricLog",
        tableName: "metric_logs",
        underscored: true,
        schema: "public",
      },
    );

    return MetricLog;
  }

  static associate(models: DbModels) {
    MetricLog.belongsTo(models.Metric, {
      as: "metric",
      foreignKey: { name: "metricId", field: "metric_id", allowNull: false },
      onDelete: "CASCADE",
    });
  }
}

export function initMetriclog(sequelize: Sequelize) {
  return MetricLog.initModel(sequelize);
}

export function associatedMetricLog(models: DbModels) {
  MetricLog.associate(models);
}

export const registerMetricLogModels = (sequelize: Sequelize) => {
  initMetriclog(sequelize);
  return { MetricLog };
};

export const associateMetricLogModels = (models: DbModels) => {
  associatedMetricLog(models);
};
