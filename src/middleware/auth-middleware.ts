// src/middleware/auth-middleware.ts

import { env } from "@/config/zodEnv";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserModel from "@/models/user.model";
import db from "@/models/index";
import AppError from "@/utils/AppError";
import { toDomainUser } from "@/utils/mappers/user.mapper";
import { AuthRequest } from "@/types/request.context";

/**
 * * Auth Middleware
 * Wrapper class for routes that require authentication
 */
const { sequelize } = db;
const UserModelInstance = UserModel(sequelize);

/**
 * Middleware to validate authentication using JWT
 * @param {AuthRequest} req - The request object (extended)
 * @param {Response} res - The response object
 * @param {NextFunction} next - Express next function
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // 1. Check if Authorization header is present
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized: No token provided", 401));
  }

  // 2. Extract token from Authorization header
  const token = authHeader.split(" ")[1];
  try {
    // 3. Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET as string) as {
      id: string;
    };

    // 4. Check if user exists
    // ✅ Explicitly define the user attributes we need
    const userRecord = await UserModelInstance.findByPk(decoded.id, {
      attributes: ["id", "username", "email", "role"], // ✅ Ensure `role` is included
    });

    if (!userRecord) {
      return next(new AppError("Unauthorized: User not found", 401));
    }

    // ✅ Manually map the Sequelize object to the defined User type
    // req.user = userRecord.toJSON() as UserDomain;
    req.user = toDomainUser(userRecord);

    next();
  } catch (error) {
    return next(new AppError("Unauthorized: Invalid token", 401));
  }
};
