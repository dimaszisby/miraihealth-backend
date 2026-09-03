import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import type { AuthRequest } from "@/types/request.context.js";
import type { Response, NextFunction } from "express";
import AppError from "@/utils/AppError.js";
import { z, type ZodError } from "zod";
import { createErrorHandler } from "@/shared/middleware/error.js";

// Swap env + logger bindings so the middleware can be tested deterministically without touching real config/logging.
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

// Instantiate once; per-test NODE_ENV mutations control behavior.
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

  // C3 defect 2. This test used to assert the opposite: that a 400 in production
  // was masked to `{status:"error", message:"Something went wrong!"}`. Masking is
  // a 5xx concern — a 4xx describes what the client got wrong and is safe to
  // return. If this suite ever passes with the old expectations, the masking gate
  // was reverted.
  it("keeps the real 4xx message in production", () => {
    envMock.NODE_ENV = "production";
    const err = new AppError("Metric name already taken", 409);
    const res = createResponse();

    handler(err, {} as AuthRequest, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      status: "fail",
      message: "Metric name already taken",
    });
  });

  it("masks 5xx messages in production", () => {
    envMock.NODE_ENV = "production";
    const err = new AppError("Resend email send failed: bad api key", 500);
    const res = createResponse();

    handler(err, {} as AuthRequest, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Something went wrong!",
    });
  });

  it("emits the unified envelope for malformed JSON", () => {
    envMock.NODE_ENV = "test";
    const err = Object.assign(new SyntaxError("Unexpected token"), {
      type: "entity.parse.failed",
      status: 400,
    });
    const res = createResponse();

    handler(err, {} as AuthRequest, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "fail",
      message: "Malformed JSON payload. Provide a valid JSON object.",
      errors: [
        {
          field: "body",
          message: "Malformed JSON payload. Provide a valid JSON object.",
        },
      ],
    });
  });

  it("emits a message alongside field errors for ZodError", () => {
    envMock.NODE_ENV = "test";
    const err = z.object({ name: z.string() }).safeParse({}).error as ZodError;
    const res = createResponse();

    handler(err, {} as AuthRequest, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "fail",
      message: "Validation failed",
      errors: [{ field: "name", message: expect.any(String) }],
    });
  });
});
