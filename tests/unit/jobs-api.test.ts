import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireUserId = vi.fn();
const mockPrisma = {
  job: {
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

const { GET } = await import("@web/app/api/jobs/[jobId]/route");

describe("GET /api/jobs/[jobId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue("11111111-1111-1111-1111-111111111111");
  });

  it("returns the owned job status", async () => {
    mockPrisma.job.findFirst.mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      documentId: "33333333-3333-4333-8333-333333333333",
      status: "processing",
      errorMessage: null
    });

    const response = await GET(
      new Request("http://localhost/api/jobs/22222222-2222-4222-8222-222222222222"),
      { params: Promise.resolve({ jobId: "22222222-2222-4222-8222-222222222222" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      job_id: "22222222-2222-4222-8222-222222222222",
      document_id: "33333333-3333-4333-8333-333333333333",
      status: "processing",
      error_message: null
    });
  });

  it("returns 404 when the job is not found", async () => {
    mockPrisma.job.findFirst.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/jobs/22222222-2222-4222-8222-222222222222"),
      { params: Promise.resolve({ jobId: "22222222-2222-4222-8222-222222222222" }) }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "not_found" });
  });
});
