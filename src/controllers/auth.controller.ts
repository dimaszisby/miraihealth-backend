// src/controllers/auth.controller.ts

import { Request, Response, NextFunction } from "express";
// import { User } from "../models/user.model.js";
import { AuthRequest } from "../types/request.context.js";
import catchAsync from "../utils/catch-async.js";
import { successResponse } from "../utils/response-formatter.js";
import * as AuthService from "../services/auth.service.js";

/**
 * * Authentication Controller
 * Provides user authentication and profile management functions.
 */

/**
 * * Register a New User
 * @route POST /api/auth/register
 */
export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authData = await AuthService.registerUserService(req.body);

    successResponse(
      res,
      201,
      { token: authData.token, user: authData.user },
      "User created successfully"
    );
  }
);

/**
 * * Login and Retrieve Token
 * @route POST /api/auth/login
 */
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const authData = await AuthService.loginUserService(email, password);

    successResponse(res, 200, {
      token: authData.token,
      user: authData.user,
    });
  }
);

/**
 * * Get Authenticated User's Profile
 * @route GET /api/auth/profile
 */
export const getProfile = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await AuthService.getUserProfileService(req.user);
    return successResponse(res, 200, {
      id: user.id,
      username: user.username,
      email: user.email,
      age: user.age,
      sex: user.sex,
      isPublicProfile: user.isPublicProfile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
);

/**
 * * Update Authenticated User's Profile
 * @route PUT /api/auth/profile
 */
export const updateProfile = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await AuthService.updateMetricSettingsService(
      req.user,
      req.body
    );
    successResponse(res, 200, { user }, "Profile updated successfully");
  }
);

/**
 * * Logout User (Handled Client-Side for JWT)
 * @route POST /api/auth/logout
 */
export const logout = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(200).json({ message: "Logged out successfully" });
};
