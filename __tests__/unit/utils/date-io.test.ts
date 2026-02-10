import { describe, it, expect } from "@jest/globals";
import { parseIsoToDate, toIso } from "@/utils/date-io.js";

describe("date-io utils", () => {
  describe("parseIsoToDate", () => {
    it("returns undefined when ISO input is missing", () => {
      expect(parseIsoToDate(undefined)).toBeUndefined();
      expect(parseIsoToDate("")).toBeUndefined();
    });

    it("returns a Date instance when ISO is valid", () => {
      const iso = "2024-12-01T06:30:00.000Z";
      const parsed = parseIsoToDate(iso);

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.toISOString()).toBe(iso);
    });

    it("throws when ISO is invalid", () => {
      expect(() => parseIsoToDate("not-a-date")).toThrow(
        "Invalid ISO date-time",
      );
    });
  });

  describe("toIso", () => {
    it("serializes Date instances to ISO strings", () => {
      const date = new Date("2025-05-01T00:00:00.000Z");

      expect(toIso(date)).toBe("2025-05-01T00:00:00.000Z");
    });
  });
});
