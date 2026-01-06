import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import type { AuthRequest } from "@/types/request.context.js";
import type { Response, NextFunction } from "express";
import AppError from "@/utils/AppError.js";
import { createErrorHandler } from "@/shared/middleware/error.js";

jest.mock("@/config/envManager.js", () => ({
  env: { NODE_ENV: "development" },
}));

const { env: envMock } = jest.requireMock("@/config/envManager.js") as {
  env: { NODE_ENV: string };
};

jest.mock("@/utils/logger.js", () => ({
  error: jest.fn(),
}));

const loggerMock = jest.requireMock("@/utils/logger.js") as {
  error: jest.Mock;
};

const createResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as unknown as Response;
};

const handler = createErrorHandler();

describe("error middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    envMock.NODE_ENV = "development";
  });

  it("returns full payload for AppError in non-production", () => {
    const err = new AppError("Validation failed", 422);
    const req = {} as AuthRequest;
    const res = createResponse();
    const next = jest.fn();

    handler(err, req, res, next as NextFunction);

    expect(loggerMock.error).toHaveBeenCalledWith(
      "Error Occurred: Validation failed",
      err,
    );
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "fail",
        message: "Validation failed",
        stack: err.stack,
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("wraps unknown errors and hides stack outside development", () => {
    envMock.NODE_ENV = "test";
    const err = new Error("boom");
    const req = {} as AuthRequest;
    const res = createResponse();

    handler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Internal Server Error",
    });
  });

  it("sends generic payload in production", () => {
    envMock.NODE_ENV = "production";
    const err = new AppError("Sensitive detail", 400);
    const res = createResponse();

    handler(err, {} as AuthRequest, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Something went wrong!",
    });
  });
});
