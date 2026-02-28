import { describe, expect, it } from "vitest";
import { isValidUuid } from "@ocrwebapp/domain";

describe("isValidUuid", () => {
  describe("valid UUIDs", () => {
    it("returns true for valid UUIDv4 lowercase", () => {
      expect(isValidUuid("9f4e4a5f-7a4d-4a7f-b006-9225f39ae4d8")).toBe(true);
    });

    it("returns true for valid UUID uppercase (case-insensitive)", () => {
      expect(isValidUuid("9F4E4A5F-7A4D-4A7F-B006-9225F39AE4D8")).toBe(true);
    });

    it("returns true for UUIDv1", () => {
      expect(isValidUuid("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(true);
    });
  });

  describe("invalid UUIDs", () => {
    it("returns false for empty string", () => {
      expect(isValidUuid("")).toBe(false);
    });

    it("returns false for arbitrary string", () => {
      expect(isValidUuid("invalid-id")).toBe(false);
    });

    it("returns false for UUID without hyphens", () => {
      expect(isValidUuid("9f4e4a5f7a4d4a7fb0069225f39ae4d8")).toBe(false);
    });

    it("returns false for UUID with invalid version 0", () => {
      // Version nibble must be 1-5; all-zeros UUID has version 0
      expect(isValidUuid("00000000-0000-0000-0000-000000000000")).toBe(false);
    });

    it("returns false for UUID with trailing characters", () => {
      expect(isValidUuid("9f4e4a5f-7a4d-4a7f-b006-9225f39ae4d8extra")).toBe(false);
    });

    it("returns false for UUID with extra hyphens", () => {
      expect(isValidUuid("9f4e4a5f-7a4d-4a7f-b006-9225f39ae4d8-")).toBe(false);
    });
  });
});
