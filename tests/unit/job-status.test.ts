import { describe, expect, it } from "vitest";
import { isValidJobTransition } from "@ocrwebapp/domain";

describe("isValidJobTransition", () => {
  describe("allowed transitions", () => {
    it("allows queued -> processing", () => {
      expect(isValidJobTransition("queued", "processing")).toBe(true);
    });

    it("allows queued -> failed", () => {
      expect(isValidJobTransition("queued", "failed")).toBe(true);
    });

    it("allows processing -> succeeded", () => {
      expect(isValidJobTransition("processing", "succeeded")).toBe(true);
    });

    it("allows processing -> failed", () => {
      expect(isValidJobTransition("processing", "failed")).toBe(true);
    });
  });

  describe("rejected transitions from terminal states", () => {
    it("rejects succeeded -> processing", () => {
      expect(isValidJobTransition("succeeded", "processing")).toBe(false);
    });

    it("rejects succeeded -> failed", () => {
      expect(isValidJobTransition("succeeded", "failed")).toBe(false);
    });

    it("rejects succeeded -> queued", () => {
      expect(isValidJobTransition("succeeded", "queued")).toBe(false);
    });

    it("rejects failed -> processing", () => {
      expect(isValidJobTransition("failed", "processing")).toBe(false);
    });

    it("rejects failed -> succeeded", () => {
      expect(isValidJobTransition("failed", "succeeded")).toBe(false);
    });

    it("rejects failed -> queued", () => {
      expect(isValidJobTransition("failed", "queued")).toBe(false);
    });
  });

  describe("rejected invalid transitions", () => {
    it("rejects queued -> succeeded (skips processing)", () => {
      expect(isValidJobTransition("queued", "succeeded")).toBe(false);
    });

    it("rejects processing -> queued (backward)", () => {
      expect(isValidJobTransition("processing", "queued")).toBe(false);
    });

    it("rejects self-transition queued -> queued", () => {
      expect(isValidJobTransition("queued", "queued")).toBe(false);
    });

    it("rejects self-transition processing -> processing", () => {
      expect(isValidJobTransition("processing", "processing")).toBe(false);
    });
  });
});
