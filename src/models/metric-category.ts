import { Model, DataTypes, Sequelize, Optional } from "sequelize";

/**
 * * MetricCategory Model
 * Represents categories used to group health metrics.
 */

// Define attributes
export interface MetricCategoryAttributes {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  deletedAt?: Date | null;
}

// Define optional fields for Sequelize
export interface MetricCategoryCreationAttributes
  extends Optional<MetricCategoryAttributes, "id"> {}

export class MetricCategory
  extends Model<MetricCategoryAttributes, MetricCategoryCreationAttributes>
  implements MetricCategoryAttributes
{
  public id!: string;
  public userId!: string;
  public name!: string;
  public color!: string;
  public icon!: string;
  public deletedAt!: Date | null;

  /**
   * * Associations
   */
  public static associate(models: any) {
    MetricCategory.belongsTo(models.User, { foreignKey: "userId" });
    MetricCategory.hasMany(models.Metric, { foreignKey: "categoryId" });
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
    }
  );

  return MetricCategory;
};
