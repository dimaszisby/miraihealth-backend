import { z } from "zod";
import { ZodMessages } from "@/constants/zod/zod-messages.js";
import {
  zUsername,
  zEmail,
  zPassword,
  zPasswordConfirmation,
  zPublicProfile,
  zRoleEnum,
} from "@/constants/zod/zod-rules.js";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const createUserBody = z
  .object({
    username: zUsername,
    email: zEmail,
    password: zPassword,
    passwordConfirmation: zPasswordConfirmation,
    isPublicProfile: zPublicProfile,
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
  role: zRoleEnum.optional(),
});

export const loginUserBody = z.object({
  email: zEmail,
  password: zPassword,
});

export const createUserSchema = { body: createUserBody };
export const updateUserSchema = { body: updateUserBody };
export const loginUserSchema = { body: loginUserBody };
