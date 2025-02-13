"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Metric extends Model {
    static associate(models) {
      Metric.belongsTo(models.User, { foreignKey: "userId" });
      Metric.belongsTo(models.MetricCategory, {
        foreignKey: "categoryId",
        onDelete: "SET NULL",
      });
      Metric.belongsTo(models.Metric, {
        as: "OriginalMetric",
        foreignKey: "originalMetricId",
        onDelete: "SET NULL",
      });
      Metric.hasOne(models.MetricSettings, {
        foreignKey: "metricId",
        onDelete: "CASCADE",
        as: "MetricSettings", // Define an alias for clarity
      });
      Metric.hasMany(models.MetricLog, {
        foreignKey: "metricId",
        onDelete: "CASCADE",
      });
    }
  }

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
        type: DataTypes.STRING,
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
      quoteIdentifiers: false,
      schema: "public",
    }
  );
  return Metric;
};
