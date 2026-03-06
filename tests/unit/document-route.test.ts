import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireUserId = vi.fn();
const mockPrisma = {
  document: {
    findFirst: vi.fn()
  }
};

vi.mock("@/lib/auth/session", () => ({
  requireUserId: mockRequireUserId,
  UnauthorizedError: class UnauthorizedError extends Error {}
}));

vi.mock("@ocrwebapp/db", () => ({
  prisma: mockPrisma
}));

const { GET } = await import("@web/app/api/documents/[documentId]/route");

describe("GET /api/documents/[documentId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue("11111111-1111-1111-1111-111111111111");
  });

  it("returns the latest job, extraction, and normalized property", async () => {
    mockPrisma.document.findFirst.mockResolvedValue({
      id: "doc-1",
      userId: "11111111-1111-1111-1111-111111111111",
      filePath: "stub/sample.pdf",
      createdAt: new Date("2026-03-07T00:00:00Z"),
      jobs: [
        {
          id: "job-1",
          status: "succeeded",
          errorMessage: null,
          updatedAt: new Date("2026-03-07T00:01:00Z")
        }
      ],
      extractions: [
        {
          id: "ext-1",
          rawText: "OCR raw text",
          ocrProvider: "StubOCRProvider",
          extractorVersion: "v1",
          createdAt: new Date("2026-03-07T00:01:30Z")
        }
      ],
      normalizedProperties: [
        {
          id: "prop-1",
          propertyName: "テスト物件",
          address: "東京都渋谷区",
          price: 12000,
          rent: 45,
          yield: 4.5,
          structure: "RC",
          builtYear: "2001年",
          stationInfo: "渋谷駅 徒歩5分",
          editableFields: { propertyName: "テスト物件" },
          updatedAt: new Date("2026-03-07T00:02:00Z")
        }
      ]
    });

    const response = await GET(
      new Request("http://localhost/api/documents/doc-1"),
      { params: Promise.resolve({ documentId: "44444444-4444-4444-8444-444444444444" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      document_id: "doc-1",
      user_id: "11111111-1111-1111-1111-111111111111",
      file_path: "stub/sample.pdf",
      created_at: "2026-03-07T00:00:00.000Z",
      latest_job: {
        job_id: "job-1",
        status: "succeeded",
        error_message: null,
        updated_at: "2026-03-07T00:01:00.000Z"
      },
      latest_extraction: {
        extraction_id: "ext-1",
        raw_text: "OCR raw text",
        ocr_provider: "StubOCRProvider",
        extractor_version: "v1",
        created_at: "2026-03-07T00:01:30.000Z"
      },
      normalized_property: {
        id: "prop-1",
        property_name: "テスト物件",
        address: "東京都渋谷区",
        price: 12000,
        rent: 45,
        yield: 4.5,
        structure: "RC",
        built_year: "2001年",
        station_info: "渋谷駅 徒歩5分",
        editable_fields: { propertyName: "テスト物件" },
        updated_at: "2026-03-07T00:02:00.000Z"
      }
    });
  });
});
