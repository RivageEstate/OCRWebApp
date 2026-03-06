'use client';

import { useEffect, useState } from 'react';

export interface JobStatus {
  job_id: string;
  document_id: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  error_message?: string | null;
}

const TERMINAL_STATUSES = new Set<JobStatus['status']>(['succeeded', 'failed']);
const POLL_INTERVAL_MS = 2000;

export function PollingJobStatus({ jobId }: { jobId: string }) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function fetchJobStatus() {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? 'ジョブ情報の取得に失敗しました');
        }

        const data: JobStatus = await response.json();
        setJobStatus(data);

        if (TERMINAL_STATUSES.has(data.status) && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'ジョブ情報の取得に失敗しました');
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    }

    fetchJobStatus();
    intervalId = setInterval(fetchJobStatus, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId]);

  if (error) {
    return (
      <div className="rounded-md bg-destructive text-white p-6" role="alert">
        ⚠️ {error}
      </div>
    );
  }

  if (!jobStatus) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        ロード中...
      </div>
    );
  }

  const statusLabel: Record<JobStatus['status'], string> = {
    queued: '待機中',
    processing: '処理中',
    succeeded: '完了',
    failed: '失敗',
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">ジョブ情報</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>ID: {jobStatus.job_id}</p>
          <p>ステータス：{statusLabel[jobStatus.status]}</p>
          {jobStatus.status === 'failed' && jobStatus.error_message && (
            <p className="text-destructive" role="alert">
              エラー：{jobStatus.error_message}
            </p>
          )}
        </div>
      </div>

      {jobStatus.status === 'succeeded' && (
        <div className="rounded-lg border bg-card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            OCR処理が完了しました。
          </p>
          <a
            href={`/documents/${jobStatus.document_id}/edit`}
            className="inline-block rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
          >
            物件情報を確認・編集する
          </a>
        </div>
      )}

      {jobStatus.status === 'failed' && (
        <div className="text-center">
          <a href="/upload" className="text-sm text-primary underline">
            別のファイルをアップロードする
          </a>
        </div>
      )}
    </div>
  );
}
