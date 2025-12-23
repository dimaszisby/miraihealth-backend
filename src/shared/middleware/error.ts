import { Response, NextFunction } from "express";
import AppError from "@/utils/AppError.js";
import logger from "@/utils/logger.js";
import { env } from "@/config/envManager.js";
import { AuthRequest } from "@/types/request.context.js";

export const createErrorHandler = () =>
  (err: Error, req: AuthRequest, res: Response, next: NextFunction): void => {
    logger.error(`Error Occurred: ${err.message}`, err);
    const appError =
      err instanceof AppError ? err : new AppError("Internal Server Error", 500);

    if (env.NODE_ENV === "production") {
      res.status(appError.statusCode).json({
        status: "error",
        message: "Something went wrong!",
      });
    } else {
      res.status(appError.statusCode).json({
        status: appError.status,
        message: appError.message,
        ...(env.NODE_ENV === "development" && { stack: appError.stack }),
      });
    }
  };

export const errorHandler = createErrorHandler();
