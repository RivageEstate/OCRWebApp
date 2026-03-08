import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeLog, logger } from "../../apps/worker/src/logger";

describe("writeLog", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes INFO to stdout as JSON", () => {
    writeLog("INFO", "job started", { job_id: "job-1", step: "start" });

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const written = String(stdoutSpy.mock.calls[0][0]);
    const parsed = JSON.parse(written.trim());
    expect(parsed).toMatchObject({
      severity: "INFO",
      message: "job started",
      job_id: "job-1",
      step: "start"
    });
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it("writes ERROR to stderr as JSON", () => {
    writeLog("ERROR", "job failed", { job_id: "job-1", step: "fail", error: "timeout" });

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const written = String(stderrSpy.mock.calls[0][0]);
    const parsed = JSON.parse(written.trim());
    expect(parsed).toMatchObject({
      severity: "ERROR",
      message: "job failed",
      job_id: "job-1",
      step: "fail",
      error: "timeout"
    });
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it("writes WARNING to stderr as JSON", () => {
    writeLog("WARNING", "retrying", { job_id: "job-1", attempt: 1 });

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const written = String(stderrSpy.mock.calls[0][0]);
    const parsed = JSON.parse(written.trim());
    expect(parsed.severity).toBe("WARNING");
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it("writes DEBUG to stdout as JSON", () => {
    writeLog("DEBUG", "debug message");

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const written = String(stdoutSpy.mock.calls[0][0]);
    const parsed = JSON.parse(written.trim());
    expect(parsed.severity).toBe("DEBUG");
  });

  it("includes only defined fields in JSON output", () => {
    writeLog("INFO", "success", { job_id: "job-1", duration_ms: 1234 });

    const written = String(stdoutSpy.mock.calls[0][0]);
    const parsed = JSON.parse(written.trim());
    expect(parsed.duration_ms).toBe(1234);
    expect("step" in parsed).toBe(false);
  });
});

describe("logger shortcuts", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logger.info writes INFO to stdout", () => {
    logger.info("test info");
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(String(stdoutSpy.mock.calls[0][0]).trim());
    expect(parsed.severity).toBe("INFO");
  });

  it("logger.warn writes WARNING to stderr", () => {
    logger.warn("test warn");
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(String(stderrSpy.mock.calls[0][0]).trim());
    expect(parsed.severity).toBe("WARNING");
  });

  it("logger.error writes ERROR to stderr", () => {
    logger.error("test error");
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(String(stderrSpy.mock.calls[0][0]).trim());
    expect(parsed.severity).toBe("ERROR");
  });

  it("logger.debug writes DEBUG to stdout", () => {
    logger.debug("test debug");
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(String(stdoutSpy.mock.calls[0][0]).trim());
    expect(parsed.severity).toBe("DEBUG");
  });
});
