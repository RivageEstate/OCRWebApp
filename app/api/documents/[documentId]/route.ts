import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/auth/session";
import { isValidUuid } from "@/lib/validation/uuid";

type Params = {
  params: {
    documentId: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  try {
    const userId = requireUserId(request);
    const { documentId } = params;

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
        filePath: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!document) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(document, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
