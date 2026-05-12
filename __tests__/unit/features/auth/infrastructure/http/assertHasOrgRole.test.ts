import { jest } from "@jest/globals";
import {
  assertHasOrgRole,
  requireOrgRole,
} from "@/features/auth/infrastructure/http/assertHasOrgRole.js";
import { AuthRequest, MembershipInfo } from "@/types/request.context.js";
import type { Response, NextFunction } from "express";
import AppError from "@/utils/AppError.js";

const makeMembership = (
  role: MembershipInfo["role"] = "member",
): MembershipInfo => ({
  id: "mem-1",
  role,
  organizationId: "org-1",
  userId: "user-1",
});

const makeReq = (membership?: MembershipInfo): AuthRequest =>
  ({ membership }) as AuthRequest;

const makeRes = () => ({}) as Response;
const makeNext = (): NextFunction => jest.fn() as unknown as NextFunction;

describe("assertHasOrgRole", () => {
  it("does not throw when role matches", () => {
    const req = makeReq(makeMembership("admin"));
    expect(() => assertHasOrgRole(req, "admin")).not.toThrow();
  });

  it("does not throw when role matches one of multiple allowed roles", () => {
    const req = makeReq(makeMembership("owner"));
    expect(() => assertHasOrgRole(req, "admin", "owner")).not.toThrow();
  });

  it("throws 403 when role does not match", () => {
    const req = makeReq(makeMembership("member"));
    expect(() => assertHasOrgRole(req, "admin")).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it("throws 403 when role matches none of multiple allowed roles", () => {
    const req = makeReq(makeMembership("member"));
    expect(() => assertHasOrgRole(req, "admin", "owner")).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it("throws 401 when membership is undefined", () => {
    const req = makeReq(undefined);
    expect(() => assertHasOrgRole(req, "admin")).toThrow(
      expect.objectContaining({ statusCode: 401 }),
    );
  });
});

describe("requireOrgRole middleware", () => {
  it("calls next() when role matches", () => {
    const req = makeReq(makeMembership("admin"));
    const next = makeNext();
    requireOrgRole("admin", "owner")(req, makeRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it("calls next(AppError 403) when role does not match", () => {
    const req = makeReq(makeMembership("member"));
    const next = makeNext();
    requireOrgRole("admin")(req, makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as unknown as AppError).statusCode).toBe(403);
  });

  it("calls next(AppError 401) when membership is undefined", () => {
    const req = makeReq(undefined);
    const next = makeNext();
    requireOrgRole("admin")(req, makeRes(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as unknown as AppError).statusCode).toBe(401);
  });
});
