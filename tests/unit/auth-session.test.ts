import { describe, expect, it, vi } from "vitest";

const VALID_UUID = "9f4e4a5f-7a4d-4a7f-b006-9225f39ae4d8";

const mockAuth = vi.fn();

// auth() をモック（ホイスティングが必要なので vi.mock は最上位で呼ぶ）
vi.mock("@/auth", () => ({
  auth: mockAuth
}));

// モック後にインポート
const { requireUserId, UnauthorizedError } = await import("@web/lib/auth/session");

function makeRequest(): Request {
  return new Request("http://localhost/test");
}

describe("requireUserId (NextAuth)", () => {
  it("returns userId when session has userId", async () => {
    mockAuth.mockResolvedValueOnce({ userId: VALID_UUID });
    const result = await requireUserId(makeRequest());
    expect(result).toBe(VALID_UUID);
  });

  it("throws UnauthorizedError when session is null", async () => {
    mockAuth.mockResolvedValueOnce(null);
    await expect(requireUserId(makeRequest())).rejects.toThrow(UnauthorizedError);
  });

  it("throws UnauthorizedError when userId is missing from session", async () => {
    mockAuth.mockResolvedValueOnce({ user: { email: "test@example.com" } });
    await expect(requireUserId(makeRequest())).rejects.toThrow(UnauthorizedError);
  });
});

describe("UnauthorizedError", () => {
  it("has the correct name property", () => {
    const error = new UnauthorizedError();
    expect(error.name).toBe("UnauthorizedError");
  });

  it("uses default message when none provided", () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe("Unauthorized");
  });

  it("uses custom message when provided", () => {
    const error = new UnauthorizedError("Custom message");
    expect(error.message).toBe("Custom message");
  });

  it("is an instance of Error", () => {
    expect(new UnauthorizedError()).toBeInstanceOf(Error);
  });
});
