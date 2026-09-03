import type { ZodError } from "zod";
import type { FieldIssue } from "@/shared/utils/error-envelope.js";

export const formatZodIssues = (error: ZodError): FieldIssue[] =>
  error.errors.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));
