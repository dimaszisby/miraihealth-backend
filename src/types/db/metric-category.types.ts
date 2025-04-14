// src/types/db/metric-category.types.ts

/**
 * @interface MetricCategoryAttributesBase
 * @description Defines the core, non-database-specific attributes for a Metric Category entity.
 * This interface is typically extended by the Sequelize model's attributes interface
 * to include database-managed fields like id, userId, timestamps, etc.
 */
export interface MetricCategoryAttributesBase {
  /**
   * @property {string} name - The user-defined name for the metric category.
   */
  name: string;

  /**
   * @property {string} color - A color code (e.g., hex) associated with the category for UI display.
   * Defaults to '#E897A3' if not provided.
   */
  color: string;

  /**
   * @property {string} icon - An icon identifier (e.g., emoji or icon font class) associated with the category.
   * Defaults to '📁' if not provided.
   */
  icon: string;

  /**
   * @property {Date | null} [deletedAt] - Timestamp indicating when the category was soft-deleted.
   * If null or undefined, the category is considered active. Used by Sequelize's paranoid mode.
   */
  deletedAt?: Date | null;
}
