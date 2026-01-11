import { describe, it, expect, jest } from "@jest/globals";
import { tokenGenerator } from "@/utils/token-generator.js";

// Mock env + jsonwebtoken so this spec only verifies wiring, not cryptography internals.
jest.mock("@/config/envManager.js", () => ({
  env: { JWT_SECRET: "super-secret" },
}));

const signMock = jest.fn().mockReturnValue("signed-token");
jest.mock("jsonwebtoken", () => ({
  sign: (...args: unknown[]) => signMock(...args),
}));

describe("token-generator", () => {
  beforeEach(() => {
    signMock.mockClear();
  });

  it("delegates to jsonwebtoken.sign with the expected payload + secret", () => {
    const token = tokenGenerator({
      id: "user-123",
      email: "user@example.com",
    });

    expect(token).toBe("signed-token");
    expect(signMock).toHaveBeenCalledWith(
      { id: "user-123", email: "user@example.com" },
      "super-secret",
      { expiresIn: "7d" },
    );
  });
});
