'use client';

import { useState } from 'react';

type Props = {
  propertyId: string;
};

export function ExportButtons({ propertyId }: Props) {
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(format: 'csv' | 'pdf') {
    const setLoading = format === 'csv' ? setLoadingCsv : setLoadingPdf;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}/export?format=${format}`);
      if (!res.ok) throw new Error(`エクスポートに失敗しました（HTTP ${res.status}）`);
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      const match = disposition?.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
      const filename = match
        ? decodeURIComponent(match[1].replace(/^"|"$/g, ''))
        : `property.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エクスポートに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleDownload('csv')}
          disabled={loadingCsv || loadingPdf}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {loadingCsv ? (
            <Spinner />
          ) : (
            <DownloadIcon />
          )}
          CSVをダウンロード
        </button>
        <button
          type="button"
          onClick={() => handleDownload('pdf')}
          disabled={loadingCsv || loadingPdf}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {loadingPdf ? (
            <Spinner />
          ) : (
            <DownloadIcon />
          )}
          PDFをダウンロード
        </button>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
