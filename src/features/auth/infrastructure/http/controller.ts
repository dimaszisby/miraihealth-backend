import { Request, Response } from "express";
import { successResponse } from "@/utils/response-formatter.js";
import catchAsync from "@/utils/catch-async.js";
import { toUserResponseDTO } from "../../infrastructure/mappers/UserMapper.js";
import { buildAuthFeature } from "../../feature.js";
import { AuthRequest } from "@/types/request.context.js";
import { assertAuthenticated } from "@/utils/auth-guards.js";
import { pickValidated } from "@/shared/middleware/validated.js";
import { createUserBody, loginUserBody, updateUserBody } from "./schema.zod.js";
import { z } from "zod";

type AuthFeature = ReturnType<typeof buildAuthFeature>;
let feature: AuthFeature = buildAuthFeature();

export const overrideAuthFeatureForTest = (custom: AuthFeature) => {
  feature = custom;
};

const pickCreateUser = pickValidated(z.object({ body: createUserBody }));
const pickLoginUser = pickValidated(z.object({ body: loginUserBody }));
const pickUpdateUser = pickValidated(z.object({ body: updateUserBody }));

export const register = catchAsync(async (req: Request, res: Response) => {
  const {
    body: { email, username, password, passwordConfirmation, isPublicProfile },
  } = pickCreateUser(req);
  const result = await feature.registerUser.execute({
    email,
    username,
    password,
    passwordConfirmation,
    isPublicProfile,
  });

  successResponse(
    res,
    201,
    { token: result.token, user: toUserResponseDTO(result.user) },
    "User created successfully",
  );
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const {
    body: { email, password },
  } = pickLoginUser(req);
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
    const {
      body: { email, username, password, isPublicProfile, role },
    } = pickUpdateUser(req);
    const updated = await feature.updateProfile.execute({
      userId: req.user.id,
      email,
      username,
      password,
      isPublicProfile,
      role,
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
