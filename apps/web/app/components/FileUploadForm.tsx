'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function FileUploadForm() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function handleFileUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'ファイルアップロードに失敗しました');
      }

      const data = await response.json();
      router.push(`/jobs/${data.job_id}`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'ファイルアップロードに失敗しました');
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleFileUpload}>
      <input
        type="file"
        name="file"
        id="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        hidden
        disabled={isUploading}
        onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
      />

      <label
        htmlFor="file"
        className={`min-h-64 rounded-lg border-2 border-dashed flex flex-col items-center justify-center px-4 py-10 text-center cursor-pointer transition-colors ${isUploading ? 'border-gray-300 bg-gray-50' : 'hover:border-primary/20 bg-secondary/50 dark:hover:border-primary/20 dark:bg-secondary/10'}`}
      >
        <div className="text-muted-foreground mb-4">
          {isUploading ? (
            <svg className="mx-auto h-12 w-12 animate-spin text-gray-400" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="20" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>
          ) : (
            <span aria-hidden="true">📤 クリックしてファイルを選択</span>
          )}
        </div>

        {!isUploading && (
          <p className="mb-1">最大 20MB<br />JPG, PNG, WebP, PDF 対応</p>
        )}

        {selectedFile && !isUploading && (
          <p className="mt-2 text-sm font-medium text-foreground truncate max-w-xs">{selectedFile.name}</p>
        )}
      </label>

      {selectedFile && !isUploading && (
        <button
          type="submit"
          className="mt-4 w-full bg-primary text-white py-2 px-3 rounded-md text-sm font-medium transition-colors hover:bg-primary/90"
        >
          アップロード
        </button>
      )}

      {uploadError && (
        <div className="mt-4 rounded-md bg-destructive text-white p-3 flex gap-2 items-start font-mono text-sm" role="alert">
          <span aria-hidden="true">⚠️</span>{uploadError}
        </div>
      )}
    </form>
  );
}
