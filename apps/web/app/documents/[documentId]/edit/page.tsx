import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@ocrwebapp/db";
import { isValidUuid } from "@ocrwebapp/domain";
import { PropertyEditForm, NormalizedProperty } from "../../../components/PropertyEditForm";
import { ExportButtons } from "../../../components/ExportButtons";

type Props = {
  params: Promise<{ documentId: string }>;
};

type DocumentWithProperty = {
  document_id: string;
  latest_job: {
    job_id: string;
    status: "queued" | "processing" | "succeeded" | "failed";
    error_message: string | null;
  } | null;
  latest_extraction: {
    extraction_id: string;
    raw_text: string;
    ocr_provider: string;
    extractor_version: string;
    created_at: string;
  } | null;
  normalized_property: NormalizedProperty | null;
};

async function getDocument(documentId: string): Promise<DocumentWithProperty | null> {
  const session = await auth();
  if (!session?.userId || !isValidUuid(documentId)) {
    return null;
  }

  const document = await prisma.document.findFirst({
    where: { id: documentId, userId: session.userId },
    select: {
      id: true,
      jobs: {
        select: {
          id: true,
          status: true,
          errorMessage: true
        },
        take: 1,
        orderBy: { createdAt: "desc" }
      },
      extractions: {
        select: {
          id: true,
          rawText: true,
          ocrProvider: true,
          extractorVersion: true,
          createdAt: true
        },
        take: 1,
        orderBy: { createdAt: "desc" }
      },
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
    return null;
  }

  const latestJob = document.jobs[0] ?? null;
  const latestExtraction = document.extractions[0] ?? null;
  const property = document.normalizedProperties[0] ?? null;

  return {
    document_id: document.id,
    latest_job: latestJob
      ? {
          job_id: latestJob.id,
          status: latestJob.status,
          error_message: latestJob.errorMessage
        }
      : null,
    latest_extraction: latestExtraction
      ? {
          extraction_id: latestExtraction.id,
          raw_text: latestExtraction.rawText,
          ocr_provider: latestExtraction.ocrProvider,
          extractor_version: latestExtraction.extractorVersion,
          created_at: latestExtraction.createdAt.toISOString()
        }
      : null,
    normalized_property: property
      ? {
          id: property.id,
          property_name: property.propertyName,
          address: property.address,
          price: property.price != null ? Number(property.price) : null,
          rent: property.rent != null ? Number(property.rent) : null,
          yield: property.yield != null ? Number(property.yield) : null,
          structure: property.structure,
          built_year: property.builtYear,
          station_info: property.stationInfo,
          editable_fields: property.editableFields as Record<string, unknown> | null,
          updated_at: property.updatedAt.toISOString()
        }
      : null
  };
}

export default async function DocumentEditPage({ params }: Props) {
  const { documentId } = await params;
  const doc = await getDocument(documentId);

  if (!doc) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto py-10 px-4">
          <p className="text-muted-foreground">ドキュメントが見つかりません</p>
        </div>
      </main>
    );
  }

  if (!doc.normalized_property) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto py-10 px-4">
          <h1 className="text-3xl font-semibold mb-4">物件情報の編集</h1>
          <p className="text-muted-foreground">
            OCR解析がまだ完了していません。処理完了後にご利用ください。
          </p>
          {doc.latest_job && (
            <Link href={`/jobs/${doc.latest_job.job_id}`} className="mt-4 inline-block text-sm text-primary underline">
              処理状況を確認する
            </Link>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-semibold mb-8">物件情報の編集</h1>
        {doc.latest_extraction && (
          <div className="rounded-lg border bg-card p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2">OCR抽出結果</h2>
            <p className="text-xs text-muted-foreground mb-3">
              OCR生データは参照専用です。確定データは下のフォームで編集してください。
            </p>
            <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-4 text-xs overflow-auto">
              {doc.latest_extraction.raw_text}
            </pre>
          </div>
        )}
        <div className="rounded-lg border bg-card p-6">
          <PropertyEditForm property={doc.normalized_property} />
          <ExportButtons propertyId={doc.normalized_property.id} />
        </div>
      </div>
    </main>
  );
}
