"use strict";
const { Model, DataType } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class MetricCategory extends Model {
    static associate(models) {
      MetricCategory.belongsTo(models.User, { foreignKey: "userId" });
      MetricCategory.hasMany(models.Metric, { foreignKey: "categoryId" });
    }
  }
  MetricCategory.init(
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
      name: { type: DataTypes.STRING, allowNull: false },
      color: { type: DataTypes.STRING, defaultValue: "#E897A3" },
      icon: { type: DataTypes.STRING, defaultValue: "📁" },
      deletedAt: { type: DataTypes.DATE },
    },
    {
      sequelize,
      modelName: "MetricCategory",
      tableName: "metric_categories",
      paranoid: true,
      underscored: true,
      quoteIdentifiers: false,
      schema: "public",
    }
  );
  return MetricCategory;
};
