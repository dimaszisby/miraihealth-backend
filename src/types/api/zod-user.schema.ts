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

export const createUserSchema = z.object({
  body: z
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
    }),
});

export type CreateUserRequestDTO = z.infer<typeof createUserSchema.shape.body>;

/**
 * Update User Schema
 * Used for validating incoming data when updating a user.
 */
export const updateUserSchema = z.object({
  body: z.object({
    username: zUsername.optional(),
    email: zEmail.optional(),
    password: zPassword.optional(),
    isPublicProfile: zPublicProfile.optional(),
    role: zRole.optional(),
  }),
});

export type UpdateUserRequestDTO = z.infer<typeof updateUserSchema.shape.body>;

// src/types/api/zod-user.schema.ts

// import { z } from "zod";

/**
 * * Zod Validation + Inferred Types
 * Wrapped in `.object({ body })` to support validation for body, params, and query via middleware
 */

// ✅ Create User Schema
// export const createUserSchema = z.object({
//   body: z
//     .object({
//       username: z
//         .string()
//         .min(3, { message: "Username must be at least 3 characters" }),
//       email: z.string().email({ message: "Invalid email address" }),
//       password: z
//         .string()
//         .min(6, { message: "Password must be at least 6 characters" }),
//       passwordConfirmation: z.string().min(6, {
//         message: "Password confirmation must be at least 6 characters",
//       }),
//       isPublicProfile: z.boolean().optional().default(true),
//       role: z.enum(["user", "admin"]).optional().default("user"),
//     })
//     .refine((data) => data.password === data.passwordConfirmation, {
//       message: "Passwords do not match",
//       path: ["passwordConfirmation"],
//     }),
// });

// export type CreateUserRequestDTO = z.infer<typeof createUserSchema.shape.body>;

// // ✅ Update User Schema
// export const updateUserSchema = z.object({
//   body: z.object({
//     username: z.string().min(3).optional(),
//     email: z.string().email().optional(),
//     password: z.string().min(6).optional(),
//     isPublicProfile: z.boolean().optional(),
//     role: z.enum(["user", "admin"]).optional(),
//   }),
// });

// export type UpdateUserRequestDTO = z.infer<typeof updateUserSchema.shape.body>;
