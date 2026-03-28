'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';

export interface JobStatus {
  job_id: string;
  document_id: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  error_message?: string | null;
}

const TERMINAL_STATUSES = new Set<JobStatus['status']>(['succeeded', 'failed']);
const POLL_INTERVAL_MS = 2000;

export const STEP_LABELS = ['アップロード完了', 'OCR処理中', '編集へ進む'] as const;

export function getActiveStep(status: JobStatus['status']): number {
  if (status === 'succeeded') return 2;
  if (status === 'failed') return -1;
  return 1;
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
                    : 'bg-background border-input text-muted-foreground',
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
                  isPast ? 'bg-primary' : 'bg-input',
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
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
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
        <Card>
          <CardContent className="p-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              OCR処理が完了しました。
            </p>
            <Button asChild>
              <a href={`/documents/${jobStatus.document_id}/edit`}>
                物件情報を確認・編集する
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {jobStatus.status === 'failed' && (
        <Card className="border-destructive/30">
          <CardContent className="p-6 space-y-3">
            <p className="text-sm text-destructive font-medium" role="alert">
              {jobStatus.error_message
                ? `エラー：${jobStatus.error_message}`
                : '処理に失敗しました。'}
            </p>
            <Button variant="link" asChild className="px-0">
              <a href="/upload">別のファイルをアップロードする</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {jobStatus.status === 'queued' && (
        <p className="text-sm text-center text-muted-foreground">
          処理の順番待ちです。しばらくお待ちください...
        </p>
      )}

      {jobStatus.status === 'processing' && (
        <p className="text-sm text-center text-muted-foreground">
          OCR処理中です。しばらくお待ちください...
        </p>
      )}
    </div>
  );
}
