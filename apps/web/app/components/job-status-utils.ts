export interface JobStatus {
  job_id: string;
  document_id: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  error_message?: string | null;
}

export const TERMINAL_STATUSES = new Set<JobStatus['status']>(['succeeded', 'failed']);

export const STEP_LABELS = ['アップロード完了', 'OCR処理中', '編集へ進む'] as const;

export function getActiveStep(status: JobStatus['status']): number {
  if (status === 'succeeded') return 2;
  if (status === 'failed') return -1;
  return 1;
}
