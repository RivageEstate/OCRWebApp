import { processPhase0Job } from "./processors/phase0";

type JobPayload = {
  job_id: string;
  attempt?: number;
  trace_id?: string;
};

async function main() {
  const payloadJson = process.env.JOB_PAYLOAD_JSON;
  if (!payloadJson) {
    console.log("[worker] JOB_PAYLOAD_JSON is not set. Exiting (stub).");
    return;
  }

  const payload = JSON.parse(payloadJson) as JobPayload;
  await processPhase0Job(payload);
}

main().catch((error) => {
  console.error("[worker] fatal error:", error);
  process.exitCode = 1;
});

