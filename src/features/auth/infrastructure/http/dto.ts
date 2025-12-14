import { z } from "zod";
import {
  createUserSchema,
  updateUserSchema,
  loginUserSchema,
} from "./schema.zod";

export interface UserResponseDTO {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly role: "user" | "admin";
  readonly isPublicProfile: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type CreateUserRequestDTO = z.infer<typeof createUserSchema.body>;
export type UpdateUserRequestDTO = z.infer<typeof updateUserSchema.body>;
export type LoginUserRequestDTO = z.infer<typeof loginUserSchema.body>;
