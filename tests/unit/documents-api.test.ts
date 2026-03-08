import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireUserId = vi.fn();
const mockStorageUpload = vi.fn();
const mockPrisma = {
  $transaction: vi.fn()
};

vi.mock("@/lib/auth/session", () => ({
  requireUserId: mockRequireUserId,
  UnauthorizedError: class UnauthorizedError extends Error {}
}));

vi.mock("@ocrwebapp/providers", () => ({
  getStorageAdapter: () => ({
    upload: mockStorageUpload
  })
}));

vi.mock("@ocrwebapp/db", () => ({
  prisma: mockPrisma
}));

const { POST } = await import("@web/app/api/documents/route");

describe("POST /api/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue("11111111-1111-1111-1111-111111111111");
    mockStorageUpload.mockResolvedValue("stub/sample.pdf");
    mockPrisma.$transaction.mockResolvedValue({
      document: { id: "doc-1" },
      job: { id: "job-1", status: "queued" }
    });
  });

  it("creates a document and queued job for a valid file", async () => {
    const formData = new FormData();
    formData.append("file", new File(["dummy"], "sample.pdf", { type: "application/pdf" }));
    const request = new Request("http://localhost/api/documents", {
      method: "POST",
      body: formData
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      document_id: "doc-1",
      job_id: "job-1",
      status: "queued"
    });
    expect(mockStorageUpload).toHaveBeenCalledTimes(1);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("rejects unsupported file types", async () => {
    const formData = new FormData();
    formData.append("file", new File(["dummy"], "sample.txt", { type: "text/plain" }));
    const request = new Request("http://localhost/api/documents", {
      method: "POST",
      body: formData
    });

    const response = await POST(request);

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({ error: "unsupported_file_type" });
  });

  it("rejects files larger than 20MB", async () => {
    const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], "large.pdf", {
      type: "application/pdf"
    });

    const formData = new FormData();
    formData.append("file", file);
    const request = new Request("http://localhost/api/documents", {
      method: "POST",
      body: formData
    });

    const response = await POST(request);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({ error: "file_too_large" });
  });

  it("returns 401 when the request is not authenticated", async () => {
    const { UnauthorizedError } = await import("@/lib/auth/session");
    mockRequireUserId.mockRejectedValue(new UnauthorizedError("unauthorized"));

    const formData = new FormData();
    formData.append("file", new File(["dummy"], "sample.pdf", { type: "application/pdf" }));
    const request = new Request("http://localhost/api/documents", {
      method: "POST",
      body: formData
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(mockStorageUpload).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});
