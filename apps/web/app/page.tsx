import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-semibold mb-4">物件概要書 OCR 解析ツール</h1>
        <p className="text-muted-foreground mb-8">
          物件概要書の画像をアップロードすると、OCR で自動解析し、編集可能なデータに変換します。
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          アップロードを開始する
        </Link>
      </div>
    </main>
  );
}
