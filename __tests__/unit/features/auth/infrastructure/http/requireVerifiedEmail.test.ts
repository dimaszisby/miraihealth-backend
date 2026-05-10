import { jest } from "@jest/globals";
import { requireVerifiedEmail } from "@/features/auth/infrastructure/http/requireVerifiedEmail.js";
import { AuthRequest } from "@/types/request.context.js";
import type { Response, NextFunction } from "express";
import AppError from "@/utils/AppError.js";

const makeReq = (user?: Partial<AuthRequest["user"]>): AuthRequest =>
  ({
    user: user
      ? {
          id: "user-1",
          email: "user@example.com",
          username: "tester",
          role: "user",
          isPublicProfile: true,
          emailVerifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...user,
        }
      : undefined,
  }) as AuthRequest;

const makeRes = () => ({}) as Response;
const makeNext = (): NextFunction => jest.fn() as unknown as NextFunction;

describe("requireVerifiedEmail middleware", () => {
  it("calls next() when user has emailVerifiedAt set", () => {
    const req = makeReq({ emailVerifiedAt: new Date("2026-05-08T10:00:00Z") });
    const next = makeNext();
    requireVerifiedEmail(req, makeRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it("calls next(AppError 403) when emailVerifiedAt is null", () => {
    const req = makeReq({ emailVerifiedAt: null });
    const next = makeNext();
    requireVerifiedEmail(req, makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as unknown as AppError).statusCode).toBe(403);
  });

  it("calls next(AppError 401) when req.user is undefined", () => {
    const req = makeReq(undefined);
    const next = makeNext();
    requireVerifiedEmail(req, makeRes(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as unknown as AppError).statusCode).toBe(401);
  });
});
