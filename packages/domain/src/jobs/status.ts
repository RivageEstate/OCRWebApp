export const jobStatuses = ["queued", "processing", "succeeded", "failed"] as const;
export type JobStatus = (typeof jobStatuses)[number];

const transitions: Record<JobStatus, JobStatus[]> = {
  queued: ["processing", "failed"],
  processing: ["succeeded", "failed"],
  succeeded: [],
  failed: []
};

export function isValidJobTransition(from: JobStatus, to: JobStatus): boolean {
  return transitions[from].includes(to);
}

