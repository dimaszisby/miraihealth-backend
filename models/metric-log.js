"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class MetricLog extends Model {
    static associate(models) {
      MetricLog.belongsTo(models.Metric, { foreignKey: "metricId" });
    }
  }

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
      type: { type: DataTypes.STRING, defaultValue: "manual" },
      logValue: { type: DataTypes.FLOAT, allowNull: false },
    },
    {
      sequelize,
      modelName: "MetricLog",
      tableName: "metric_logs",

      underscored: true,
      quoteIdentifiers: false,
      schema: "public", // Adjust if using a different schema
    }
  );
  return MetricLog;
};
