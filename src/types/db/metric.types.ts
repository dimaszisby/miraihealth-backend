// src/types/db/metric.types.ts

/**
 * @interface MetricAttributesBase
 * @description Defines the core, non-database-specific attributes for a Metric entity.
 * Represents a specific health or activity metric that a user can track (e.g., 'Weight', 'Steps', 'Water Intake').
 * This interface is typically extended by the Sequelize model's attributes interface
 * to include database-managed fields like id, userId, categoryId, timestamps, etc.
 */
export interface MetricAttributesBase {
  /**
   * @property {string} name - The user-defined name for the metric.
   */
  name: string;

  /**
   * @property {string | null} [description] - An optional description providing more details about the metric.
   */
  description: string | null;

  /**
   * @property {string} defaultUnit - The default unit of measurement for this metric (e.g., 'kg', 'steps', 'ml').
   */
  defaultUnit: string;

  /**
   * @property {boolean} isPublic - Flag indicating if this metric definition (not the user's data) can be publicly discovered or used as a template by others. Defaults to true.
   */
  isPublic: boolean;

  /**
   * @property {Date | null} [deletedAt] - Timestamp indicating when the metric was soft-deleted.
   * If null or undefined, the metric is considered active. Used by Sequelize's paranoid mode.
   */
  deletedAt?: Date | null;
}
