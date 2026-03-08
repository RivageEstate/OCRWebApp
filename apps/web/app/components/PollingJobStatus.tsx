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

export const STEP_LABELS = ['アップロード完了', 'OCR処理中', '編集へ進む'] as const;

/**
 * ジョブステータスから現在アクティブなステップインデックスを返す。
 * 0: アップロード完了, 1: OCR処理中, 2: 編集へ進む
 * failed の場合は -1 を返す。
 */
export function getActiveStep(status: JobStatus['status']): number {
  if (status === 'succeeded') return 2;
  if (status === 'failed') return -1;
  return 1; // queued | processing
}

function StepIndicator({ status }: { status: JobStatus['status'] }) {
  const activeStep = getActiveStep(status);
  const isProcessing = status === 'queued' || status === 'processing';

  return (
    <ol className="flex items-center w-full mb-6" aria-label="処理ステップ">
      {STEP_LABELS.map((label, index) => {
        const isActive = activeStep === index;
        const isPast = activeStep > index;

        return (
          <li
            key={label}
            className={`flex items-center ${index < STEP_LABELS.length - 1 ? 'flex-1' : ''}`}
          >
            <div className="flex flex-col items-center">
              <div
                className={[
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border-2 transition-colors',
                  isPast
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isActive && status !== 'failed'
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-background border-muted-foreground/30 text-muted-foreground',
                ].join(' ')}
                aria-current={isActive ? 'step' : undefined}
              >
                {isPast || (isActive && status === 'succeeded') ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive && isProcessing ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={[
                  'mt-1 text-xs text-center whitespace-nowrap',
                  isActive && status !== 'failed' ? 'text-foreground font-medium' : 'text-muted-foreground',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {index < STEP_LABELS.length - 1 && (
              <div
                className={[
                  'flex-1 h-0.5 mx-2 mb-5 transition-colors',
                  isPast ? 'bg-primary' : 'bg-muted-foreground/20',
                ].join(' ')}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

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

  return (
    <div className="space-y-4">
      <StepIndicator status={jobStatus.status} />

      {jobStatus.status === 'succeeded' && (
        <div className="rounded-lg border bg-card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            OCR処理が完了しました。
          </p>
          <a
            href={`/documents/${jobStatus.document_id}/edit`}
            className="inline-block rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
          >
            物件情報を確認・編集する
          </a>
        </div>
      )}

      {jobStatus.status === 'failed' && (
        <div className="rounded-lg border border-destructive/30 bg-card p-6 space-y-3">
          {jobStatus.error_message && (
            <p className="text-sm text-destructive" role="alert">
              エラー：{jobStatus.error_message}
            </p>
          )}
          <a href="/upload" className="text-sm text-primary underline">
            別のファイルをアップロードする
          </a>
        </div>
      )}

      {(jobStatus.status === 'queued' || jobStatus.status === 'processing') && (
        <p className="text-sm text-center text-muted-foreground">
          OCR処理中です。しばらくお待ちください...
        </p>
      )}
    </div>
  );
}
