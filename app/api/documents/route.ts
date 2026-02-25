import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/auth/session";
import { getStorageAdapter } from "@/lib/storage/adapter";

export async function POST(request: Request) {
  try {
    const userId = requireUserId(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
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
        documentId: result.document.id,
        jobId: result.job.id,
        status: result.job.status
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
