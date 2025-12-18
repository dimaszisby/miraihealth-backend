import type { Request } from "express";
import type { z } from "zod";

export const pickValidated =
  <S extends z.ZodTypeAny>(schema: S) =>
  (req: Request) => {
    if (req.validated) {
      return req.validated as z.infer<S>;
    }

    const parsed = schema.safeParse({
      params: req.params,
      query: req.query,
      body: req.body,
    });

    if (!parsed.success) {
      throw parsed.error;
    }

    const result = parsed.data as z.infer<S>;
    req.validated = result;
    return result;
  };
