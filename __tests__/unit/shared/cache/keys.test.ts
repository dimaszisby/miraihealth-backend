import { describe, it, expect } from "@jest/globals";
import {
  cursorCacheNamespace,
  buildCursorCacheKey,
} from "@/shared/cache/keys.js";

// Cursor cache helpers are mostly string manipulation; document expectations here to make future refactors safer.

describe("shared/cache/keys", () => {
  describe("cursorCacheNamespace", () => {
    it("slugifies feature names and defaults to no version", () => {
      expect(cursorCacheNamespace("Metric Settings")).toBe(
        "cursor:Metric-Settings",
      );
    });

    it("appends normalized versions", () => {
      expect(cursorCacheNamespace("dashboard", 2)).toBe("cursor:dashboard:v2");
      expect(cursorCacheNamespace("dashboard", "03")).toBe(
        "cursor:dashboard:v03",
      );
      expect(cursorCacheNamespace("dashboard", "v5")).toBe(
        "cursor:dashboard:v5",
      );
      expect(cursorCacheNamespace("dashboard", "")).toBe("cursor:dashboard");
    });
  });

  describe("buildCursorCacheKey", () => {
    it("includes namespace, user scope, and segments", () => {
      const key = buildCursorCacheKey({
        feature: "metrics:list",
        version: 4,
        userId: "user-1",
        organizationId: "org-1",
        segments: [
          ["cursor", "  abc  "],
          ["filter", null],
          ["page", 2],
        ],
      });

      expect(key).toBe(
        "cursor:metrics:list:v4:user-1:org:org-1:cursor:abc:filter:_:page:2",
      );
    });

    it("normalizes user and segment values", () => {
      const key = buildCursorCacheKey({
        feature: "analytics",
        userId: "",
        organizationId: "",
        segments: [
          ["empty", ""],
          ["boolTrue", true],
          ["boolFalse", false],
          ["nan", Number.NaN],
          ["inf", Number.POSITIVE_INFINITY],
          ["whitespace", "   "],
          ["zero", 0],
          ["text", " value "],
        ],
      });

      expect(key).toBe(
        [
          "cursor:analytics:v1",
          "_", // userId
          "org:_",
          "empty:_",
          "boolTrue:1",
          "boolFalse:0",
          "nan:_",
          "inf:_",
          "whitespace:_",
          "zero:0",
          "text:value",
        ].join(":"),
      );
    });

    it("falls back when userId missing and applies default version", () => {
      const key = buildCursorCacheKey({
        feature: "metrics",
        version: undefined,
        organizationId: undefined,
        segments: [],
      });

      expect(key).toBe("cursor:metrics:v1:_:org:_");
    });
  });
});
