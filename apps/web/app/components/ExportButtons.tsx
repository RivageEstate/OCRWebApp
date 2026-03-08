'use client';

import { useState } from 'react';

type Props = {
  propertyId: string;
};

export function ExportButtons({ propertyId }: Props) {
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  async function handleDownload(format: 'csv' | 'pdf') {
    const setLoading = format === 'csv' ? setLoadingCsv : setLoadingPdf;
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/export?format=${format}`);
      if (!res.ok) throw new Error('download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `property.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 flex gap-3">
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
