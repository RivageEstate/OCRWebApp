import { PropertyEditForm, NormalizedProperty } from '../../../components/PropertyEditForm';

type Props = {
  params: Promise<{ documentId: string }>;
};

type DocumentWithProperty = {
  document_id: string;
  latest_job: {
    job_id: string;
    status: "queued" | "processing" | "succeeded" | "failed";
    error_message: string | null;
    updated_at: string;
  } | null;
  normalized_property: NormalizedProperty | null;
};

async function getDocument(documentId: string, baseUrl: string): Promise<DocumentWithProperty | null> {
  const res = await fetch(`${baseUrl}/api/documents/${documentId}`, {
    headers: { 'x-user-id': process.env.SYSTEM_USER_ID ?? '' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function DocumentEditPage({ params }: Props) {
  const { documentId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const doc = await getDocument(documentId, baseUrl);

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
            <a href={`/jobs/${doc.latest_job.job_id}`} className="mt-4 inline-block text-sm text-primary underline">
              処理状況を確認する
            </a>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-semibold mb-8">物件情報の編集</h1>
        <div className="rounded-lg border bg-card p-6">
          <PropertyEditForm property={doc.normalized_property} />
        </div>
      </div>
    </main>
  );
}
