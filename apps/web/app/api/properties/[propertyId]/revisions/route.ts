import { NextResponse } from "next/server";
import { prisma } from "@ocrwebapp/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/session";
import { isValidUuid } from "@ocrwebapp/domain";

type Params = {
  params: Promise<{ propertyId: string }>;
};

type RevisionListItem = {
  id: string;
  createdAt: Date;
  before: unknown;
  after: unknown;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId(request);
    const { propertyId } = await params;

    if (!isValidUuid(propertyId)) {
      return NextResponse.json({ error: "invalid_property_id" }, { status: 400 });
    }

    // 所有者検証
    const property = await prisma.normalizedProperty.findFirst({
      where: { id: propertyId, document: { userId } },
      select: { id: true }
    });

    if (!property) {
      const exists = await prisma.normalizedProperty.findUnique({
        where: { id: propertyId },
        select: { id: true }
      });
      return NextResponse.json({ error: exists ? "forbidden" : "not_found" }, { status: exists ? 403 : 404 });
    }

    const revisions = await prisma.revision.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        before: true,
        after: true
      }
    });

    return NextResponse.json(
      revisions.map((r: RevisionListItem) => ({
        revision_id: r.id,
        changed_at: r.createdAt.toISOString(),
        before: r.before,
        after: r.after
      }))
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[GET /api/properties/[propertyId]/revisions] Unexpected error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
