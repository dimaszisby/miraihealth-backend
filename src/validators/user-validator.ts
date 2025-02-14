import { z } from "zod";

/**
 * * User Schema Validator
 * Defines validation schemas for user-related requests.
 */

// CREATE User Schema
export const createUserSchema = z.object({
  body: z
    .object({
      username: z
        .string()
        .min(3, { message: "Username must be at least 3 characters" }),
      email: z.string().email({ message: "Invalid email address" }),
      password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters" }),
      passwordConfirmation: z.string().min(6, {
        message: "Password confirmation must be at least 6 characters",
      }),
      age: z.number().int().positive().nullable().optional().default(null),
      sex: z
        .enum(["male", "female", "other", "prefer not to specify"])
        .optional()
        .default("prefer not to specify"), // ✅ Fixed typo
      isPublicProfile: z.boolean().optional().default(true),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: "Passwords do not match",
      path: ["passwordConfirmation"],
    }),
});

// UPDATE User Schema
export const updateUserSchema = z.object({
  body: z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    age: z.number().int().positive().optional(),
    sex: z
      .enum(["male", "female", "other", "prefer not to specify"])
      .optional(),
    isPublicProfile: z.boolean().optional(),
  }),
});

// GET User Schema
export const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid User ID" }),
  }),
});

// DELETE User Schema
export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid User ID" }),
  }),
});
