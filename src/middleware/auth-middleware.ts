// src/middleware/auth-middleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserModel from "../models/user.js"; // ✅ Import model function
import sequelize from "../config/db.js"; // ✅ Import Sequelize instance

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
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    const user = await User.findByPk(decoded.id);

    if (!user) {
      res.status(401).json({ message: "Unauthorized: User not found" });
      return;
    }

    req.user = user; // ✅ Attach user to request
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized: Invalid token" });
    return;
  }
};
