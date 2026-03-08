/**
 * Cloud Logging 互換の構造化 JSON ロガー
 *
 * Cloud Run 上では stdout/stderr に出力した JSON が自動的に
 * Cloud Logging に取り込まれる。severity フィールドはそのまま
 * Cloud Logging の重大度にマッピングされる。
 *
 * @see https://cloud.google.com/logging/docs/structured-logging
 */

export type Severity = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type LogFields = {
  job_id?: string;
  step?: string;
  duration_ms?: number;
  attempt?: number;
  error?: string;
  [key: string]: unknown;
};

type LogEntry = LogFields & {
  severity: Severity;
  message: string;
};

export function writeLog(
  severity: Severity,
  message: string,
  fields: LogFields = {}
): void {
  const entry: LogEntry = { severity, message, ...fields };
  const line = JSON.stringify(entry);
  if (severity === "ERROR" || severity === "CRITICAL" || severity === "WARNING") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) =>
    writeLog("DEBUG", message, fields),
  info: (message: string, fields?: LogFields) =>
    writeLog("INFO", message, fields),
  warn: (message: string, fields?: LogFields) =>
    writeLog("WARNING", message, fields),
  error: (message: string, fields?: LogFields) =>
    writeLog("ERROR", message, fields),
};
