import { Request, Response, NextFunction } from "express";
import * as AuthService from "@/services/auth.service";
import catchAsync from "@/utils/catch-async";
import { successResponse } from "@/utils/response-formatter";
import { toUserResponseDTO } from "@/utils/mappers/user.mapper";
import { AuthRequest } from "@/types/request.context";
import { assertAuthenticated } from "@/utils/auth-guards";
import logger from "@/utils/logger";

/**
 * * Register a New User
 * @route POST /api/auth/register
 */
export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body ?? {};
    try {
      const authData = await AuthService.registerUserService(req.body);
      successResponse(
        res,
        201,
        { token: authData.token, user: toUserResponseDTO(authData.user) },
        "User created successfully"
      );
    } catch (error) {
      logger.error("[AUTH] Registration failed", {
        email,
        reason: (error as Error).message,
      });
      throw error;
    }
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
      user: toUserResponseDTO(authData.user),
    });
  }
);

/**
 * * Get Authenticated User's Profile
 * @route GET /api/auth/profile
 */
export const getProfile = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const user = await AuthService.getUserProfileService(req.user);

    return successResponse(res, 200, {
      id: user.id,
      username: user.username,
      email: user.email,
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
    assertAuthenticated(req);
    const user = await AuthService.updateUserProfileService(req.user, req.body);
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
