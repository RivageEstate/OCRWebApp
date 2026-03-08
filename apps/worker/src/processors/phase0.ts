import { prisma } from "@ocrwebapp/db";
import { isValidJobTransition } from "@ocrwebapp/domain";
import { getStorageAdapter, getOCRProvider, getExtractor } from "@ocrwebapp/providers";
import { logger } from "../logger";

const MAX_RETRIES = 3;
const TIMEOUT_MS = 300_000; // 300秒

type JobPayload = {
  job_id: string;
  attempt?: number;
  trace_id?: string;
};

export async function processPhase0Job(payload: JobPayload): Promise<void> {
  const { job_id, trace_id } = payload;
  logger.info("phase0 job started", { job_id, step: "start", trace_id });

  const job = await prisma.job.findUnique({
    where: { id: job_id },
    include: { document: true }
  });

  if (!job) {
    throw new Error(`Job not found: ${job_id}`);
  }

  if (!isValidJobTransition(job.status, "processing")) {
    logger.warn("phase0 job skipped: invalid transition", {
      job_id,
      step: "skip",
      error: `status=${job.status} cannot transition to processing`
    });
    return;
  }

  await prisma.job.update({
    where: { id: job_id },
    data: { status: "processing" }
  });

  await runWithRetry(job_id, job.documentId, job.document.filePath, trace_id);
}

async function runWithRetry(
  jobId: string,
  documentId: string,
  filePath: string,
  traceId?: string
): Promise<void> {
  let lastError: Error | undefined;
  const startedAt = Date.now();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoffMs = 1000 * 2 ** (attempt - 1); // 1s, 2s
      logger.warn("phase0 job retrying", {
        job_id: jobId,
        step: "retry",
        attempt,
        trace_id: traceId
      });
      await sleep(backoffMs);
    }

    try {
      await runWithTimeout(
        (signal) => runJob(documentId, filePath, signal),
        TIMEOUT_MS
      );

      const duration_ms = Date.now() - startedAt;
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "succeeded" }
      });
      logger.info("phase0 job succeeded", {
        job_id: jobId,
        step: "success",
        duration_ms,
        attempt,
        trace_id: traceId
      });
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error(`phase0 job attempt failed`, {
        job_id: jobId,
        step: "attempt_failed",
        attempt: attempt + 1,
        error: lastError.message,
        trace_id: traceId
      });

      await prisma.job.update({
        where: { id: jobId },
        data: { retryCount: attempt + 1 }
      });
    }
  }

  // リトライ上限到達 → failed
  const message = lastError?.message ?? "unknown error";
  const duration_ms = Date.now() - startedAt;
  logger.error("phase0 job failed", {
    job_id: jobId,
    step: "fail",
    duration_ms,
    error: message,
    trace_id: traceId
  });
  await prisma.job.update({
    where: { id: jobId },
    data: { status: "failed", errorMessage: message }
  });
  throw lastError;
}

async function runJob(
  documentId: string,
  filePath: string,
  signal: AbortSignal
): Promise<void> {
  throwIfAborted(signal);

  const storage = getStorageAdapter();
  const imageUrl = await storage.getSignedUrl(filePath);
  throwIfAborted(signal);

  const ocrProvider = getOCRProvider();
  const ocrResult = await ocrProvider.extractText(imageUrl, { signal });
  throwIfAborted(signal);

  const extractor = getExtractor();
  const normalized = await extractor.extract(ocrResult.raw_text, { signal });
  throwIfAborted(signal);

  const { extraction, property } = await prisma.$transaction(async (tx) => {
    throwIfAborted(signal);

    const extraction = await tx.extraction.create({
      data: {
        documentId,
        rawText: ocrResult.raw_text,
        ocrProvider: ocrProvider.constructor.name,
        confidence: ocrResult.confidence != null ? ocrResult.confidence : null,
        boundingBoxes: ocrResult.bounding_boxes ?? [],
        extractorVersion: "v1"
      }
    });

    throwIfAborted(signal);

    const property = await tx.normalizedProperty.create({
      data: {
        documentId,
        propertyName: normalized.propertyName as string | null ?? null,
        address: normalized.address as string | null ?? null,
        price: normalized.price as number | null ?? null,
        rent: normalized.rent as number | null ?? null,
        yield: normalized.yield as number | null ?? null,
        structure: normalized.structure as string | null ?? null,
        builtYear: normalized.builtYear as string | null ?? null,
        stationInfo: normalized.stationInfo as string | null ?? null,
        editableFields: normalized
      }
    });

    return { extraction, property };
  });

  logger.info("extraction saved", { step: "ocr_saved", extraction_id: extraction.id });
  logger.info("normalized property saved", { step: "property_saved", property_id: property.id });
}

export async function runWithTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const controller = new AbortController();
    const timeoutError = createTimeoutError(timeoutMs);
    const timeoutId = setTimeout(() => {
      controller.abort(timeoutError);
      reject(timeoutError);
    }, timeoutMs);

    operation(controller.signal).then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

function throwIfAborted(signal: AbortSignal): void {
  if (!signal.aborted) {
    return;
  }

  const reason = signal.reason;
  throw reason instanceof Error ? reason : new Error("operation aborted");
}

function createTimeoutError(ms: number): Error {
  return new Error(`timeout after ${ms}ms`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
