/**
 * Cloud Tasks dispatcher — エンキュー処理
 *
 * 環境変数が未設定（ローカル開発など）の場合はスキップし、
 * ログだけ出してエラーにしない。
 *
 * 必須環境変数:
 *   CLOUD_TASKS_PROJECT       GCP プロジェクト ID
 *   CLOUD_TASKS_QUEUE         キュー名
 *   WORKER_URL                Cloud Run サービスの URL (例: https://ocrwebapp-worker-xxx.run.app)
 *   WORKER_SERVICE_ACCOUNT    Worker 呼び出しに使う SA メール
 *   GCP_SERVICE_ACCOUNT_KEY   Cloud Tasks 呼び出し用 SA キー JSON（Vercel の環境変数に設定）
 *
 * 省略可能:
 *   CLOUD_TASKS_LOCATION      リージョン (デフォルト: asia-northeast1)
 */

import { createSign } from "crypto";

type JobPayload = {
  job_id: string;
};

type CloudTasksTask = {
  httpRequest: {
    httpMethod: "POST";
    url: string;
    headers: Record<string, string>;
    body: string; // base64
    oidcToken: { serviceAccountEmail: string };
  };
};

type ServiceAccountKey = {
  client_email: string;
  private_key: string;
};

/**
 * サービスアカウントキー JSON から Google API アクセストークンを取得する。
 * GCP_SERVICE_ACCOUNT_KEY 環境変数に SA キー JSON 文字列を設定する。
 * Vercel など GCP 外部の環境でも動作する。
 */
async function getGcpAccessToken(): Promise<string> {
  const keyJson = process.env.GCP_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    throw new Error(
      "GCP_SERVICE_ACCOUNT_KEY is not set. Set a service account key JSON to call Cloud Tasks from Vercel."
    );
  }

  const key = JSON.parse(keyJson) as ServiceAccountKey;
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  ).toString("base64url");

  const claimSet = Buffer.from(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/cloud-tasks",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${claimSet}`);
  const signature = sign.sign(key.private_key, "base64url");

  const jwt = `${header}.${claimSet}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(
      `Failed to get GCP access token: HTTP ${tokenRes.status} ${body}`
    );
  }

  const data = (await tokenRes.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Cloud Tasks キューへジョブをエンキューする。
 * 環境変数が未設定の場合はスキップ（ローカル開発・テスト用）。
 */
export async function dispatchWorkerJob(jobId: string): Promise<void> {
  const project = process.env.CLOUD_TASKS_PROJECT;
  const location = process.env.CLOUD_TASKS_LOCATION ?? "asia-northeast1";
  const queue = process.env.CLOUD_TASKS_QUEUE;
  const workerUrl = process.env.WORKER_URL;
  const workerSa = process.env.WORKER_SERVICE_ACCOUNT;

  if (!project || !queue || !workerUrl || !workerSa) {
    console.warn(
      "[dispatch] Cloud Tasks not configured — skipping dispatch for job",
      jobId,
      "(set CLOUD_TASKS_PROJECT, CLOUD_TASKS_QUEUE, WORKER_URL, WORKER_SERVICE_ACCOUNT, GCP_SERVICE_ACCOUNT_KEY)"
    );
    return;
  }

  const accessToken = await getGcpAccessToken();

  const payload: JobPayload = { job_id: jobId };
  const task: CloudTasksTask = {
    httpRequest: {
      httpMethod: "POST",
      url: `${workerUrl}/dispatch`,
      headers: { "Content-Type": "application/json" },
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
      oidcToken: { serviceAccountEmail: workerSa },
    },
  };

  const queuePath = `projects/${project}/locations/${location}/queues/${queue}`;
  const apiUrl = `https://cloudtasks.googleapis.com/v2/${queuePath}/tasks`;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ task }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloud Tasks enqueue failed: HTTP ${res.status} ${body}`);
  }

  console.log(`[dispatch] job ${jobId} enqueued to queue ${queue}`);
}
