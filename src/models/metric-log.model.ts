// src/models/metric-log.model.ts

import {
  Model,
  DataTypes,
  Sequelize,
  Optional,
  NonAttribute,
  BelongsToGetAssociationMixin,
} from "sequelize";
import { MetricLogAttributesBase } from "@/types/db/metric-log.types";
import { DbModels } from "./types.js";
import { Metric } from "./metric.model.js";

/**
 * * MetricLog Model
 * Represents individual log entries for health metrics.
 */

// Define attributes
export interface MetricLogAttributes extends MetricLogAttributesBase {
  // DB-specifics
  id: string;
  metricId: string;

  // Timestamps managed by DB
  createdAt?: Date;
  updatedAt?: Date;

  // Optional associated objects
  // Metric?: Metric;
}

// Define optional fields for Sequelize
export interface MetricLogCreationAttributes
  extends Optional<MetricLogAttributes, "id"> {}

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

  // associated objects
  declare metric?: NonAttribute<Metric>;
  declare getMetric: BelongsToGetAssociationMixin<Metric>;

  // * Init
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
      }
    );

    return MetricLog;
  }

  // * Associations
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
