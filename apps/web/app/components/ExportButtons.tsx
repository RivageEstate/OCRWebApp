'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

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
        <Button
          type="button"
          variant="outline"
          onClick={() => handleDownload('csv')}
          disabled={loadingCsv || loadingPdf}
        >
          {loadingCsv ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          CSVをダウンロード
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleDownload('pdf')}
          disabled={loadingCsv || loadingPdf}
        >
          {loadingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          PDFをダウンロード
        </Button>
      </div>
    </div>
  );
}
