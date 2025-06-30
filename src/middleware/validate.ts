// src/middleware/validate.ts

import { AuthRequest } from "@/types/request.context";
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, AnyZodObject } from "zod";

/**
 * * Validation Middleware
 * Used to validate incoming requests against Zod schemas.
 */

const handleError = (res: Response, error: ZodError) => {
  const formattedErrors = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  console.error("Validation Errors:", formattedErrors);
  res.status(400).json({ status: "fail", errors: formattedErrors });
};

export const validate =
  (schema?: AnyZodObject) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!schema) {
      console.warn("No validation schema provided for this route.");
      return next();
    }

    try {
      const { body, params, query } = schema.shape;

      if (body) {
        const parsedBody = body.safeParse(req.body);
        if (!parsedBody.success) return handleError(res, parsedBody.error);
        req.body = parsedBody.data;
      }

      if (params) {
        const parsedParams = params.safeParse(req.params);
        if (!parsedParams.success) return handleError(res, parsedParams.error);
        req.params = parsedParams.data;
      }

      if (query) {
        const parsedQuery = query.safeParse(req.query);
        if (!parsedQuery.success) return handleError(res, parsedQuery.error);
        req.query = parsedQuery.data;
      }

      // Override body with parsed/validated data
      // req.body = result.data;
      return next();
    } catch (error) {
      console.error("Unexpected Error during Validation:", error);
      next(error);
    }
  };

export default validate;
