import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";
import { env } from "../config/zodEnv.js";
import { AuthRequest } from "@/types/request.context.js";

/**
 * * Centralized Error Handling Middleware
 * Ensures consistent error responses across the application.
 */

export const errorHandler = (
  err: Error,
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Debugging: Check if err is an instance of AppError
  logger.error(`Error Occurred: ${err.message}`, err);

  let appError =
    err instanceof AppError ? err : new AppError("Internal Server Error", 500);

  // Hide sensitive error details in production
  if (env.NODE_ENV === "production") {
    res.status(appError.statusCode).json({
      status: "error",
      message: "Something went wrong!",
    });
  } else {
    // Send detailed error response in development
    res.status(appError.statusCode).json({
      status: appError.status,
      message: appError.message,
      ...(env.NODE_ENV === "development" && { stack: appError.stack }),
    });
  }
};
