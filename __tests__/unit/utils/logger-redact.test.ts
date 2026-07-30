import { describe, it, expect } from "@jest/globals";
import { redactObject } from "@/utils/logger.js";

describe("redactObject", () => {
  it("masks keys matching SENSITIVE_KEY_PATTERN at the top level", () => {
    const result = redactObject(
      { password: "secret123", username: "alice" },
      0,
    );
    expect((result as Record<string, unknown>).password).toBe("***REDACTED***");
    expect((result as Record<string, unknown>).username).toBe("alice");
  });

  it("masks token and other sensitive keys", () => {
    const result = redactObject(
      { token: "jwt-abc", email: "user@example.com" },
      0,
    );
    expect((result as Record<string, unknown>).token).toBe("***REDACTED***");
    expect((result as Record<string, unknown>).email).toBe("user@example.com");
  });

  it("masks nested sensitive keys in nested objects", () => {
    const result = redactObject(
      { user: { password: "secret", name: "alice" } },
      0,
    ) as Record<string, Record<string, unknown>>;
    expect(result.user.password).toBe("***REDACTED***");
    expect(result.user.name).toBe("alice");
  });

  it("handles arrays containing objects with sensitive keys", () => {
    const result = redactObject(
      [{ password: "s" }, { username: "alice" }],
      0,
    ) as Array<Record<string, unknown>>;
    expect(result[0].password).toBe("***REDACTED***");
    expect(result[1].username).toBe("alice");
  });

  it("returns primitives unchanged", () => {
    expect(redactObject("plain string", 0)).toBe("plain string");
    expect(redactObject(42, 0)).toBe(42);
    expect(redactObject(null, 0)).toBe(null);
    expect(redactObject(true, 0)).toBe(true);
  });

  it("stops recursing at depth 5 — objects at that depth are returned as-is", () => {
    // Nesting: depth 0 → 1 → 2 → 3 → 4 → bail at 5, so the innermost
    // object at depth 5 is returned unchanged (password NOT redacted).
    const deep = {
      a: { a: { a: { a: { a: { password: "should-not-be-redacted" } } } } },
    };
    const result = redactObject(deep, 0) as Record<
      string,
      Record<
        string,
        Record<string, Record<string, Record<string, Record<string, unknown>>>>
      >
    >;
    expect(result.a.a.a.a.a.password).toBe("should-not-be-redacted");
  });

  it("masks multiple sensitive keys in the same object", () => {
    const result = redactObject(
      {
        password: "p",
        token: "t",
        apiKey: "k",
        username: "alice",
        description: "safe",
      },
      0,
    ) as Record<string, unknown>;
    expect(result.password).toBe("***REDACTED***");
    expect(result.token).toBe("***REDACTED***");
    expect(result.apiKey).toBe("***REDACTED***");
    expect(result.username).toBe("alice");
    expect(result.description).toBe("safe");
  });
});
