// src/utils/token-generator.ts

import { env } from "../config/zodEnv.js";
import jwt from "jsonwebtoken";
import type { UserInstance } from "@/features/auth/infrastructure/persistence/models/user.sequelize";

type TokenSubject = Pick<UserInstance, "id" | "email">;

/**
 * * Generate JWT Token
 * @param user - Authenticated user object
 * @returns {string} JWT token
 */
export const tokenGenerator = (user: TokenSubject): string => {
  return jwt.sign(
    { id: user.id, email: user.email },
    env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );
};
