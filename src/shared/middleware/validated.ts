import type { Request } from "express";
import type { z } from "zod";

export const pickValidated =
  <S extends z.ZodTypeAny>(schema: S) =>
  (req: Request) =>
    req.validated as z.infer<S>;
