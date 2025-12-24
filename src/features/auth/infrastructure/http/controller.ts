import { Request, Response, NextFunction } from "express";
import { successResponse } from "@/utils/response-formatter.js";
import catchAsync from "@/utils/catch-async.js";
import { toUserResponseDTO } from "../../infrastructure/mappers/UserMapper.js";
import AppError from "@/utils/AppError.js";
import { buildAuthFeature } from "../../feature.js";
import { AuthRequest } from "@/types/request.context.js";
import { assertAuthenticated } from "@/utils/auth-guards.js";

type AuthFeature = ReturnType<typeof buildAuthFeature>;
let feature: AuthFeature = buildAuthFeature();

export const overrideAuthFeatureForTest = (custom: AuthFeature) => {
  feature = custom;
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email, username, password, passwordConfirmation } = req.body;
  const result = await feature.registerUser.execute({
    email,
    username,
    password,
    passwordConfirmation,
  });

  successResponse(
    res,
    201,
    { token: result.token, user: toUserResponseDTO(result.user) },
    "User created successfully",
  );
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await feature.loginUser.execute(email, password);
  successResponse(res, 200, {
    token: result.token,
    user: toUserResponseDTO(result.user),
  });
});

export const getProfile = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const user = await feature.getProfile.execute(req.user.id);
    successResponse(res, 200, toUserResponseDTO(user));
  },
);

export const updateProfile = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const updated = await feature.updateProfile.execute({
      userId: req.user.id,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      isPublicProfile: req.body.isPublicProfile,
    });
    successResponse(
      res,
      200,
      { user: toUserResponseDTO(updated) },
      "Profile updated successfully",
    );
  },
);

export const logout = (req: Request, res: Response): void => {
  successResponse(res, 200, null, "Logged out successfully");
};
