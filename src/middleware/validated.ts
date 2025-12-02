import type { Request } from "express";
import type { z } from "zod";

/**
 * Validate Zod Schema
 * - Used to validate req data with schemas
 * - current uses: Controller
 */

export const pickValidated =
  <S extends z.ZodTypeAny>(schema: S) =>
  (req: Request) =>
    req.validated as z.infer<S>;
