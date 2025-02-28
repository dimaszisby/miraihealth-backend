// src/utils/token-generator.ts

import db from "../models/index.js";
import { env } from "../config/zodEnv.js";
import jwt from "jsonwebtoken";

const { User } = db;

/**
 * * Generate JWT Token
 * @param {User} user - Authenticated user object
 * @returns {string} JWT token
 */
export const tokenGenerator = (user: typeof User): string => {
  return jwt.sign(
    { id: user.id, email: user.email },
    env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
};
