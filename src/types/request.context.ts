// src/types/request.context.ts
import { Request } from "express";
import { UserDomain } from "@/types/domain/user.domain";

export type ValidatedBag = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
};

/**
 * * Extended Request Interface for Authenticated Routes
 * Ensures all authenticated requests include user information.
 * The user property in AuthRequest is defined as optional (user?: User) because not all routes require authentication
 */
export interface AuthRequest extends Request {
  user?: UserDomain;
}
