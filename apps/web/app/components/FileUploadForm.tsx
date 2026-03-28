'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

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
        className={`min-h-64 rounded-lg border-2 border-dashed flex flex-col items-center justify-center px-4 py-10 text-center cursor-pointer transition-colors ${isUploading ? 'border-muted bg-muted/50' : 'border-border hover:border-primary/40 bg-card'}`}
      >
        <div className="text-muted-foreground mb-4">
          {isUploading ? (
            <svg className="mx-auto h-12 w-12 animate-spin text-muted-foreground/50" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity={0.2} />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground/60" />
              <span>クリックしてファイルを選択</span>
            </div>
          )}
        </div>

        {!isUploading && (
          <p className="text-sm text-muted-foreground mb-1">最大 20MB — JPG, PNG, WebP, PDF 対応</p>
        )}

        {selectedFile && !isUploading && (
          <p className="mt-2 text-sm font-medium text-foreground truncate max-w-xs">{selectedFile.name}</p>
        )}
      </label>

      {selectedFile && !isUploading && (
        <Button type="submit" className="mt-4 w-full">
          アップロード
        </Button>
      )}

      {uploadError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
