import logger from "@/utils/logger.js";

type Context = Record<string, unknown> | undefined;

export const logCacheInvalidation = (scope: string, context?: Context) => {
  logger.debug("[CACHE] invalidate", { scope, ...(context ?? {}) });
};

export const logCacheInvalidationError = (
  scope: string,
  error: unknown,
  context?: Context,
) => {
  const payload: Record<string, unknown> = {
    scope,
    error,
    ...(context ?? {}),
  };

  if (error instanceof Error) {
    payload.error = error.message;
    payload.stack = error.stack;
  }

  logger.error("[CACHE] invalidate failed", payload);
};
