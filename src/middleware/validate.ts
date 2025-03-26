// src/middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * * Validation Middleware
 * Used to validate incoming requests against Zod schemas.
 */

export const validate =
  (schema?: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!schema) {
      console.warn("No validation schema provided for this route.");
      return next();
    }

    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const formattedErrors = result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        console.error("Validation Errors:", formattedErrors);
        res.status(400).json({ status: "fail", errors: formattedErrors });
        return;
      }

      // Override body with parsed/validated data
      req.body = result.data;
      next();
    } catch (error) {
      console.error("Unexpected Error during Validation:", error);
      next(error);
    }
  };

export default validate;
