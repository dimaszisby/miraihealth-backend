// src/validators/zod-rules.ts
import { z } from "zod";
import { ZodMessages } from "@/constants/zod-messages"; // centralized error messages

/**
 * Reusable Zod Field Validations
 * - These base validators can be composed into full schemas
 */

// * User
export const zUsername = z
  .string()
  .min(3, { message: ZodMessages.user.usernameMin });

export const zEmail = z
  .string()
  .email({ message: ZodMessages.user.emailInvalid });

export const zPassword = z
  .string()
  .min(6, { message: ZodMessages.user.passwordMin });

export const zPasswordConfirmation = z
  .string()
  .min(6, { message: ZodMessages.user.passwordConfirmMin });

export const zPublicProfile = z.boolean().optional().default(true);

export const zRole = z.enum(["user", "admin"]).optional().default("user");

// * Metric Category
export const zMetricCategoryName = z
  .string()
  .min(1, { message: ZodMessages.metricCategory.nameRequired });

export const zMetricCategoryColor = z
  .string()
  .min(1)
  .optional()
  .default("#E897A3");

export const zMetricCategoryIcon = z.string().min(1).optional().default("📁");
