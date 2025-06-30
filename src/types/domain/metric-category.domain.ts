/**
 * @file src/types/domain/metric-category.domain.ts
 * @description Defines the domain model interface for a Metric Category.
 * This represents a category used to group metrics within the core business logic,
 * decoupled from database or API specifics. Domain models are often immutable.
 */

/**
 * @interface MetricCategoryDomain
 * @description Represents a metric category within the application's core domain logic.
 * Contains essential category information retrieved from the persistence layer.
 */
export interface MetricCategoryDomain {
  /**
   * @property {string} id - The unique identifier for the metric category (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} name - The user-defined name for the category.
   * @readonly
   */
  readonly name: string;

  /**
   * @property {string} color - The color code associated with the category for UI display.
   * @readonly
   */
  readonly color: string;

  /**
   * @property {string} icon - The icon identifier associated with the category.
   * @readonly
   */
  readonly icon: string;

  /**
   * @property {Date} createdAt - The timestamp when the category was created.
   * @readonly
   */
  readonly createdAt: Date;

  /**
   * @property {Date} updatedAt - The timestamp when the category was last updated.
   * @readonly
   */
  readonly updatedAt: Date;

  /**
   * @property {Date | null} [deletedAt] - The timestamp when the category was soft-deleted. Null if active.
   * @readonly
   */
  readonly deletedAt: Date | null;
}
