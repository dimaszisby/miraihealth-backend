// middleware/error-handler.ts

import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

/**
 * * Centralized Error Handling Middleware
 * Ensures consistent error responses across the application.
 */

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  // Debugging: Check if err is an instance of AppError
  logger.error(`Error Occurred: ${err.message}`, err);

  let appError =
    err instanceof AppError ? err : new AppError("Internal Server Error", 500);

  // Hide sensitive error details in production
  if (process.env.NODE_ENV === "production") {
    return res.status(appError.statusCode).json({
      status: "error",
      message: "Something went wrong!",
    });
  }

  // Send detailed error response in development
  return res.status(appError.statusCode).json({
    status: appError.status,
    message: appError.message,
    ...(process.env.NODE_ENV === "development" && { stack: appError.stack }),
  });
};
