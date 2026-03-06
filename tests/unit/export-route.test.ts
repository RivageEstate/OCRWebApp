import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireUserId = vi.fn();
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockPrisma = {
  normalizedProperty: {
    findFirst: mockFindFirst,
    findUnique: mockFindUnique
  }
};

vi.mock("@/lib/auth/session", () => ({
  requireUserId: mockRequireUserId,
  UnauthorizedError: class UnauthorizedError extends Error {}
}));

vi.mock("@ocrwebapp/db", () => ({
  prisma: mockPrisma
}));

const { GET } = await import("@web/app/api/properties/[propertyId]/export/route");

describe("GET /api/properties/[propertyId]/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue("11111111-1111-1111-1111-111111111111");
    mockFindUnique.mockResolvedValue(null);
  });

  it("exports CSV with the fixed field order and filename convention", async () => {
    mockFindFirst.mockResolvedValue({
      id: "prop-1",
      propertyName: "テスト物件",
      address: "東京都渋谷区",
      price: 12000,
      rent: 45,
      yield: 4.5,
      structure: "RC",
      builtYear: "2001年",
      stationInfo: "渋谷駅 徒歩5分",
      updatedAt: new Date("2026-03-07T00:00:00Z")
    });

    const response = await GET(
      new Request("http://localhost/api/properties/prop-1/export?format=csv"),
      { params: Promise.resolve({ propertyId: "66666666-6666-4666-8666-666666666666" }) }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("property_prop-1_20260307.csv");
    const body = await response.text();
    expect(body).toContain("物件名");
    expect(body).toContain("更新日時");
  });

  it("returns 400 for unsupported formats", async () => {
    const response = await GET(
      new Request("http://localhost/api/properties/prop-1/export?format=xlsx"),
      { params: Promise.resolve({ propertyId: "66666666-6666-4666-8666-666666666666" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "format must be csv or pdf" });
  });
});
