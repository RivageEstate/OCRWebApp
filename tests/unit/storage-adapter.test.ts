import { describe, expect, it } from "vitest";
import { getStorageAdapter } from "@ocrwebapp/providers";

describe("LocalStubStorageAdapter", () => {
  const adapter = getStorageAdapter();

  describe("upload()", () => {
    it("returns a string path", async () => {
      const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
      const result = await adapter.upload(file);
      expect(typeof result).toBe("string");
    });

    it("path starts with 'stub/'", async () => {
      const file = new File(["content"], "document.pdf", { type: "application/pdf" });
      const result = await adapter.upload(file);
      expect(result.startsWith("stub/")).toBe(true);
    });

    it("path contains the original filename", async () => {
      const file = new File(["content"], "property-overview.png", { type: "image/png" });
      const result = await adapter.upload(file);
      expect(result).toContain("property-overview.png");
    });

    it("generates unique paths for successive uploads", async () => {
      const file1 = new File(["a"], "same.jpg", { type: "image/jpeg" });
      const file2 = new File(["b"], "same.jpg", { type: "image/jpeg" });
      const path1 = await adapter.upload(file1);
      // Small delay to ensure timestamp differs
      await new Promise((r) => setTimeout(r, 1));
      const path2 = await adapter.upload(file2);
      expect(path1).not.toBe(path2);
    });
  });

  describe("getSignedUrl()", () => {
    it("returns a string", async () => {
      const url = await adapter.getSignedUrl("stub/2026-02-28-test.jpg");
      expect(typeof url).toBe("string");
    });

    it("returns a valid URL", async () => {
      const url = await adapter.getSignedUrl("stub/2026-02-28-test.jpg");
      expect(() => new URL(url)).not.toThrow();
    });
  });

  describe("delete()", () => {
    it("resolves without throwing", async () => {
      await expect(adapter.delete("stub/some-path.jpg")).resolves.toBeUndefined();
    });
  });
});
