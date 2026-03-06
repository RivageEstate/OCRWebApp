import { NextResponse } from "next/server";
import { prisma } from "@ocrwebapp/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/session";
import { isValidUuid } from "@ocrwebapp/domain";
import PDFDocument from "pdfkit";

type Params = {
  params: Promise<{ propertyId: string }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId(request);
    const { propertyId } = await params;

    if (!isValidUuid(propertyId)) {
      return NextResponse.json({ error: "invalid_property_id" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    if (format !== "csv" && format !== "pdf") {
      return NextResponse.json({ error: "format must be csv or pdf" }, { status: 400 });
    }

    // 所有者検証
    const property = await prisma.normalizedProperty.findFirst({
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
        updatedAt: true
      }
    });

    if (!property) {
      const exists = await prisma.normalizedProperty.findUnique({ where: { id: propertyId }, select: { id: true } });
      return NextResponse.json({ error: exists ? "forbidden" : "not_found" }, { status: exists ? 403 : 404 });
    }

    if (format === "csv") {
      return exportCsv(property);
    } else {
      return exportPdf(property);
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[GET /api/properties/[propertyId]/export] Unexpected error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

type PropertyData = {
  id: string;
  propertyName: string | null;
  address: string | null;
  price: unknown;
  rent: unknown;
  yield: unknown;
  structure: string | null;
  builtYear: string | null;
  stationInfo: string | null;
  updatedAt: Date;
};

const EXPORT_FIELDS: Array<{ label: string; value: (property: PropertyData) => string }> = [
  { label: "物件名", value: (property) => property.propertyName ?? "" },
  { label: "住所", value: (property) => property.address ?? "" },
  { label: "価格（万円）", value: (property) => property.price != null ? String(property.price) : "" },
  { label: "賃料（万円）", value: (property) => property.rent != null ? String(property.rent) : "" },
  { label: "利回り（%）", value: (property) => property.yield != null ? String(property.yield) : "" },
  { label: "構造", value: (property) => property.structure ?? "" },
  { label: "築年", value: (property) => property.builtYear ?? "" },
  { label: "最寄り駅", value: (property) => property.stationInfo ?? "" },
  { label: "更新日時", value: (property) => property.updatedAt.toISOString() }
];

function buildExportFilename(property: PropertyData, extension: "csv" | "pdf"): string {
  const datePart = property.updatedAt.toISOString().slice(0, 10).replace(/-/g, "");
  return `property_${property.id}_${datePart}.${extension}`;
}

function exportCsv(property: PropertyData): Response {
  const headers = ["項目", "値"];
  const rows: [string, string][] = EXPORT_FIELDS.map(({ label, value }) => [label, value(property)]);

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csvLines = [
    headers.map(escape).join(","),
    ...rows.map(([k, v]) => [escape(k), escape(v)].join(","))
  ].join("\r\n");

  // UTF-8 BOM付き（Excel対応）
  const bom = "\uFEFF";
  const body = bom + csvLines;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildExportFilename(property, "csv")}"`,
    }
  });
}

function exportPdf(property: PropertyData): Promise<Response> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve(
        new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${buildExportFilename(property, "pdf")}"`,
          }
        })
      );
    });
    doc.on("error", reject);

    // タイトル
    doc.fontSize(18).text("物件概要", { align: "center" });
    doc.moveDown();

    const fields: [string, string][] = EXPORT_FIELDS.map(({ label, value }) => [label, value(property) || "-"]);

    for (const [label, value] of fields) {
      doc.fontSize(10).text(`${label}: ${value}`, { continued: false });
      doc.moveDown(0.3);
    }

    doc.moveDown();
    doc.fontSize(8)
      .fillColor("gray")
      .text(`出力日時: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`, { align: "right" });

    doc.end();
  });
}
