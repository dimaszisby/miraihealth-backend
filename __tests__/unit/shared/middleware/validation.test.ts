import {
  describe,
  it,
  expect,
  beforeEach,
  afterAll,
  jest,
} from "@jest/globals";
import { z, type ZodTypeAny } from "zod";
import type { AuthRequest } from "@/types/request.context.js";
import type { Response, NextFunction } from "express";
import { validate } from "@/shared/middleware/validation.js";

const createResponse = (): Response => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as unknown as Response;
};

const consoleErrorSpy = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

const makeRequest = (overrides: Partial<AuthRequest>): AuthRequest =>
  ({
    params: {},
    query: {},
    body: {},
    ...overrides,
  }) as unknown as AuthRequest;

describe("validation middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("passes through when no schema is provided", () => {
    const middleware = validate();
    const req = {} as AuthRequest;
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("validates using a single schema object", () => {
    const middleware = validate(
      z.object({
        params: z.object({ id: z.string() }),
        query: z.object({ search: z.string().optional() }),
        body: z.object({ name: z.string() }),
      }),
    );
    const req = makeRequest({
      params: { id: "metric-1" },
      query: {},
      body: { name: "Speed" },
    });
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.validated).toEqual({
      params: { id: "metric-1" },
      query: {},
      body: { name: "Speed" },
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when the single schema fails", () => {
    const middleware = validate(
      z.object({
        params: z.object({ id: z.string() }),
        body: z.object({ name: z.string() }),
      }),
    );
    const req = { params: {}, body: {} } as AuthRequest;
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "fail",
        errors: expect.arrayContaining([
          expect.objectContaining({ field: expect.any(String) }),
        ]),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("supports schema bags with params/query/body separation", () => {
    const middleware = validate({
      params: z.object({ id: z.string() }),
      query: z.object({ cursor: z.string().optional() }),
      body: z.object({ limit: z.number().min(1).max(100) }),
    });
    const req = makeRequest({
      params: { id: "metric-1" },
      query: { cursor: "abc" },
      body: { limit: 10 },
    });
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.validated).toEqual({
      params: { id: "metric-1" },
      query: { cursor: "abc" },
      body: { limit: 10 },
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("short-circuits when a nested schema fails", () => {
    const middleware = validate({
      body: z.object({ limit: z.number().min(5) }),
    });
    const req = makeRequest({ body: { limit: 1 } });
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "limit" }),
        ]),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("logs unexpected errors and forwards them", () => {
    const error = new Error("boom");
    const throwingSchema = {
      safeParse: () => {
        throw error;
      },
    } as unknown as ZodTypeAny;

    const middleware = validate({
      params: throwingSchema,
    });

    const req = makeRequest({ params: {} });
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Unexpected Error during Validation:",
      error,
    );
    expect(next).toHaveBeenCalledWith(error);
  });
});
