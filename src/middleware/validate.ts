// src/middleware/validate.ts

import { AuthRequest } from "@/types/request.context";
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, AnyZodObject, ZodTypeAny } from "zod";

/**
 * * Validation Middleware
 * Used to validate incoming requests against Zod schemas.
 */

type SchemaBag = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

const handleError = (res: Response, error: ZodError) => {
  const formattedErrors = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  console.error("Validation Errors:", formattedErrors);
  res.status(400).json({ status: "fail", errors: formattedErrors });
};

export const validate =
  (schemas?: SchemaBag) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!schemas) {
      console.warn("No validation schema provided for this route.");
      return next();
    }

    try {
      if (schemas.body) {
        const parsedBody = schemas.body.safeParse(req.body);
        if (!parsedBody.success) return handleError(res, parsedBody.error);
        req.body = parsedBody.data as typeof req.body;
      }

      if (schemas.params) {
        const parsedParams = schemas.params.safeParse(req.params);
        if (!parsedParams.success) return handleError(res, parsedParams.error);
        req.params = parsedParams.data as typeof req.params;
      }

      if (schemas.query) {
        const parsedQuery = schemas.query.safeParse(req.query);
        if (!parsedQuery.success) return handleError(res, parsedQuery.error);
        req.query = parsedQuery.data as any;
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
