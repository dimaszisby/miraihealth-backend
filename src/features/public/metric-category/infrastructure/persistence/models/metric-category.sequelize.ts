import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { MetricCategoryAttributesBase } from "./metric-category.attribute.js";
import type { DbModels } from "@/infrastructure/db/types.js";
import { User } from "@/features/auth/infrastructure/persistence/models/user.sequelize.js";
import { Metric } from "@/features/metric/infrastructure/persistence/models/metric.sequelize.js";

/**
 * * MetricCategory Model
 * Represents categories used to group health metrics.
 */

// Define attributes
export interface MetricCategoryAttributes extends MetricCategoryAttributesBase {
  // DB-specifics
  id: string;
  userId: string;
  organizationId: string;

  // Timestamps managed by DB
  createdAt?: Date;
  updatedAt?: Date;
}

// Define optional fields for Sequelize
export type MetricCategoryCreationAttributes = Optional<
  MetricCategoryAttributes,
  "id"
>;

export class MetricCategory
  extends Model<MetricCategoryAttributes, MetricCategoryCreationAttributes>
  implements MetricCategoryAttributes
{
  declare id: string;
  declare userId: string;
  declare organizationId: string;
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

  // * Init
  static initModel(sequelize: Sequelize) {
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
        organizationId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "organizations",
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
  }

  // * Associations
  public static associate(models: DbModels) {
    MetricCategory.belongsTo(models.User, {
      as: "user",
      foreignKey: { name: "userId", field: "user_id", allowNull: false },
      onDelete: "CASCADE",
    });

    MetricCategory.belongsTo(models.Organization, {
      as: "organization",
      foreignKey: {
        name: "organizationId",
        field: "organization_id",
        allowNull: false,
      },
      onDelete: "RESTRICT",
    });

    MetricCategory.hasMany(models.Metric, {
      as: "metrics",
      foreignKey: { name: "categoryId", field: "category_id", allowNull: true },
      onDelete: "SET NULL",
    });
  }
}

export function initMetricCategory(sequelize: Sequelize) {
  return MetricCategory.initModel(sequelize);
}
export function associateMetricCategory(models: DbModels) {
  MetricCategory.associate(models);
}

export const registerMetricCategoryModels = (sequelize: Sequelize) => {
  initMetricCategory(sequelize);
  return { MetricCategory };
};

export const associateMetricCategoryModels = (models: DbModels) => {
  associateMetricCategory(models);
};
