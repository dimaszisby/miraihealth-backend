import { AuthRequest } from "@/types/request.context.js";
import { Response, NextFunction } from "express";
import { ZodError, ZodTypeAny } from "zod";

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

const isZodSchema = (x: unknown): x is ZodTypeAny =>
  !!x && typeof (x as any).safeParse === "function";

export const validate =
  (arg?: SchemaBag | ZodTypeAny) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!arg) return next();

    try {
      if (isZodSchema(arg)) {
        const parsed = arg.safeParse({
          params: req.params,
          query: req.query,
          body: req.body,
        });
        if (!parsed.success) return handleError(res, parsed.error);
        req.validated = parsed.data;
        return next();
      }

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
