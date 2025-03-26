// src/types/api/zod-user.schema.ts

import { z } from "zod";
import { ZodMessages } from "@/constants/zod-messages";
import {
  zUsername,
  zEmail,
  zPassword,
  zPasswordConfirmation,
  zPublicProfile,
  zRole,
} from "@/validators/zod-rules";

/**
 * * Zod Validation + Inferred Types
 */

/**
 * Create User Schema
 * Used for validating incoming data when creating a new user.
 */

export const createUserSchema = z
  .object({
    username: zUsername,
    email: zEmail,
    password: zPassword,
    passwordConfirmation: zPasswordConfirmation,
    isPublicProfile: zPublicProfile,
    role: zRole,
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: ZodMessages.user.passwordMismatch,
    path: ["passwordConfirmation"],
  });

export type CreateUserRequestDTO = z.infer<typeof createUserSchema>;

/**
 * Update User Schema
 * Used for validating incoming data when updating a user.
 */
export const updateUserSchema = z.object({
  username: zUsername.optional(),
  email: zEmail.optional(),
  password: zPassword.optional(),
  isPublicProfile: zPublicProfile.optional(),
  role: zRole.optional(),
});

export type UpdateUserRequestDTO = z.infer<typeof updateUserSchema>;
