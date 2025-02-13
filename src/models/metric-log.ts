import { Model, DataTypes, Sequelize, Optional } from "sequelize";

/**
 * * MetricLog Model
 * Represents individual log entries for health metrics.
 */

// Define attributes
export interface MetricLogAttributes {
  id: string;
  metricId: string;
  type: string;
  logValue: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define optional fields for Sequelize
export interface MetricLogCreationAttributes extends Optional<MetricLogAttributes, "id"> {}

export class MetricLog
  extends Model<MetricLogAttributes, MetricLogCreationAttributes>
  implements MetricLogAttributes
{
  public id!: string;
  public metricId!: string;
  public type!: string;
  public logValue!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  /**
   * * Associations
   */
  public static associate(models: any) {
    MetricLog.belongsTo(models.Metric, { foreignKey: "metricId" });
  }
}

/**
 * * Initialize MetricLog Model
 */
export default (sequelize: Sequelize) => {
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
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "manual",
      },
      logValue: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          isPositive(value: number) {
            if (value <= 0) {
              throw new Error("Log value must be greater than 0.");
            }
          },
        },
      },
    },
    {
      sequelize,
      modelName: "MetricLog",
      tableName: "metric_logs",
      underscored: true,
      schema: "public",
    }
  );

  return MetricLog;
};
