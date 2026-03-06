import { NextResponse } from "next/server";
import { prisma } from "@ocrwebapp/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/session";
import { isValidUuid } from "@ocrwebapp/domain";

type Params = {
  params: Promise<{
    propertyId: string;
  }>;
};

type UpdateBody = {
  property_name?: string | null;
  address?: string | null;
  price?: number | null;
  rent?: number | null;
  yield?: number | null;
  structure?: string | null;
  built_year?: string | null;
  station_info?: string | null;
  editable_fields?: Record<string, unknown>;
};

export async function PUT(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId(request);
    const { propertyId } = await params;

    if (!isValidUuid(propertyId)) {
      return NextResponse.json({ error: "invalid_property_id" }, { status: 400 });
    }

    const body: UpdateBody = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    // 所有者検証: property → document → user
    const existing = await prisma.normalizedProperty.findFirst({
      where: {
        id: propertyId,
        document: { userId }
      },
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
        editableFields: true
      }
    });

    if (!existing) {
      // 所有者以外 or 存在しない → 403/404 を区別しない（情報漏洩防止）
      const exists = await prisma.normalizedProperty.findUnique({ where: { id: propertyId }, select: { id: true } });
      return NextResponse.json({ error: exists ? "forbidden" : "not_found" }, { status: exists ? 403 : 404 });
    }

    // before: 現在の値をスナップショット
    const before = {
      property_name: existing.propertyName,
      address: existing.address,
      price: existing.price,
      rent: existing.rent,
      yield: existing.yield,
      structure: existing.structure,
      built_year: existing.builtYear,
      station_info: existing.stationInfo,
      editable_fields: existing.editableFields
    };

    // 更新データを構築（undefinedのフィールドは更新しない）
    const updateData: Record<string, unknown> = {};
    if ("property_name" in body) updateData.propertyName = body.property_name;
    if ("address" in body) updateData.address = body.address;
    if ("price" in body) updateData.price = body.price;
    if ("rent" in body) updateData.rent = body.rent;
    if ("yield" in body) updateData.yield = body.yield;
    if ("structure" in body) updateData.structure = body.structure;
    if ("built_year" in body) updateData.builtYear = body.built_year;
    if ("station_info" in body) updateData.stationInfo = body.station_info;
    if ("editable_fields" in body) updateData.editableFields = body.editable_fields;

    // normalized_properties 更新 + revision 作成をトランザクションで実行
    const updated = await prisma.$transaction(async (tx) => {
      const prop = await tx.normalizedProperty.update({
        where: { id: propertyId },
        data: updateData
      });

      const after = {
        property_name: prop.propertyName,
        address: prop.address,
        price: prop.price,
        rent: prop.rent,
        yield: prop.yield,
        structure: prop.structure,
        built_year: prop.builtYear,
        station_info: prop.stationInfo,
        editable_fields: prop.editableFields
      };

      await tx.revision.create({
        data: {
          propertyId,
          changedBy: userId,
          before,
          after
        }
      });

      return prop;
    });

    return NextResponse.json(
      {
        id: updated.id,
        property_name: updated.propertyName,
        address: updated.address,
        price: updated.price,
        rent: updated.rent,
        yield: updated.yield,
        structure: updated.structure,
        built_year: updated.builtYear,
        station_info: updated.stationInfo,
        editable_fields: updated.editableFields,
        updated_at: updated.updatedAt
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("[PUT /api/properties/[propertyId]] Unexpected error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
