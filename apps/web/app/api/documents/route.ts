import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@ocrwebapp/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/session";
import { getStorageAdapter } from "@ocrwebapp/providers";
import { dispatchWorkerJob } from "@/lib/dispatch/cloudtasks";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB (OpenAPI spec)

export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "unsupported_file_type" }, { status: 415 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 413 });
    }

    const storage = getStorageAdapter();
    const filePath = await storage.upload(file);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const document = await tx.document.create({
        data: {
          userId,
          filePath
        }
      });

      const job = await tx.job.create({
        data: {
          documentId: document.id,
          status: "queued"
        }
      });

      return { document, job };
    });

    // Cloud Tasks へ非同期でエンキュー（失敗してもジョブは DB に残る）
    dispatchWorkerJob(result.job.id).catch((err: unknown) => {
      console.error("[POST /api/documents] dispatch failed (job queued but not dispatched):", err);
    });

    return NextResponse.json(
      {
        document_id: result.document.id,
        job_id: result.job.id,
        status: result.job.status
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("[POST /api/documents] Unexpected error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
