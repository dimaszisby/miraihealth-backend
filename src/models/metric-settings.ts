import { Model, DataTypes, Sequelize, Optional } from "sequelize";

/**
 * * MetricSettings Model
 * Represents customizable settings for health metrics.
 */

// Define attributes
export interface MetricSettingsAttributes {
  id: string;
  metricId: string;
  goalEnabled: boolean;
  goalType?: "cumulative" | "incremental" | null;
  goalValue?: number | null;
  timeFrameEnabled: boolean;
  startDate?: string | null;
  deadlineDate?: string | null;
  alertEnabled: boolean;
  alertThresholds?: number | null;
  isAchieved: boolean;
  isActive: boolean;
  displayOptions: {
    showOnDashboard: boolean;
    priority: number | null;
    chartType: string | null;
    color: string | null;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Define optional fields for Sequelize
export interface MetricSettingsCreationAttributes
  extends Optional<MetricSettingsAttributes, "id"> {}

export class MetricSettings
  extends Model<MetricSettingsAttributes, MetricSettingsCreationAttributes>
  implements MetricSettingsAttributes
{
  public id!: string;
  public metricId!: string;
  public goalEnabled!: boolean;
  public goalType!: "cumulative" | "incremental" | null;
  public goalValue!: number | null;
  public timeFrameEnabled!: boolean;
  public startDate!: string | null;
  public deadlineDate!: string | null;
  public alertEnabled!: boolean;
  public alertThresholds!: number | null;
  public isAchieved!: boolean;
  public isActive!: boolean;
  public displayOptions!: {
    showOnDashboard: boolean;
    priority: number | null;
    chartType: string | null;
    color: string | null;
  };
  public createdAt!: Date;
  public updatedAt!: Date;

  /**
   * * Associations
   */
  public static associate(models: any) {
    MetricSettings.belongsTo(models.Metric, {
      foreignKey: "metricId",
      as: "Metric",
    });
  }

  /**
   * * Convert data for API response
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      metricId: this.metricId,
      goalEnabled: this.goalEnabled,
      goalType: this.goalType,
      goalValue: this.goalValue,
      startDate: this.startDate,
      timeFrameEnabled: this.timeFrameEnabled,
      deadlineDate: this.deadlineDate,
      alertEnabled: this.alertEnabled,
      alertThresholds: this.alertThresholds,
      isAchieved: this.isAchieved,
      isActive: this.isActive,
      displayOptions: this.displayOptions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * * Initialize MetricSettings Model
 */
export default (sequelize: Sequelize) => {
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
      goalEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      goalType: {
        type: DataTypes.ENUM("cumulative", "incremental"),
        allowNull: true,
      },
      goalValue: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
          isPositive(value: number) {
            if (value !== null && value <= 0) {
              throw new Error("Goal value must be greater than 0.");
            }
          },
        },
      },
      timeFrameEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      deadlineDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isAfterStart(value: unknown) {
            if (
              this.startDate &&
              typeof value === "string" &&
              typeof this.startDate === "string"
            ) {
              const startDate = new Date(this.startDate);
              const deadline = new Date(value);

              if (!isNaN(startDate.getTime()) && !isNaN(deadline.getTime())) {
                if (deadline <= startDate) {
                  throw new Error(
                    "Deadline date must be after the start date."
                  );
                }
              }
            }
          },
        },
      },
      alertEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      alertThresholds: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 80,
        validate: {
          isInRange(value: number) {
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
      },
    },
    {
      sequelize,
      modelName: "MetricSettings",
      tableName: "metric_settings",
      underscored: true,
      timestamps: true,
      hooks: {
        beforeUpdate: async (metricSettings: MetricSettings) => {
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
          if (!metricSettings.alertEnabled) {
            metricSettings.alertThresholds = null;
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
