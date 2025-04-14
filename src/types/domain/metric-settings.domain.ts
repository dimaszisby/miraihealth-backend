/**
 * @file src/types/domain/metric-settings.domain.ts
 * @description Defines the domain model interfaces for Metric Settings and its display options.
 * Represents metric customization settings within the core business logic,
 * decoupled from database or API specifics. Domain models are often immutable.
 */

/**
 * @interface MetricSettingsDisplayOptionsDomain
 * @description Represents display options for a metric within the domain logic.
 */
export interface MetricSettingsDisplayOptionsDomain {
  /**
   * @property {boolean} showOnDashboard - Whether the metric should be shown on the dashboard.
   * @readonly
   */
  readonly showOnDashboard: boolean;
  /**
   * @property {number | null} priority - Display priority (lower number = higher priority). Null if not set.
   * @readonly
   */
  readonly priority: number | null;
  /**
   * @property {string | null} chartType - Preferred chart type (e.g., 'line', 'bar'). Null if default.
   * @readonly
   */
  readonly chartType: string | null;
  /**
   * @property {string | null} color - Specific color code (e.g., hex). Null if default.
   * @readonly
   */
  readonly color: string | null;
}

/**
 * @interface MetricSettingsDomain
 * @description Represents the settings for a specific metric within the application's core domain logic.
 * Contains essential settings information retrieved from the persistence layer.
 */
export interface MetricSettingsDomain {
  /**
   * @property {string} id - The unique identifier for the metric settings (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} metricId - The identifier of the metric these settings apply to.
   * @readonly
   */
  readonly metricId: string;

  /**
   * @property {boolean} isActive - Flag indicating if these settings are currently active.
   * @readonly
   */
  readonly isActive: boolean;

  /**
   * @property {boolean} goalEnabled - Flag indicating if a goal is set for this metric.
   * @readonly
   */
  readonly goalEnabled: boolean;

  /**
   * @property {'cumulative' | 'incremental' | null} [goalType] - The type of goal, if enabled. Null otherwise.
   * @readonly
   */
  readonly goalType?: "cumulative" | "incremental" | null;

  /**
   * @property {number | null} [goalValue] - The target value for the goal, if enabled. Null otherwise.
   * @readonly
   */
  readonly goalValue?: number | null;

  /**
   * @property {boolean} timeFrameEnabled - Flag indicating if a specific time frame is set for the goal.
   * @readonly
   */
  readonly timeFrameEnabled: boolean;

  /**
   * @property {Date | null} [startDate] - The start date for the goal's time frame. Null if timeframe is disabled.
   * @readonly
   */
  readonly startDate?: Date | null;

  /**
   * @property {Date | null} [deadlineDate] - The deadline date for the goal's time frame. Null if timeframe is disabled.
   * @readonly
   */
  readonly deadlineDate?: Date | null;

  /**
   * @property {boolean} alertEnabled - Flag indicating if alerts are enabled for goal progress.
   * @readonly
   */
  readonly alertEnabled: boolean;

  /**
   * @property {number | null} [alertThresholds] - The percentage threshold (0-100) for alerts. Null if alerts are disabled.
   * @readonly
   */
  readonly alertThresholds?: number | null; // Adjusted to allow null

  /**
   * @property {boolean} isAchieved - Flag indicating if the goal has been achieved.
   * @readonly
   */
  readonly isAchieved: boolean;

  /**
   * @property {MetricSettingsDisplayOptionsDomain} displayOptions - Object containing display-related settings.
   * @readonly
   */
  readonly displayOptions: MetricSettingsDisplayOptionsDomain; // Made required

  /**
   * @property {Date} createdAt - The timestamp when these settings were created.
   * @readonly
   */
  readonly createdAt: Date;

  /**
   * @property {Date} updatedAt - The timestamp when these settings were last updated.
   * @readonly
   */
  readonly updatedAt: Date;
}
