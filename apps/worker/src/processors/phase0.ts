type JobPayload = {
  job_id: string;
  attempt?: number;
  trace_id?: string;
};

export async function processPhase0Job(payload: JobPayload): Promise<void> {
  console.log("[worker] phase0 job received (stub):", payload.job_id);
}

