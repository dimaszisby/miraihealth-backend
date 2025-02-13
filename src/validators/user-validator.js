const { z } = require("zod");

// CREATE User Schema
const createUserSchema = z.object({
  body: z
    .object({
      username: z.string().min(3, "Username must be at least 3 characters"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      passwordConfirmation: z
        .string()
        .min(6, "Password confirmation must be at least 6 characters"),
      age: z.number().int().positive().nullable().optional().default(null),
      sex: z
        .enum(["male", "female", "other", "prefer not to specify"])
        .optional()
        .default("prefer not specify"),
      isPublicProfile: z.boolean().optional().default(true),
    })
    // Cross-field refinement to ensure passwords match
    .refine((data) => data.password === data.passwordConfirmation, {
      message: "Passwords do not match",
      path: ["passwordConfirmation"],
    }),
});

// UPDATE User Schema
const updateUserSchema = z.object({
  body: z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    age: z.number().int().positive().optional(),
    sex: z.enum(["male", "female", "other", "prefer not specify"]).optional(),
    isPublicProfile: z.boolean().optional(),
  }),
});

// GET User Schema
const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid User ID"),
  }),
});

// DELETE User Schema
const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid User ID"),
  }),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  deleteUserSchema,
};
