import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireUserId = vi.fn();
const MockUnauthorizedError = class UnauthorizedError extends Error {};
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockPrisma = {
  normalizedProperty: {
    findFirst: mockFindFirst,
    findUnique: mockFindUnique
  },
  revision: {
    findMany: mockFindMany
  }
};

vi.mock("@/lib/auth/session", () => ({
  requireUserId: mockRequireUserId,
  UnauthorizedError: MockUnauthorizedError
}));

vi.mock("@ocrwebapp/db", () => ({
  prisma: mockPrisma
}));

const { GET } = await import("@web/app/api/properties/[propertyId]/revisions/route");

describe("GET /api/properties/[propertyId]/revisions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue("11111111-1111-1111-1111-111111111111");
    mockFindUnique.mockResolvedValue(null);
  });

  it("returns revision history for an owned property", async () => {
    mockFindFirst.mockResolvedValue({ id: "55555555-5555-4555-8555-555555555555" });
    mockFindMany.mockResolvedValue([
      {
        id: "rev-1",
        createdAt: new Date("2026-03-07T01:00:00Z"),
        before: { property_name: "旧物件名", price: 10000 },
        after: { property_name: "新物件名", price: 10000 }
      },
      {
        id: "rev-2",
        createdAt: new Date("2026-03-07T00:30:00Z"),
        before: { property_name: "初期物件名", price: 9000 },
        after: { property_name: "旧物件名", price: 10000 }
      }
    ]);

    const response = await GET(
      new Request("http://localhost/api/properties/55555555-5555-4555-8555-555555555555/revisions"),
      { params: Promise.resolve({ propertyId: "55555555-5555-4555-8555-555555555555" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      {
        revision_id: "rev-1",
        changed_at: "2026-03-07T01:00:00.000Z",
        before: { property_name: "旧物件名", price: 10000 },
        after: { property_name: "新物件名", price: 10000 }
      },
      {
        revision_id: "rev-2",
        changed_at: "2026-03-07T00:30:00.000Z",
        before: { property_name: "初期物件名", price: 9000 },
        after: { property_name: "旧物件名", price: 10000 }
      }
    ]);
  });

  it("returns an empty array when no revisions exist", async () => {
    mockFindFirst.mockResolvedValue({ id: "55555555-5555-4555-8555-555555555555" });
    mockFindMany.mockResolvedValue([]);

    const response = await GET(
      new Request("http://localhost/api/properties/55555555-5555-4555-8555-555555555555/revisions"),
      { params: Promise.resolve({ propertyId: "55555555-5555-4555-8555-555555555555" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
  });

  it("returns 400 for an invalid property ID format", async () => {
    const response = await GET(
      new Request("http://localhost/api/properties/not-a-uuid/revisions"),
      { params: Promise.resolve({ propertyId: "not-a-uuid" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid_property_id" });
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when the property does not exist", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockFindUnique.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/properties/55555555-5555-4555-8555-555555555555/revisions"),
      { params: Promise.resolve({ propertyId: "55555555-5555-4555-8555-555555555555" }) }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "not_found" });
  });

  it("returns 403 when the property belongs to another user", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockFindUnique.mockResolvedValue({ id: "55555555-5555-4555-8555-555555555555" });

    const response = await GET(
      new Request("http://localhost/api/properties/55555555-5555-4555-8555-555555555555/revisions"),
      { params: Promise.resolve({ propertyId: "55555555-5555-4555-8555-555555555555" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "forbidden" });
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUserId.mockRejectedValue(new MockUnauthorizedError("unauthorized"));

    const response = await GET(
      new Request("http://localhost/api/properties/55555555-5555-4555-8555-555555555555/revisions"),
      { params: Promise.resolve({ propertyId: "55555555-5555-4555-8555-555555555555" }) }
    );

    expect(response.status).toBe(401);
    expect(mockFindFirst).not.toHaveBeenCalled();
  });
});
