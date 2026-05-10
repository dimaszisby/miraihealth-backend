/**
 * @interface UserAttributesBase
 * @description Defines the core, non-database-specific attributes for a User entity.
 * This interface is typically extended by the Sequelize model's attributes interface
 * to include database-managed fields like id, timestamps, etc.
 */
export interface UserAttributesBase {
  /**
   * @property {string} username - The unique username for the user.
   */
  username: string;

  /**
   * @property {string} email - The unique email address for the user. Must be a valid email format.
   */
  email: string;

  /**
   * @property {string} password - The user's password. Note: This is typically the hashed password in the database context.
   */
  password: string;

  /**
   * @property {boolean} isPublicProfile - Flag indicating if the user's profile is publicly visible.
   */
  isPublicProfile: boolean;

  /**
   * @property {'user' | 'admin'} role - The role assigned to the user, determining their permissions.
   */
  role: "user" | "admin";

  /**
   * @property {Date | null} emailVerifiedAt - Timestamp when the user's email was verified. Null if unverified.
   */
  emailVerifiedAt?: Date | null;
}
