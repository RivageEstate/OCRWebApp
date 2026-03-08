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
 *
 * 省略可能:
 *   CLOUD_TASKS_LOCATION      リージョン (デフォルト: asia-northeast1)
 */

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

/** Cloud Run のメタデータサーバーからアクセストークンを取得する */
async function getGcpAccessToken(): Promise<string> {
  const res = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } }
  );
  if (!res.ok) {
    throw new Error(`metadata server returned ${res.status}`);
  }
  const data = (await res.json()) as { access_token: string };
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
      "(set CLOUD_TASKS_PROJECT, CLOUD_TASKS_QUEUE, WORKER_URL, WORKER_SERVICE_ACCOUNT)"
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
