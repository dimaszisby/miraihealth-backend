// src/services/user.service.ts

import db from "@/infrastructure/db/sequelize";
import bcrypt from "bcrypt";
import AppError from "@/utils/AppError";
import logger from "@/utils/logger";
import { tokenGenerator } from "@/utils/token-generator";
import { UserDomain } from "@/types/domain/user.domain";
import {
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
} from "@/types/api/zod-user.schema";
import { toDomainUser } from "@/utils/mappers/user.mapper";
import { models } from "@/models";

/**
 * * Auth Service
 * Handles all business logic related to auth and user.
 */

interface AuthData {
  token: string;
  user: UserDomain;
}

/**
 * Register user
 * @param registerData - The user data of UserBase type
 * @returns The auth data consists of token and user data
 * @throws {AppError}  If error happened or user credential have been used
 */
export const registerUserService = async (
  registerData: CreateUserRequestDTO
): Promise<AuthData> => {
  // Ensure that password and password confirmation is equal
  if (registerData.password !== registerData.passwordConfirmation) {
    throw new AppError("Passwords do not match", 400);
  }

  // Ensure Email is not registered
  const existingUser = await models.User.findOne({
    where: { email: registerData.email },
  });
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  try {
    const user = await models.User.create(registerData);
    const token = tokenGenerator(user);

    const authData: AuthData = { token, user: toDomainUser(user) };

    return authData;
  } catch (error) {
    logger.error("Error during user creation:", error);
    throw error; // Re-throw the original error
  }
};

/**
 * Login method for the reuesting user
 * @param email - ID of the user
 * @param password - ID of the metric
 * @returns The auth data consists of token and user data
 */
export const loginUserService = async (
  email: string,
  password: string
): Promise<AuthData> => {
  // Ensure email is registered on the db
  const user = await models.User.findOne({ where: { email } });
  // Ensure user and password is valid
  if (!user || !(await user.validPassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = tokenGenerator(user);
  const authData: AuthData = { token, user: toDomainUser(user) };

  return authData;
};

/**
 * Get user profile data for the requesting user
 * @param user - ID of the user
 * @returns The user credentials to pass on token generation
 * @throws {AppError}  If error happened
 */
export const getUserProfileService = async (
  current: string | Pick<UserDomain, "id">
): Promise<UserDomain> => {
  const userId = typeof current === "string" ? current : current.id;
  if (!userId) throw new AppError("User not authenticated", 401);

  const user = await models.User.findByPk(userId);
  if (!user) throw new AppError("User not found", 404);

  return toDomainUser(user);
};

/**
 * Update a user profile data
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param settingsId - ID of the settings
 * @param updates - Updated data
 * @returns Updated user object
 * @throws {AppError}  If error happened or requested data is already used
 */
export const updateUserProfileService = async (
  current: string | Pick<UserDomain, "id" | "email" | "username">,
  updateData: UpdateUserRequestDTO
): Promise<UserDomain> => {
  const userId = typeof current === "string" ? current : current.id;
  if (!userId) throw new AppError("User not authenticated", 401);

  const user = await models.User.findByPk(userId);
  if (!user) throw new AppError("User not found", 404);

  // Ensure update email is not taken
  if (updateData.email && updateData.email !== user.email) {
    const existingEmail = await models.User.findOne({
      where: { email: updateData.email },
    });
    if (existingEmail) {
      throw new AppError("Email already in use", 401);
    }
  }

  // Ensure update username is not taken
  if (updateData.username && updateData.username !== user.username) {
    const existingUsername = await models.User.findOne({
      where: { username: updateData.username },
    });
    if (existingUsername) {
      throw new AppError("Username already in use", 401);
    }
  }

  // Update new password
  if (updateData.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(updateData.password, salt);
  }

  await user.update({
    username: updateData.username,
    email: updateData.email,
    isPublicProfile: updateData.isPublicProfile,
  });
  await user.reload();

  return toDomainUser(user);
};
