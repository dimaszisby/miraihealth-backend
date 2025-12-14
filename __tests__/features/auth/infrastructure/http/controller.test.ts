import { jest } from "@jest/globals";
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "@/types/request.context";
import type { buildAuthFeature } from "@/features/auth";

type ControllerModule = typeof import("@/features/auth/infrastructure/http/controller");
let register: ControllerModule["register"];
let login: ControllerModule["login"];
let getProfile: ControllerModule["getProfile"];
let updateProfile: ControllerModule["updateProfile"];
let logout: ControllerModule["logout"];
let overrideAuthFeature: ControllerModule["overrideAuthFeature"];

type AuthFeature = ReturnType<typeof buildAuthFeature>;
type AsyncMock = jest.MockedFunction<(...args: any[]) => Promise<any>>;

const registerExecute: AsyncMock = jest.fn();
const loginExecute: AsyncMock = jest.fn();
const getProfileExecute: AsyncMock = jest.fn();
const updateProfileExecute: AsyncMock = jest.fn();

const assertAuthenticatedMock = jest.fn();

jest.unstable_mockModule("@/utils/auth-guards", () => ({
  __esModule: true,
  assertAuthenticated: assertAuthenticatedMock,
}));

const loadController = async () => {
  const controller = await import(
    "@/features/auth/infrastructure/http/controller"
  );
  register = controller.register;
  login = controller.login;
  getProfile = controller.getProfile;
  updateProfile = controller.updateProfile;
  logout = controller.logout;
  overrideAuthFeature = controller.overrideAuthFeature;
};

const buildFeatureMocks = (): AuthFeature =>
  ({
    registerUser: { execute: registerExecute },
    loginUser: { execute: loginExecute },
    getProfile: { execute: getProfileExecute },
    updateProfile: { execute: updateProfileExecute },
  } as unknown as AuthFeature);

const res = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  }) as unknown as Response;

const next: NextFunction = jest.fn();

let assertAuthenticatedRef: jest.Mock;

beforeAll(async () => {
  await loadController();
  assertAuthenticatedRef = (
    await import("@/utils/auth-guards")
  ).assertAuthenticated as jest.Mock;
});

describe("Auth HTTP controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    overrideAuthFeature(buildFeatureMocks());
  });

  it("registers new users via use case", async () => {
    const user = {
      id: "user-1",
      email: "user@example.com",
      username: "tester",
      role: "user",
      isPublicProfile: true,
      passwordHash: "hash",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    registerExecute.mockResolvedValue({
      token: "jwt",
      user,
    });

    const req = {
      body: {
        email: "user@example.com",
        username: "tester",
        password: "Password123!",
        passwordConfirmation: "Password123!",
      },
    } as unknown as AuthRequest;

    const response = res();
    await register(req, response, next);

    expect(registerExecute).toHaveBeenCalledWith({
      email: "user@example.com",
      username: "tester",
      password: "Password123!",
      passwordConfirmation: "Password123!",
    });
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        message: "User created successfully",
        data: expect.objectContaining({ token: "jwt" }),
      })
    );
  });

  it("logs users in via use case", async () => {
    const user = {
      id: "user-1",
      email: "user@example.com",
      username: "tester",
      role: "user",
      isPublicProfile: true,
      passwordHash: "hash",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    loginExecute.mockResolvedValue({
      token: "jwt",
      user,
    });

    const req = {
      body: { email: "user@example.com", password: "Password123!" },
    } as unknown as AuthRequest;

    const response = res();
    await login(req, response, next);

    expect(loginExecute).toHaveBeenCalledWith("user@example.com", "Password123!");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        data: expect.objectContaining({ token: "jwt" }),
      })
    );
  });

  it("returns the authenticated profile", async () => {
    getProfileExecute.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      username: "tester",
      role: "user",
      isPublicProfile: true,
      passwordHash: "hash",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const req = {
      user: { id: "user-1" },
    } as unknown as AuthRequest;

    const response = res();
    await getProfile(req, response, next);

    expect(getProfileExecute).toHaveBeenCalledWith("user-1");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        data: expect.objectContaining({ id: "user-1" }),
      })
    );
  });

  it("updates profile using feature use case", async () => {
    updateProfileExecute.mockResolvedValue({
      id: "user-1",
      email: "new@example.com",
      username: "new",
      role: "user",
      isPublicProfile: false,
      passwordHash: "hash",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const req = {
      user: { id: "user-1" },
      body: {
        email: "new@example.com",
        username: "new",
        password: "Password123!",
        isPublicProfile: false,
      },
    } as unknown as AuthRequest;

    const response = res();
    await updateProfile(req, response, next);

    expect(updateProfileExecute).toHaveBeenCalledWith({
      userId: "user-1",
      email: "new@example.com",
      username: "new",
      password: "Password123!",
      isPublicProfile: false,
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Profile updated successfully",
        data: expect.objectContaining({
          user: expect.objectContaining({ id: "user-1" }),
        }),
      })
    );
  });

  it("requires authentication before fetching profile", async () => {
    const response = res();
    const errorNext = jest.fn();

    await getProfile({} as AuthRequest, response, errorNext);

    expect(errorNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it("requires authentication before updating profile", async () => {
    const response = res();
    const errorNext = jest.fn();

    await updateProfile({ body: {} } as AuthRequest, response, errorNext);

    expect(errorNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it("logs out by returning success message", () => {
    const response = res();
    const req = {} as AuthRequest;

    logout(req, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        message: "Logged out successfully",
        data: null,
      })
    );
  });
});
