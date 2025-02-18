// src/middleware/auth-middleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserModel from "../models/user.js";
import sequelize from "../config/db.js";
import AppError from "../utils/AppError.js";

/**
 * * Auth Middleware
 * Wrapper class for routes that require authentication
 */

export interface AuthRequest extends Request {
  user?: any; // Use `any` or define a proper User interface if needed
}

const User = UserModel(sequelize); // ✅ Initialize the User model

/**
 * Middleware to validate authentication using JWT
 * @param {AuthRequest} req - The request object (extended)
 * @param {Response} res - The response object
 * @param {NextFunction} next - Express next function
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };
    // 4. Check if user exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError("Unauthorized: User not found", 401));
    }
    // 5. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return next(new AppError("Unauthorized: Invalid token", 401));
  }
};
