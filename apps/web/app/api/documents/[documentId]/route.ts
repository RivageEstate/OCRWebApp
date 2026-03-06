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
        filePath: true,
        createdAt: true,
        normalizedProperties: {
          select: {
            id: true,
            propertyName: true,
            address: true,
            price: true,
            rent: true,
            yield: true,
            structure: true,
            builtYear: true,
            stationInfo: true,
            editableFields: true,
            updatedAt: true
          },
          take: 1,
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const property = document.normalizedProperties[0] ?? null;

    return NextResponse.json(
      {
        document_id: document.id,
        user_id: document.userId,
        file_path: document.filePath,
        created_at: document.createdAt,
        normalized_property: property
          ? {
              id: property.id,
              property_name: property.propertyName,
              address: property.address,
              price: property.price,
              rent: property.rent,
              yield: property.yield,
              structure: property.structure,
              built_year: property.builtYear,
              station_info: property.stationInfo,
              editable_fields: property.editableFields,
              updated_at: property.updatedAt
            }
          : null
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
