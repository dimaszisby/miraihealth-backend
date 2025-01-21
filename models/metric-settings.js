"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class MetricSettings extends Model {
    static associate(models) {
      MetricSettings.belongsTo(models.Metric, { foreignKey: "metricId" });
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
          model: "metrics",
          key: "id",
        },
      },
      isTracked: { type: DataTypes.BOOLEAN, defaultValue: true },
      goalValue: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      versionDate: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "MetricSettings",
      tableName: "metric_settings",
      // paranoid: true,
      underscored: true,
    }
  );
  return MetricSettings;
};
