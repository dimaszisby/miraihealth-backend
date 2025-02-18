// src/models/metric-log.ts

import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Metric } from "./metric.js";

/**
 * * MetricLog Model
 * Represents individual log entries for health metrics.
 */

// Define attributes
export interface MetricLogAttributes {
  id: string;
  metricId: string;
  type: string;
  logValue: number;
  loggedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;

  // Optional associated objects
  Metric?: Metric;
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
  declare type: string;
  declare logValue: number;
  declare loggedAt: Date;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  // Optional associated objects
  declare Metric?: Metric;

  /**
   * * Associations
   */
  public static associate(models: any) {
    MetricLog.belongsTo(models.Metric, {
      as: "Metric",
      foreignKey: "metricId",
      onDelete: "SET NULL",
    });
  }
}

/**
 * * Initialize MetricLog Model
 */
export default (sequelize: Sequelize) => {
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
        type: DataTypes.STRING,
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
};
