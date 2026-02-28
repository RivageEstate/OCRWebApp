import { describe, expect, it } from "vitest";
import { requireUserId, UnauthorizedError } from "@/lib/auth/session";

const VALID_UUID = "9f4e4a5f-7a4d-4a7f-b006-9225f39ae4d8";

function makeRequest(headers: Record<string, string>): Request {
  return new Request("http://localhost/test", { headers });
}

describe("requireUserId", () => {
  it("returns userId for valid UUID in x-user-id header", () => {
    const request = makeRequest({ "x-user-id": VALID_UUID });
    expect(requireUserId(request)).toBe(VALID_UUID);
  });

  it("strips surrounding whitespace before validating", () => {
    const request = makeRequest({ "x-user-id": `  ${VALID_UUID}  ` });
    expect(requireUserId(request)).toBe(VALID_UUID);
  });

  it("throws UnauthorizedError when x-user-id header is missing", () => {
    const request = makeRequest({});
    expect(() => requireUserId(request)).toThrow(UnauthorizedError);
  });

  it("throws UnauthorizedError when x-user-id is not a valid UUID", () => {
    const request = makeRequest({ "x-user-id": "not-a-uuid" });
    expect(() => requireUserId(request)).toThrow(UnauthorizedError);
  });

  it("throws UnauthorizedError when x-user-id is empty string", () => {
    const request = makeRequest({ "x-user-id": "" });
    expect(() => requireUserId(request)).toThrow(UnauthorizedError);
  });

  it("throws UnauthorizedError when x-user-id is whitespace only", () => {
    const request = makeRequest({ "x-user-id": "   " });
    expect(() => requireUserId(request)).toThrow(UnauthorizedError);
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
