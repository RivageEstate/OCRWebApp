import { describe, expect, it } from "vitest";
import { isValidJobTransition } from "@/lib/jobs/status";

describe("isValidJobTransition", () => {
  it("allows queued -> processing", () => {
    expect(isValidJobTransition("queued", "processing")).toBe(true);
  });

  it("allows processing -> failed", () => {
    expect(isValidJobTransition("processing", "failed")).toBe(true);
  });

  it("rejects succeeded -> processing", () => {
    expect(isValidJobTransition("succeeded", "processing")).toBe(false);
  });
});
