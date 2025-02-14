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
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        console.error("Validation Errors:", formattedErrors);
        res.status(400).json({ status: "fail", errors: formattedErrors });
        return; // ✅ Ensure function stops execution
      }

      console.error("Unexpected Error during Validation:", error);
      next(error); // ✅ Pass unexpected errors to global error handler
    }
  };

export default validate;
