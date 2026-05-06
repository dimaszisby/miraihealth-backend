import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export const requestIdStorage = new AsyncLocalStorage<string>();

export const getRequestId = (): string | undefined =>
  requestIdStorage.getStore();

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const incoming = req.headers["x-request-id"];
  const requestId =
    typeof incoming === "string" && incoming.length > 0
      ? incoming
      : randomUUID();

  res.setHeader("x-request-id", requestId);
  requestIdStorage.run(requestId, () => next());
};
