/**
 * @file src/types/domain/metric-log.domain.ts
 * @description Defines the domain model interface for a Metric Log entry.
 * This represents a single recorded data point for a metric within the core business logic,
 * decoupled from database or API specifics. Domain models are often immutable.
 */

/**
 * @interface MetricLogDomain
 * @description Represents a single log entry for a metric within the application's core domain logic.
 * Contains essential log information retrieved from the persistence layer.
 */
export interface MetricLogDomain {
  /**
   * @property {string} id - The unique identifier for the metric log entry (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} metricId - The identifier of the metric this log entry belongs to.
   * @readonly
   */
  readonly metricId: string;

  /**
   * @property {'manual' | 'automatic'} type - Indicates how the log entry was created ('manual' or 'automatic').
   * @readonly
   */
  readonly type: "manual" | "automatic";

  /**
   * @property {number} logValue - The numerical value recorded for the metric in this log entry.
   * @readonly
   */
  readonly logValue: number;

  /**
   * @property {Date} loggedAt - The timestamp when the metric value was actually recorded or measured.
   * @readonly
   */
  readonly loggedAt: Date;

  /**
   * @property {Date} createdAt - The timestamp when the log entry was created in the database.
   * @readonly
   */
  readonly createdAt: Date;

  /**
   * @property {Date} updatedAt - The timestamp when the log entry was last updated in the database.
   * @readonly
   */
  readonly updatedAt: Date;
}
