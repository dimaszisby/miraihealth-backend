// src/types/db/metric-log.types.ts

/**
 * @interface MetricLogAttributesBase
 * @description Defines the core, non-database-specific attributes for a Metric Log entity.
 * This represents a single data point recorded for a specific metric.
 * This interface is typically extended by the Sequelize model's attributes interface
 * to include database-managed fields like id, metricId, timestamps, etc.
 */
export interface MetricLogAttributesBase {
  /**
   * @property {'manual' | 'automatic'} type - Indicates how the log entry was created.
   * 'manual': Entered directly by the user.
   * 'automatic': Potentially sourced from an integration or automated process (future use).
   * Defaults to 'manual'.
   */
  type: "manual" | "automatic";

  /**
   * @property {number} logValue - The numerical value recorded for the metric at the time of logging.
   * Must be greater than 0.
   */
  logValue: number;

  /**
   * @property {Date} [loggedAt] - The timestamp when the metric value was actually recorded or measured.
   * Defaults to the time of creation (NOW()) if not provided.
   * Note: While optional here for potential object creation before DB default, it's required in the DB.
   */
  loggedAt?: Date;
}
