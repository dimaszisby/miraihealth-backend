import { describe, it, expect, jest } from "@jest/globals";
import { disallowTraceMethod } from "@/shared/middleware/method-guard.js";

const createRes = () => {
  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
};

describe("disallowTraceMethod", () => {
  it("returns 405 for TRACE requests", () => {
    const req = { method: "TRACE" } as any;
    const res = createRes();
    const next = jest.fn();

    disallowTraceMethod(req, res as any, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Allow",
      "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({
      status: "fail",
      message: "Method Not Allowed",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("passes through for other methods", () => {
    const req = { method: "GET" } as any;
    const res = createRes();
    const next = jest.fn();

    disallowTraceMethod(req, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
