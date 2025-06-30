// types/domain/user.domain.ts

/**
 * @file src/types/domain/user.domain.ts
 * @description Defines the domain model interface for a User.
 * This represents the user entity as used within the core business logic,
 * decoupled from database or API specifics. Domain models are often immutable.
 */

/**
 * @interface UserDomain
 * @description Represents a user within the application's core domain logic.
 * Contains essential user information retrieved from the persistence layer.
 */
export interface UserDomain {
  /**
   * @property {string} id - The unique identifier for the user (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} username - The user's unique username.
   * @readonly
   */
  readonly username: string;

  /**
   * @property {string} email - The user's unique email address.
   * @readonly
   */
  readonly email: string;

  /**
   * @property {'user' | 'admin'} role - The assigned role determining user permissions.
   * @readonly
   */
  readonly role: "user" | "admin";

  /**
   * @property {boolean} isPublicProfile - Indicates if the user's profile is publicly visible.
   * @readonly
   */
  readonly isPublicProfile: boolean;

  /**
   * @property {Date} createdAt - The timestamp when the user account was created.
   * @readonly
   */
  readonly createdAt: Date;

  /**
   * @property {Date} updatedAt - The timestamp when the user account was last updated.
   * @readonly
   */
  readonly updatedAt: Date;

  /**
   * @property {Date | null} [deletedAt] - The timestamp when the user account was soft-deleted. Null if active.
   * @readonly
   */
  readonly deletedAt?: Date | null;
}
