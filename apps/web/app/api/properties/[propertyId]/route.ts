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

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isValidDecimal(
  value: number,
  { precision, scale }: { precision: number; scale: number }
): boolean {
  if (!Number.isFinite(value) || value < 0) {
    return false;
  }

  const text = Math.abs(value).toString();
  if (text.includes("e") || text.includes("E")) {
    return false;
  }

  const [integerPart, fractionPart = ""] = text.split(".");
  const maxIntegerDigits = precision - scale;

  return integerPart.length <= maxIntegerDigits && fractionPart.length <= scale;
}

function isNullableDecimal(
  value: unknown,
  options: { precision: number; scale: number }
): value is number | null {
  return value === null || (typeof value === "number" && isValidDecimal(value, options));
}

function validateBody(body: UpdateBody): string | null {
  if ("property_name" in body && !isNullableString(body.property_name)) return "invalid_property_name";
  if ("address" in body && !isNullableString(body.address)) return "invalid_address";
  if ("price" in body && !isNullableDecimal(body.price, { precision: 14, scale: 2 })) return "invalid_price";
  if ("rent" in body && !isNullableDecimal(body.rent, { precision: 14, scale: 2 })) return "invalid_rent";
  if ("yield" in body && !isNullableDecimal(body.yield, { precision: 5, scale: 2 })) return "invalid_yield";
  if ("structure" in body && !isNullableString(body.structure)) return "invalid_structure";
  if ("built_year" in body && !isNullableString(body.built_year)) return "invalid_built_year";
  if ("station_info" in body && !isNullableString(body.station_info)) return "invalid_station_info";
  if (
    "editable_fields" in body &&
    (body.editable_fields == null ||
      typeof body.editable_fields !== "object" ||
      Array.isArray(body.editable_fields))
  ) {
    return "invalid_editable_fields";
  }

  return null;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toSnapshot(source: {
  propertyName: unknown;
  address: unknown;
  price: unknown;
  rent: unknown;
  yield: unknown;
  structure: unknown;
  builtYear: unknown;
  stationInfo: unknown;
  editableFields: unknown;
}) {
  return {
    property_name: source.propertyName,
    address: source.address,
    price: toNullableNumber(source.price),
    rent: toNullableNumber(source.rent),
    yield: toNullableNumber(source.yield),
    structure: source.structure,
    built_year: source.builtYear,
    station_info: source.stationInfo,
    editable_fields: source.editableFields
  };
}

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
    const validationError = validateBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
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
        editableFields: true,
        updatedAt: true
      }
    });

    if (!existing) {
      // 所有者以外 or 存在しない → 403/404 を区別しない（情報漏洩防止）
      const exists = await prisma.normalizedProperty.findUnique({ where: { id: propertyId }, select: { id: true } });
      return NextResponse.json({ error: exists ? "forbidden" : "not_found" }, { status: exists ? 403 : 404 });
    }

    // before: 現在の値をスナップショット
    const before = toSnapshot(existing);

    // 更新データを構築（undefinedのフィールドは更新しない）
    const updateData: Record<string, unknown> = {};
    if ("property_name" in body && body.property_name !== before.property_name) {
      updateData.propertyName = body.property_name;
    }
    if ("address" in body && body.address !== before.address) {
      updateData.address = body.address;
    }
    if ("price" in body && body.price !== before.price) {
      updateData.price = body.price;
    }
    if ("rent" in body && body.rent !== before.rent) {
      updateData.rent = body.rent;
    }
    if ("yield" in body && body.yield !== before.yield) {
      updateData.yield = body.yield;
    }
    if ("structure" in body && body.structure !== before.structure) {
      updateData.structure = body.structure;
    }
    if ("built_year" in body && body.built_year !== before.built_year) {
      updateData.builtYear = body.built_year;
    }
    if ("station_info" in body && body.station_info !== before.station_info) {
      updateData.stationInfo = body.station_info;
    }
    if (
      "editable_fields" in body &&
      JSON.stringify(body.editable_fields) !== JSON.stringify(before.editable_fields)
    ) {
      updateData.editableFields = body.editable_fields;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          id: existing.id,
          property_name: existing.propertyName,
          address: existing.address,
          price: before.price,
          rent: before.rent,
          yield: before.yield,
          structure: existing.structure,
          built_year: existing.builtYear,
          station_info: existing.stationInfo,
          editable_fields: existing.editableFields,
          updated_at: existing.updatedAt
        },
        { status: 200 }
      );
    }

    // normalized_properties 更新 + revision 作成をトランザクションで実行
    const updated = await prisma.$transaction(async (tx) => {
      const prop = await tx.normalizedProperty.update({
        where: { id: propertyId },
        data: updateData
      });

      const after = toSnapshot(prop);

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
        price: toNullableNumber(updated.price),
        rent: toNullableNumber(updated.rent),
        yield: toNullableNumber(updated.yield),
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
