import { env } from "@/config/zodEnv";
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import AppError from "@/utils/AppError";
import { toDomainUser } from "@/utils/mappers/user.mapper";
import { AuthRequest } from "@/types/request.context";
import { models } from "@/models";

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
  // Check if Authorization header is present
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized: No token provided", 401));
  }

  // Extract token from Authorization header
  const token = authHeader.split(" ")[1];
  try {
    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET as string) as {
      id: string;
    };

    // Check if user exists
    // Explicitly define the user attributes we need
    const userRecord = await models.User.findByPk(decoded.id, {
      attributes: ["id", "username", "email", "role"],
    });

    if (!userRecord) {
      return next(new AppError("Unauthorized: User not found", 401));
    }

    // Manually map the Sequelize object to the defined User type
    // req.user = userRecord.toJSON() as UserDomain;
    req.user = toDomainUser(userRecord);

    next();
  } catch (error) {
    return next(new AppError("Unauthorized: Invalid token", 401));
  }
};
