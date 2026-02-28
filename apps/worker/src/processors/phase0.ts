import { prisma } from "@ocrwebapp/db";
import { isValidJobTransition } from "@ocrwebapp/domain";
import { getStorageAdapter, getOCRProvider, getExtractor } from "@ocrwebapp/providers";

type JobPayload = {
  job_id: string;
  attempt?: number;
  trace_id?: string;
};

export async function processPhase0Job(payload: JobPayload): Promise<void> {
  const { job_id } = payload;
  console.log("[worker] phase0 job started:", job_id);

  // 1. ジョブとドキュメントを取得
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

  // 2. queued → processing
  await prisma.job.update({
    where: { id: job_id },
    data: { status: "processing" }
  });

  try {
    // 3. ストレージから署名付きURLを取得
    const storage = getStorageAdapter();
    const imageUrl = await storage.getSignedUrl(job.document.filePath);

    // 4. OCRでテキスト抽出
    const ocrProvider = getOCRProvider();
    const ocrResult = await ocrProvider.extractText(imageUrl);

    // 5. extractions テーブルに保存
    const extraction = await prisma.extraction.create({
      data: {
        documentId: job.documentId,
        rawText: ocrResult.raw_text,
        ocrProvider: ocrProvider.constructor.name,
        confidence: ocrResult.confidence != null ? ocrResult.confidence : null,
        boundingBoxes: ocrResult.bounding_boxes ?? [],
        extractorVersion: "v1"
      }
    });
    console.log("[worker] extraction saved:", extraction.id);

    // 6. LLM抽出器で構造化データに変換
    const extractor = getExtractor();
    const normalized = await extractor.extract(ocrResult.raw_text);

    // 7. normalized_properties テーブルに保存
    const property = await prisma.normalizedProperty.create({
      data: {
        documentId: job.documentId,
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
    console.log("[worker] normalized property saved:", property.id);

    // 8. processing → succeeded
    await prisma.job.update({
      where: { id: job_id },
      data: { status: "succeeded" }
    });
    console.log("[worker] phase0 job succeeded:", job_id);
  } catch (error) {
    // 失敗時: processing → failed
    const message = error instanceof Error ? error.message : String(error);
    console.error("[worker] phase0 job failed:", job_id, error);
    await prisma.job.update({
      where: { id: job_id },
      data: {
        status: "failed",
        errorMessage: message
      }
    });
    throw error;
  }
}
