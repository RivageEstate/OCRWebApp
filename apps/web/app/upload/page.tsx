import { Suspense } from 'react';
import Loading from '../components/Loading';
import { FileUploadForm } from '../components/FileUploadForm';

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-semibold mb-8">物件画像をアップロード</h1>
        <Suspense fallback={<Loading />}>
          <FileUploadForm />
        </Suspense>
      </div>
    </main>
  );
}
