import { z } from "zod";
import { ZodMessages } from "@/constants/zod/zod-messages";
import {
  zUsername,
  zEmail,
  zPassword,
  zPasswordConfirmation,
  zPublicProfile,
  zRole,
} from "@/constants/zod/zod-rules";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

/** ===== Base pieces ===== */
export const createUserBody = z
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

export const updateUserBody = z.object({
  username: zUsername.optional(),
  email: zEmail.optional(),
  password: zPassword.optional(),
  isPublicProfile: zPublicProfile.optional(),
  role: zRole.optional(),
});

/** ===== SchemaBags for validate(...) ===== */
export const createUserSchema = { body: createUserBody };
export const updateUserSchema = { body: updateUserBody };

/** ===== Inferred DTOs (optional) ===== */
export type CreateUserRequestDTO = z.infer<typeof createUserBody>;
export type UpdateUserRequestDTO = z.infer<typeof updateUserBody>;
