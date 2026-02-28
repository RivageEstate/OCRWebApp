import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/auth/session";
import { getStorageAdapter } from "@/lib/storage/adapter";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB (OpenAPI spec)

export async function POST(request: Request) {
  try {
    const userId = requireUserId(request);
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

    const result = await prisma.$transaction(async (tx) => {
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
