import { beforeEach, describe, expect, it, vi } from "vitest";

const mockJobFindUnique = vi.fn();
const mockJobUpdate = vi.fn();
const mockTransaction = vi.fn();
const mockGetSignedUrl = vi.fn();
const mockExtractText = vi.fn();
const mockExtract = vi.fn();
const mockIsValidJobTransition = vi.fn();

const mockPrisma = {
  job: {
    findUnique: mockJobFindUnique,
    update: mockJobUpdate
  },
  $transaction: mockTransaction
};

vi.mock("@ocrwebapp/db", () => ({
  prisma: mockPrisma
}));

vi.mock("@ocrwebapp/domain", () => ({
  isValidJobTransition: mockIsValidJobTransition
}));

vi.mock("@ocrwebapp/providers", () => ({
  getStorageAdapter: () => ({
    getSignedUrl: mockGetSignedUrl
  }),
  getOCRProvider: () => ({
    extractText: mockExtractText,
    constructor: { name: "StubOCRProvider" }
  }),
  getExtractor: () => ({
    extract: mockExtract
  })
}));

const { processPhase0Job } = await import("../../apps/worker/src/processors/phase0");

describe("processPhase0Job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJobFindUnique.mockResolvedValue({
      id: "job-1",
      status: "queued",
      documentId: "doc-1",
      document: {
        filePath: "stub/sample.pdf"
      }
    });
    mockIsValidJobTransition.mockReturnValue(true);
    mockGetSignedUrl.mockResolvedValue("https://example.com/signed");
    mockExtractText.mockResolvedValue({
      raw_text: "OCR raw text",
      confidence: 0.9,
      bounding_boxes: []
    });
    mockExtract.mockResolvedValue({
      propertyName: "テスト物件",
      address: "東京都渋谷区"
    });
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      extraction: {
        create: vi.fn().mockResolvedValue({ id: "ext-1" })
      },
      normalizedProperty: {
        create: vi.fn().mockResolvedValue({ id: "prop-1" })
      }
    }));
  });

  it("runs the full OCR to normalized-property flow and marks the job succeeded", async () => {
    await processPhase0Job({ job_id: "job-1" });

    expect(mockGetSignedUrl).toHaveBeenCalledWith("stub/sample.pdf");
    expect(mockExtractText).toHaveBeenCalledTimes(1);
    expect(mockExtract).toHaveBeenCalledWith("OCR raw text", { signal: expect.any(AbortSignal) });
    expect(mockJobUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: "job-1" },
      data: { status: "processing" }
    });
    expect(mockJobUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: "job-1" },
      data: { status: "succeeded" }
    });
  });

  it("skips processing when the status transition is invalid", async () => {
    mockIsValidJobTransition.mockReturnValue(false);

    await processPhase0Job({ job_id: "job-1" });

    expect(mockJobUpdate).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
