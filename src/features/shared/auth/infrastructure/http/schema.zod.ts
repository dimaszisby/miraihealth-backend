import { z } from "zod";
import { ZodMessages } from "@/constants/zod/zod-messages.js";
import {
  zUsername,
  zEmail,
  zPassword,
  zPasswordConfirmation,
  zPublicProfile,
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
});

export const loginUserBody = z.object({
  email: zEmail,
  password: zPassword,
});

export const forgotPasswordBody = z.object({
  email: zEmail,
});

export const resetPasswordBody = z
  .object({
    token: z
      .string()
      .min(1, { message: ZodMessages.passwordReset.tokenRequired }),
    password: zPassword,
    passwordConfirmation: zPasswordConfirmation,
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: ZodMessages.user.passwordMismatch,
    path: ["passwordConfirmation"],
  });

export const verifyEmailBody = z.object({
  token: z
    .string()
    .min(1, { message: "Verification token is required" })
    .openapi({ example: "some-raw-token-value" }),
});

export const createUserSchema = { body: createUserBody };
export const updateUserSchema = { body: updateUserBody };
export const loginUserSchema = { body: loginUserBody };
export const forgotPasswordSchema = { body: forgotPasswordBody };
export const resetPasswordSchema = { body: resetPasswordBody };
export const verifyEmailSchema = { body: verifyEmailBody };
