// src/types/request.context.ts

import { Request } from "express";
import { UserDTO } from "./dtos/user.dto";

/**
 * * Extended Request Interface for Authenticated Routes
 * Ensures all authenticated requests include user information.
 * The user property in AuthRequest is defined as optional (user?: User) because not all routes require authentication
 */
export interface AuthRequest extends Request {
  // Question: Should I use User (Domain Model) or UserBase (Type) here
  user?: UserDTO;
}
