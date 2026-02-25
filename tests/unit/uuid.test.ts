import { describe, expect, it } from "vitest";
import { isValidUuid } from "@/lib/validation/uuid";

describe("isValidUuid", () => {
  it("returns true for valid UUID", () => {
    expect(isValidUuid("9f4e4a5f-7a4d-4a7f-b006-9225f39ae4d8")).toBe(true);
  });

  it("returns false for invalid value", () => {
    expect(isValidUuid("invalid-id")).toBe(false);
  });
});
