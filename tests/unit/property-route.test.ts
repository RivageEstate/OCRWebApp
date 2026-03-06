import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireUserId = vi.fn();
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockRevisionCreate = vi.fn();
const mockTransaction = vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
  callback({
    normalizedProperty: {
      update: mockUpdate
    },
    revision: {
      create: mockRevisionCreate
    }
  })
);

const mockPrisma = {
  normalizedProperty: {
    findFirst: mockFindFirst,
    findUnique: mockFindUnique
  },
  $transaction: mockTransaction
};

vi.mock("@/lib/auth/session", () => ({
  requireUserId: mockRequireUserId,
  UnauthorizedError: class UnauthorizedError extends Error {}
}));

vi.mock("@ocrwebapp/db", () => ({
  prisma: mockPrisma
}));

const { PUT } = await import("@web/app/api/properties/[propertyId]/route");

describe("PUT /api/properties/[propertyId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue("11111111-1111-1111-1111-111111111111");
    mockFindUnique.mockResolvedValue(null);
  });

  it("updates a property and records a revision", async () => {
    mockFindFirst.mockResolvedValue({
      id: "prop-1",
      propertyName: "旧物件名",
      address: "東京都港区",
      price: 10000,
      rent: 30,
      yield: 3.6,
      structure: "RC",
      builtYear: "2000年",
      stationInfo: "新橋駅 徒歩8分",
      editableFields: { propertyName: "旧物件名" },
      updatedAt: new Date("2026-03-07T00:00:00Z")
    });
    mockUpdate.mockResolvedValue({
      id: "prop-1",
      propertyName: "新物件名",
      address: "東京都港区",
      price: 11000,
      rent: 32,
      yield: 3.49,
      structure: "RC",
      builtYear: "2000年",
      stationInfo: "新橋駅 徒歩8分",
      editableFields: { propertyName: "新物件名" },
      updatedAt: new Date("2026-03-07T01:00:00Z")
    });

    const response = await PUT(
      new Request("http://localhost/api/properties/prop-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_name: "新物件名",
          price: 11000,
          rent: 32,
          yield: 3.49
        })
      }),
      { params: Promise.resolve({ propertyId: "55555555-5555-4555-8555-555555555555" }) }
    );

    expect(response.status).toBe(200);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockRevisionCreate).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({
      id: "prop-1",
      property_name: "新物件名",
      address: "東京都港区",
      price: 11000,
      rent: 32,
      yield: 3.49,
      structure: "RC",
      built_year: "2000年",
      station_info: "新橋駅 徒歩8分",
      editable_fields: { propertyName: "新物件名" },
      updated_at: "2026-03-07T01:00:00.000Z"
    });
  });

  it("returns 400 when a decimal exceeds the schema precision", async () => {
    const response = await PUT(
      new Request("http://localhost/api/properties/prop-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yield: 1234.56 })
      }),
      { params: Promise.resolve({ propertyId: "55555555-5555-4555-8555-555555555555" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid_yield" });
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("skips update and revision when the submitted values match the current snapshot", async () => {
    mockFindFirst.mockResolvedValue({
      id: "prop-1",
      propertyName: "旧物件名",
      address: "東京都港区",
      price: 10000,
      rent: 30,
      yield: 3.6,
      structure: "RC",
      builtYear: "2000年",
      stationInfo: "新橋駅 徒歩8分",
      editableFields: { propertyName: "旧物件名" },
      updatedAt: new Date("2026-03-07T00:00:00Z")
    });

    const response = await PUT(
      new Request("http://localhost/api/properties/prop-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_name: "旧物件名",
          address: "東京都港区",
          price: 10000,
          rent: 30,
          yield: 3.6,
          structure: "RC",
          built_year: "2000年",
          station_info: "新橋駅 徒歩8分"
        })
      }),
      { params: Promise.resolve({ propertyId: "55555555-5555-4555-8555-555555555555" }) }
    );

    expect(response.status).toBe(200);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockRevisionCreate).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      id: "prop-1",
      property_name: "旧物件名",
      address: "東京都港区",
      price: 10000,
      rent: 30,
      yield: 3.6,
      structure: "RC",
      built_year: "2000年",
      station_info: "新橋駅 徒歩8分",
      editable_fields: { propertyName: "旧物件名" },
      updated_at: "2026-03-07T00:00:00.000Z"
    });
  });
});
