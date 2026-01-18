import type { Request, Response, NextFunction } from "express";

/**
 * Blocks unsupported HTTP methods that should consistently return 405
 * across the API surface (e.g., TRACE) so contract tests don't receive 404s.
 */
export function disallowTraceMethod(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.method === "TRACE") {
    res.status(405).json({
      status: "fail",
      message: "Method Not Allowed",
    });
    return;
  }

  next();
}
