import { NextResponse } from "next/server";
import { prisma } from "@ocrwebapp/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/session";
import { isValidUuid } from "@ocrwebapp/domain";

type Params = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId(request);
    const { documentId } = await params;

    if (!isValidUuid(documentId)) {
      return NextResponse.json({ error: "invalid_document_id" }, { status: 400 });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId
      },
      select: {
        id: true,
        userId: true,
        createdAt: true
      }
    });

    if (!document) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        document_id: document.id,
        user_id: document.userId,
        created_at: document.createdAt
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("[GET /api/documents/[documentId]] Unexpected error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
