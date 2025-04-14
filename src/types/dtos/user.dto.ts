// src/types/dtos/user.dto.ts

/**
 * @file src/types/dtos/user.dto.ts
 * @description Defines the Data Transfer Objects (DTOs) for User-related API contracts.
 * These interfaces and types are used for incoming and outgoing API requests and responses,
 * defining the structure of data exchanged between the client and server.
 * DTOs are often immutable.
 */

/**
 * @interface UserResponseDTO
 * @description Represents the structure of a User object as returned in API responses (e.g., on login, profile retrieval).
 */
export interface UserResponseDTO {
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
   *  @property {'user' | 'admin'} role - The role assigned to the user, determining their permissions.
   * @readonly
   */
  readonly role: "user" | "admin";

  /**
   * @property {boolean} isPublicProfile - Indicates if the user's profile is publicly visible.
   * @readonly
   */
  readonly isPublicProfile: boolean;

  /**
   * @property {string} createdAt - The timestamp when the user account was created, formatted as an ISO string.
   * @readonly
   */
  readonly createdAt: string;

  /**
   * @property {string} updatedAt - The timestamp when the user account was last updated, formatted as an ISO string.
   * @readonly
   */
  readonly updatedAt: string;
}
