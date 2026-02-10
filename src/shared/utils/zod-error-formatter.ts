import type { ZodError } from "zod";

type FormattedIssue = {
  field: string;
  message: string;
};

export const formatZodIssues = (error: ZodError): FormattedIssue[] =>
  error.errors.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));
