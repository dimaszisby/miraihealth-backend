import { Response, NextFunction } from "express";
import AppError from "@/utils/AppError.js";
import logger from "@/utils/logger.js";
import { env } from "@/config/envManager.js";
import { AuthRequest } from "@/types/request.context.js";
import { ZodError } from "zod";
import { formatZodIssues } from "@/shared/utils/zod-error-formatter.js";
import { UniqueConstraintError } from "sequelize";

const isBodyParseError = (
  error: unknown,
): error is SyntaxError & {
  status?: number;
  type?: string;
} => {
  return (
    error instanceof SyntaxError &&
    typeof (error as { type?: string }).type === "string" &&
    ((error as { type?: string }).type === "entity.parse.failed" ||
      (error as { status?: number }).status === 400)
  );
};

export const createErrorHandler =
  () =>
  (err: Error, req: AuthRequest, res: Response, next: NextFunction): void => {
    void next;
    if (isBodyParseError(err)) {
      logger.error("Invalid JSON payload received", err);
      res.status(400).json({
        status: "fail",
        errors: [
          {
            field: "body",
            message: "Malformed JSON payload. Provide a valid JSON object.",
          },
        ],
      });
      return;
    }
    if (err instanceof ZodError) {
      const formattedErrors = formatZodIssues(err);
      logger.error("Validation Errors:", formattedErrors);
      res.status(400).json({
        status: "fail",
        errors: formattedErrors,
      });
      return;
    }

    logger.error(`Error Occurred: ${err.message}`, err);
    const appError =
      err instanceof AppError
        ? err
        : err instanceof UniqueConstraintError
          ? new AppError("Duplicate value", 409)
          : new AppError("Internal Server Error", 500);

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
