import { Model, DataTypes, Sequelize, Optional } from "sequelize";

/**
 * * Metric Model
 * Represents health metrics tracked by users.
 */

// Define attributes
export interface MetricAttributes {
  id: string;
  userId: string;
  categoryId?: string | null;
  originalMetricId?: string | null;
  name: string;
  description?: string | null;
  defaultUnit: string;
  isPublic: boolean;
  deletedAt?: Date | null;
}

// Define optional fields for Sequelize
export interface MetricCreationAttributes extends Optional<MetricAttributes, "id"> {}

export class Metric extends Model<MetricAttributes, MetricCreationAttributes> implements MetricAttributes {
  public id!: string;
  public userId!: string;
  public categoryId!: string | null;
  public originalMetricId!: string | null;
  public name!: string;
  public description!: string | null;
  public defaultUnit!: string;
  public isPublic!: boolean;
  public deletedAt!: Date | null;

  /**
   * * Associations
   */
  public static associate(models: any) {
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

/**
 * * Initialize Metric Model
 */
export default (sequelize: Sequelize) => {
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
      schema: "public",
    }
  );

  return Metric;
};
