import { describe, it, expect, vi, beforeEach } from "vitest";

// リトライ・タイムアウトのロジックをテストするためのヘルパー関数
// (processPhase0Job はDB依存のため、内部ロジックを単体でテスト)

const MAX_RETRIES = 3;
const TIMEOUT_MS = 300_000;

function timeoutReject(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runWithRetry(
  fn: () => Promise<void>,
  onRetry: (attempt: number) => void,
  onFailed: (message: string) => void
): Promise<void> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(0); // テスト用に0ms
    }

    try {
      await fn();
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      onRetry(attempt + 1);
    }
  }

  const message = lastError?.message ?? "unknown error";
  onFailed(message);
  throw lastError;
}

describe("Worker リトライロジック", () => {
  it("初回成功時はリトライなし", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const onRetry = vi.fn();
    const onFailed = vi.fn();

    await runWithRetry(fn, onRetry, onFailed);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
    expect(onFailed).not.toHaveBeenCalled();
  });

  it("2回目で成功した場合は1回リトライ", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("一時エラー"))
      .mockResolvedValue(undefined);
    const onRetry = vi.fn();
    const onFailed = vi.fn();

    await runWithRetry(fn, onRetry, onFailed);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1);
    expect(onFailed).not.toHaveBeenCalled();
  });

  it("3回目で成功した場合は2回リトライ", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("エラー1"))
      .mockRejectedValueOnce(new Error("エラー2"))
      .mockResolvedValue(undefined);
    const onRetry = vi.fn();
    const onFailed = vi.fn();

    await runWithRetry(fn, onRetry, onFailed);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onFailed).not.toHaveBeenCalled();
  });

  it("3回全て失敗した場合はfailedに遷移しエラーをthrow", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("永続エラー"));
    const onRetry = vi.fn();
    const onFailed = vi.fn();

    await expect(runWithRetry(fn, onRetry, onFailed)).rejects.toThrow("永続エラー");

    expect(fn).toHaveBeenCalledTimes(MAX_RETRIES);
    expect(onRetry).toHaveBeenCalledTimes(MAX_RETRIES);
    expect(onFailed).toHaveBeenCalledWith("永続エラー");
  });

  it("MAX_RETRIES回を超えて実行されない", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("エラー"));
    const onRetry = vi.fn();
    const onFailed = vi.fn();

    await expect(runWithRetry(fn, onRetry, onFailed)).rejects.toThrow();

    expect(fn).toHaveBeenCalledTimes(MAX_RETRIES);
  });
});

describe("タイムアウトロジック", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("タイムアウト前に完了した場合は正常終了", async () => {
    const fastJob = Promise.resolve();
    const result = Promise.race([fastJob, timeoutReject(TIMEOUT_MS)]);
    vi.runAllTimers();
    await expect(result).resolves.toBeUndefined();
  });

  it("タイムアウト後にrejectされる", async () => {
    const neverResolves = new Promise<void>(() => {});
    const result = Promise.race([neverResolves, timeoutReject(TIMEOUT_MS)]);
    vi.advanceTimersByTime(TIMEOUT_MS + 1);
    await expect(result).rejects.toThrow(`timeout after ${TIMEOUT_MS}ms`);
  });
});
