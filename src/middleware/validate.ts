import { AuthRequest } from "@/types/request.context";
import { Response, NextFunction } from "express";
import { ZodError, ZodTypeAny } from "zod";

type SchemaBag = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

// Helpers
const handleError = (res: Response, error: ZodError) => {
  const formattedErrors = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  console.error("Validation Errors:", formattedErrors);
  res.status(400).json({ status: "fail", errors: formattedErrors });
};

// type guard: is it a Zod schema (object/effects/union/etc.)
function isZodSchema(x: unknown): x is ZodTypeAny {
  return !!x && typeof (x as any).safeParse === "function";
}

/**
 * Validation Middleware
 * - Accepts both a bag or full zod schema -> enables old mutation
 * - Exposes req.validated -> clear contract between the transport layer and application layer
 */
export const validate =
  (arg?: SchemaBag | ZodTypeAny) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!arg) return next();

    try {
      if (isZodSchema(arg)) {
        // Full schema: expect { params?, query?, body? }
        const parsed = arg.safeParse({
          params: req.params,
          query: req.query,
          body: req.body,
        });
        if (!parsed.success) return handleError(res, parsed.error);
        req.validated = parsed.data;
        return next();
      }

      // Bag mode (back-compat)
      const out: Record<string, unknown> = {};
      if (arg.params) {
        const p = arg.params.safeParse(req.params);
        if (!p.success) return handleError(res, p.error);
        out.params = p.data;
      }
      if (arg.query) {
        const q = arg.query.safeParse(req.query);
        if (!q.success) return handleError(res, q.error);
        out.query = q.data;
      }
      if (arg.body) {
        const b = arg.body.safeParse(req.body);
        if (!b.success) return handleError(res, b.error);
        out.body = b.data;
      }
      req.validated = out;
      return next();
    } catch (error) {
      console.error("Unexpected Error during Validation:", error);
      next(error);
    }
  };

export default validate;
