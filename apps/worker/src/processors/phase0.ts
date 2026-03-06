import { prisma } from "@ocrwebapp/db";
import { isValidJobTransition } from "@ocrwebapp/domain";
import { getStorageAdapter, getOCRProvider, getExtractor } from "@ocrwebapp/providers";

const MAX_RETRIES = 3;
const TIMEOUT_MS = 300_000; // 300秒

type JobPayload = {
  job_id: string;
  attempt?: number;
  trace_id?: string;
};

export async function processPhase0Job(payload: JobPayload): Promise<void> {
  const { job_id } = payload;
  console.log("[worker] phase0 job started:", job_id);

  const job = await prisma.job.findUnique({
    where: { id: job_id },
    include: { document: true }
  });

  if (!job) {
    throw new Error(`Job not found: ${job_id}`);
  }

  if (!isValidJobTransition(job.status, "processing")) {
    console.log(`[worker] skipping job ${job_id}: status=${job.status} cannot transition to processing`);
    return;
  }

  await prisma.job.update({
    where: { id: job_id },
    data: { status: "processing" }
  });

  await runWithRetry(job_id, job.documentId, job.document.filePath);
}

async function runWithRetry(
  jobId: string,
  documentId: string,
  filePath: string
): Promise<void> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoffMs = 1000 * 2 ** (attempt - 1); // 1s, 2s
      console.log(`[worker] retry ${attempt}/${MAX_RETRIES - 1} for job ${jobId} after ${backoffMs}ms`);
      await sleep(backoffMs);
    }

    try {
      await runWithTimeout(
        (signal) => runJob(documentId, filePath, signal),
        TIMEOUT_MS
      );

      await prisma.job.update({
        where: { id: jobId },
        data: { status: "succeeded" }
      });
      console.log("[worker] phase0 job succeeded:", jobId);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[worker] attempt ${attempt + 1} failed for job ${jobId}:`, lastError.message);

      await prisma.job.update({
        where: { id: jobId },
        data: { retryCount: attempt + 1 }
      });
    }
  }

  // リトライ上限到達 → failed
  const message = lastError?.message ?? "unknown error";
  console.error(`[worker] job ${jobId} failed after ${MAX_RETRIES} attempts:`, message);
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

  console.log("[worker] normalized property saved:", property.id);
  console.log("[worker] extraction saved:", extraction.id);
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
