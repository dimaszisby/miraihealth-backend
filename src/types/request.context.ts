// src/types/requestContext.ts

import { Request } from "express";
import { User } from "./user.types.js";

/**
 * * Extended Request Interface for Authenticated Routes
 * Ensures all authenticated requests include user information.
 * The user property in AuthRequest is defined as optional (user?: User) because not all routes require authentication
 */
export interface AuthRequest extends Request {
  user?: User;
}
