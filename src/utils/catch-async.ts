// src/utils/catchAsync.js

import { Request, Response, NextFunction } from "express";

/**
 * Wraps an async route handler and ensures errors are passed to the global error handler.
 * Prevents unhandled promise rejections.
 *
 * @param fn - The async function to wrap.
 * @returns A function that handles errors and passes them to `next()`.
 */
const catchAsync =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

export default catchAsync;
