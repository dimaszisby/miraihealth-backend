// models/metric-settings.js
"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class MetricSettings extends Model {
    static associate(models) {
      MetricSettings.belongsTo(models.Metric, {
        foreignKey: "metricId",
        as: "Metric",
      });
    }

    // Convert data for API response
    toJSON() {
      const attributes = { ...this.get() };
      return {
        id: attributes.id,
        metricId: attributes.metricId,
        goalEnabled: attributes.goalEnabled,
        goalType: attributes.goalType,
        goalValue: attributes.goalValue,
        startDate: attributes.startDate,
        timeFrameEnabled: attributes.timeFrame,
        deadlineDate: attributes.deadlineDate,
        alertsEnabled: attributes.alertsEnabled,
        alertThresholds: attributes.alertThresholds,
        isAchieved: attributes.isAchieved,
        isActive: attributes.isActive,
        displayOptions: attributes.displayOptions,
        createdAt: attributes.createdAt,
        updatedAt: attributes.updatedAt,
      };
    }
  }

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
          model: "Metric",
          key: "id",
        },
      },
      goalEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // Explicitly controls the goal toggle
      },
      goalType: {
        type: DataTypes.ENUM("cumulative", "incremental"),
        allowNull: true,
        validate: {
          isRequiredWhenEnabled(value) {
            if (this.goalEnabled && !value) {
              throw new Error("goalType is required when goalEnabled is true.");
            }
          },
        },
      },
      goalValue: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
          isPositive(value) {
            if (value !== null && value <= 0) {
              throw new Error("Goal value must be greater than 0.");
            }
          },
          isRequiredWhenEnabled(value) {
            if (this.goalEnabled && (value === null || value === undefined)) {
              throw new Error(
                "goalValue is required when goalEnabled is true."
              );
            }
          },
        },
      },
      timeFrameEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // Controls visibility of startDate & deadlineDate
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isRequiredWhenEnabled(value) {
            if (this.timeFrameEnabled && !value) {
              throw new Error(
                "startDate is required when timeFrameEnabled is true."
              );
            }
          },
        },
      },
      deadlineDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isRequiredWhenEnabled(value) {
            if (this.timeFrameEnabled && !value) {
              throw new Error(
                "deadlineDate is required when timeFrameEnabled is true."
              );
            }
          },
          isAfterStart(value) {
            if (this.startDate && value && value <= this.startDate) {
              throw new Error("Deadline date must be after the start date.");
            }
          },
        },
      },
      alertEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // Master toggle for goal completion alert (100%)
      },
      alertThresholds: {
        type: DataTypes.INTEGER,
        allowNull: true, // Optional warning before 100%
        defaultValue: 80, // Warn at 80% (range: 0-100)
        validate: {
          isInRange(value) {
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
        validate: {
          isValidPriority(value) {
            if (value.priority && (value.priority < 1 || value.priority > 5)) {
              throw new Error("Priority must be between 1 and 5.");
            }
          },
        },
      },
    },
    {
      sequelize,
      modelName: "MetricSettings",
      tableName: "metric_settings",
      underscored: true,
      timestamps: true,
      getterMethods: {
        // Optional: Define getter methods for easier access to JSONB fields
        alertThresholds() {
          return this.getDataValue("alert_thresholds");
        },
        displayOptions() {
          return this.getDataValue("display_options");
        },
      },
      hooks: {
        beforeUpdate: async (metricSettings) => {
          if (!metricSettings.goalEnabled) {
            metricSettings.goalType = null;
            metricSettings.goalValue = null;
            metricSettings.startDate = null;
            metricSettings.deadlineDate = null;
          }
          if (!metricSettings.timeFrameEnabled) {
            metricSettings.startDate = null;
            metricSettings.deadlineDate = null;
          }
          if (!metricSettings.alertsEnabled) {
            metricSettings.alertThresholds = { warn: null, alert: null };
          }
          if (!metricSettings.displayOptions.showOnDashboard) {
            metricSettings.displayOptions.priority = null;
            metricSettings.displayOptions.chartType = null;
            metricSettings.displayOptions.color = null;
          }
        },
      },
    }
  );

  return MetricSettings;
};
