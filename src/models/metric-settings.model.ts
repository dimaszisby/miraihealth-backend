// src/models/metric-settings.model.ts

import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Metric } from "./metric.model.js";
import { MetricSettingsAttributesBase } from "@/types/db/metric-settings.types";

/**
 * * MetricSettings Model
 * Represents customizable settings for health metrics.
 */

/**
 * * MetricSettings Attributes
 * Represents the Model Attributes of Metric Settings
 * Describe the shape of data specifically for the database
 */

export interface MetricSettingsAttributes extends MetricSettingsAttributesBase {
  // DB-specifics
  id: string;
  metricId: string;

  // Timestamps managed by DB
  createdAt?: Date;
  updatedAt?: Date;

  // Optional associated objects
  Metric?: Metric;
}

// Define optional fields for Sequelize
export interface MetricSettingsCreationAttributes
  extends Optional<MetricSettingsAttributes, "id"> {}

export class MetricSettings
  extends Model<MetricSettingsAttributes, MetricSettingsCreationAttributes>
  implements MetricSettingsAttributes
{
  declare id: string;
  declare metricId: string;
  declare goalEnabled: boolean;
  declare goalType: "cumulative" | "incremental" | null;
  declare goalValue: number | null;
  declare timeFrameEnabled: boolean;
  declare startDate: Date | null;
  declare deadlineDate: Date | null;
  declare alertEnabled: boolean;
  declare alertThresholds: number | null;
  declare isAchieved: boolean;
  declare isActive: boolean;
  declare displayOptions: {
    showOnDashboard: boolean;
    priority: number | null;
    chartType: string | null;
    color: string | null;
  };
  declare createdAt?: Date;
  declare updatedAt?: Date;

  // Optional associated objects
  declare Metric?: Metric;

  /**
   * * Associations
   */
  public static associate(models: any) {
    MetricSettings.belongsTo(models.Metric, {
      as: "Metric",
      foreignKey: "metricId",
      onDelete: "SET NULL",
    });
  }

  /**
   * * Convert data for API response
   */
  public toJSON(): Record<string, any> {
    // Get all attributes as a plain object
    const attributes = this.get();

    // Format createdAt and updatedAt (if they exist) as ISO strings
    return {
      ...attributes,
      createdAt: attributes.createdAt
        ? new Date(attributes.createdAt).toISOString()
        : null,
      updatedAt: attributes.updatedAt
        ? new Date(attributes.updatedAt).toISOString()
        : null,
    };
  }
}

/**
 * * Initialize MetricSettings Model
 */
export default (sequelize: Sequelize) => {
  MetricSettings.init(
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
      goalEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      goalType: {
        type: DataTypes.ENUM("cumulative", "incremental"),
        allowNull: true,
      },
      goalValue: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
          isValidValue(value: number | null) {
            if (value !== null && value <= 0) {
              throw new Error("Goal value must be greater than 0.");
            }
          },
        },
      },
      timeFrameEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      deadlineDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isAfterStart(this: { startDate: string | null }, value: unknown) {
            if (this.startDate && value) {
              const startDate = new Date(this.startDate);
              const deadline = new Date(value as string);
              if (deadline <= startDate) {
                throw new Error("Deadline date must be after the start date.");
              }
            }
          },
        },
      },
      alertEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      alertThresholds: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 80,
        validate: {
          isInRange(value: number) {
            if (value !== null && (value < 0 || value > 100)) {
              throw new Error("alertThresholds must be between 0 and 100.");
            }
          },
        },
      },
      isAchieved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      displayOptions: {
        type: DataTypes.JSONB,
        defaultValue: {
          showOnDashboard: true,
          priority: 1,
          chartType: "line",
          color: "#E897A3",
        },
      },
    },
    {
      sequelize,
      modelName: "MetricSettings",
      tableName: "metric_settings",
      underscored: true,
      timestamps: true,
      hooks: {
        beforeUpdate: async (metricSettings: MetricSettings) => {
          const changed = metricSettings.changed();

          if (
            Array.isArray(changed) &&
            changed.includes("goalEnabled") &&
            !metricSettings.goalEnabled
          ) {
            metricSettings.goalType = null;
            metricSettings.goalValue = null;
            metricSettings.startDate = null;
            metricSettings.deadlineDate = null;
          }

          if (
            Array.isArray(changed) &&
            changed?.includes("timeFrameEnabled") &&
            !metricSettings.timeFrameEnabled
          ) {
            metricSettings.startDate = null;
            metricSettings.deadlineDate = null;
          }

          if (
            Array.isArray(changed) &&
            changed?.includes("alertEnabled") &&
            !metricSettings.alertEnabled
          ) {
            metricSettings.alertThresholds = null;
          }
        },
      },
    },
  );

  return MetricSettings;
};
