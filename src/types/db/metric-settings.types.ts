// src/types/db/metric-settings.types.ts

/**
 * @interface MetricDisplayOptions
 * @description Defines options related to how a metric is displayed in the user interface.
 */
export interface MetricDisplayOptions {
  /**
   * @property {boolean} showOnDashboard - Whether the metric should be prominently displayed on the user's dashboard.
   */
  showOnDashboard: boolean;
  /**
   * @property {number | null} priority - A numerical priority for ordering metrics on the dashboard or lists. Lower numbers might indicate higher priority. Null if not prioritized.
   */
  priority: number | null;
  /**
   * @property {string | null} chartType - The preferred chart type for visualizing the metric's data (e.g., 'line', 'bar'). Null if no preference.
   */
  chartType: string | null;
  /**
   * @property {string | null} color - A specific color code (e.g., hex) to associate with the metric's display. Null for default color.
   */
  color: string | null;
}

/**
 * @interface MetricSettingsAttributesBase
 * @description Defines the core, non-database-specific attributes for Metric Settings.
 * These settings allow users to customize goals, timeframes, alerts, and display options for a specific metric.
 * This interface is typically extended by the Sequelize model's attributes interface
 * to include database-managed fields like id, metricId, timestamps, etc.
 */
export interface MetricSettingsAttributesBase {
  /**
   * @property {boolean} goalEnabled - Whether a goal is currently active for this metric. Defaults to false.
   */
  goalEnabled: boolean;
  /**
   * @property {'cumulative' | 'incremental' | null} [goalType] - The type of goal, if enabled.
   * 'cumulative': Goal is based on the total sum of log values over the timeframe.
   * 'incremental': Goal is based on achieving a specific value in a single log entry.
   * Null if goal is disabled.
   */
  goalType?: "cumulative" | "incremental" | null;
  /**
   * @property {number | null} [goalValue] - The target value for the goal, if enabled. Must be > 0 if set. Null if goal is disabled.
   */
  goalValue?: number | null;
  /**
   * @property {boolean} timeFrameEnabled - Whether a specific time frame (start/deadline) is active for the goal. Defaults to false.
   */
  timeFrameEnabled: boolean;
  /**
   * @property {Date | null} [startDate] - The start date for the goal's time frame, if enabled. Represents the date only (YYYY-MM-DD). Null if timeframe is disabled.
   */
  startDate?: Date | null;
  /**
   * @property {Date | null} [deadlineDate] - The deadline date for the goal's time frame, if enabled. Represents the date only (YYYY-MM-DD). Must be after startDate if both are set. Null if timeframe is disabled.
   */
  deadlineDate?: Date | null;
  /**
   * @property {boolean} alertEnabled - Whether alerts are active for this metric's goal progress. Defaults to false.
   */
  alertEnabled: boolean;
  /**
   * @property {number | null} [alertThresholds] - The percentage threshold (0-100) at which to trigger an alert regarding goal progress, if alerts are enabled. Defaults to 80. Null if alerts are disabled.
   */
  alertThresholds?: number | null;
  /**
   * @property {boolean} isAchieved - Flag indicating if the goal (if enabled) has been met. Defaults to false. Logic for setting this likely resides in the service layer.
   */
  isAchieved: boolean;
  /**
   * @property {boolean} isActive - Flag indicating if these settings are currently active and should be considered. Defaults to true. Allows disabling settings without deleting.
   */
  isActive: boolean;
  /**
   * @property {MetricDisplayOptions} displayOptions - Object containing settings related to how the metric is displayed.
   */
  displayOptions: MetricDisplayOptions;
}