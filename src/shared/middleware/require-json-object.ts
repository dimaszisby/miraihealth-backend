import type { Request, Response, NextFunction } from "express";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const requireJsonObjectBody =
  (message = "Request body must be a JSON object") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const hasBody = req.body !== undefined;
    if (!hasBody || !isPlainObject(req.body)) {
      res.status(400).json({
        status: "fail",
        errors: [
          {
            field: "body",
            message,
          },
        ],
      });
      return;
    }

    next();
  };
