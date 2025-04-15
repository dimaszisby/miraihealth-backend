// src/models/metric-category.model.ts

import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Metric } from "./metric.model.js";
import { User } from "./user.model.js";
import { MetricCategoryAttributesBase } from "@/types/db/metric-category.types";

/**
 * * MetricCategory Model
 * Represents categories used to group health metrics.
 */

// Define attributes
export interface MetricCategoryAttributes extends MetricCategoryAttributesBase {
  // DB-specifics
  id: string;
  userId: string;

  // Timestamps managed by DB
  createdAt?: Date;
  updatedAt?: Date;

  // Optional associated objects
  User?: User;
  Metrics?: Metric[];
}

// Define optional fields for Sequelize
export interface MetricCategoryCreationAttributes
  extends Optional<MetricCategoryAttributes, "id"> {}

export class MetricCategory
  extends Model<MetricCategoryAttributes, MetricCategoryCreationAttributes>
  implements MetricCategoryAttributes
{
  declare id: string;
  declare userId: string;
  declare name: string;
  declare color: string;
  declare icon: string;
  declare deletedAt?: Date | null;

  // Timestamps managed by DB
  declare createdAt?: Date;
  declare updatedAt?: Date;

  // Optional associated objects
  declare User?: User;
  declare Metrics?: Metric[];

  /**
   * * Associations
   */
  public static associate(models: any) {
    MetricCategory.belongsTo(models.User, {
      as: "User",
      foreignKey: "userId",
      onDelete: "SET NULL",
    });
    MetricCategory.hasMany(models.Metric, {
      as: "Metric",
      foreignKey: "categoryId",
      onDelete: "SET NULL",
    });
  }
}

/**
 * * Initialize MetricCategory Model
 */
export default (sequelize: Sequelize) => {
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      color: {
        type: DataTypes.STRING,
        defaultValue: "#E897A3",
      },
      icon: {
        type: DataTypes.STRING,
        defaultValue: "📁",
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "MetricCategory",
      tableName: "metric_categories",
      paranoid: true,
      underscored: true,
      schema: "public",
    },
  );

  return MetricCategory;
};
