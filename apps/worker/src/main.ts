import http from "http";
import { processPhase0Job } from "./processors/phase0";

type JobPayload = {
  job_id: string;
  attempt?: number;
  trace_id?: string;
};

const PORT = Number(process.env.PORT ?? 8080);

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method === "POST" && req.url === "/dispatch") {
    let payload: JobPayload;
    try {
      const body = await readBody(req);
      payload = JSON.parse(body) as JobPayload;
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "invalid_json" }));
      return;
    }

    if (!payload.job_id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "job_id is required" }));
      return;
    }

    try {
      await processPhase0Job(payload);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    } catch (error) {
      console.error("[worker] processPhase0Job failed:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "processing_failed" }));
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`[worker] HTTP server listening on port ${PORT}`);
});

