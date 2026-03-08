# 監視・アラート運用手順 / Monitoring and Alerting Runbook

- Title: 監視・アラート運用手順 / Monitoring and Alerting Runbook
- Status: In Review
- Created: 2026-03-09
- Last Updated: 2026-03-09
- Owner: Repository Maintainers
- Language: JA/EN

## 前提 / Preconditions

- GCP プロジェクト（`asia-northeast1` / 東京リージョン）への `monitoring.admin` または `logging.admin` 権限
- `gcloud` CLI がセットアップ済みであること
- Cloud Run Worker サービスが稼働中であること（`apps/worker/`）
- ログベースメトリクスの適用前に Cloud Logging Agent が有効なこと

Worker は構造化 JSON ログ（`apps/worker/src/logger.ts`）を stdout/stderr に出力する。
Cloud Run はこれを自動的に Cloud Logging に取り込む。

## ログ構造 / Log Structure

Worker が出力する構造化ログのフィールド：

| フィールド | 型 | 説明 |
|---|---|---|
| `severity` | string | `INFO` / `WARNING` / `ERROR` / `DEBUG` |
| `message` | string | 人間が読めるメッセージ |
| `job_id` | string | 対象ジョブの UUID |
| `step` | string | 処理ステップ（下表参照） |
| `duration_ms` | number | 処理時間（`success` / `fail` 時） |
| `attempt` | number | リトライ回数（0 始まり） |
| `error` | string | エラーメッセージ（エラー時） |
| `trace_id` | string | Cloud Tasks から渡されるトレース ID |

`step` の値と意味：

| step | severity | 意味 |
|---|---|---|
| `start` | INFO | ジョブ処理開始 |
| `skip` | WARNING | 無効な状態遷移のためスキップ |
| `retry` | WARNING | リトライ実施 |
| `attempt_failed` | ERROR | 1 回の試行が失敗 |
| `success` | INFO | ジョブ処理成功 |
| `fail` | ERROR | リトライ上限到達・最終失敗 |
| `ocr_saved` | INFO | OCR 抽出結果を DB に保存 |
| `property_saved` | INFO | 正規化物件情報を DB に保存 |

## 手順 / Procedure

### 1. ログベースメトリクスの適用

```bash
# プロジェクトを設定
gcloud config set project <PROJECT_ID>

# 各メトリクスを登録（infra/monitoring/log-metrics.yaml の各エントリーを個別に適用）
# スラッシュ区切り名を使うことで metric.type が
# "logging.googleapis.com/user/worker/job_failed_total" となり、
# alert-policies.yaml のフィルターと一致する。
gcloud logging metrics create worker/job_failed_total \
  --description="Worker ジョブ最終失敗件数" \
  --log-filter='resource.type="cloud_run_revision" jsonPayload.step="fail" severity="ERROR"'

gcloud logging metrics create worker/job_succeeded_total \
  --description="Worker ジョブ成功件数" \
  --log-filter='resource.type="cloud_run_revision" jsonPayload.step="success" severity="INFO"'

gcloud logging metrics create worker/job_duration_ms \
  --description="Worker ジョブ処理時間（ms）" \
  --log-filter='resource.type="cloud_run_revision" jsonPayload.step=("success" OR "fail")' \
  --value-extractor='EXTRACT(jsonPayload.duration_ms)' \
  --metric-kind=DELTA \
  --value-type=DISTRIBUTION \
  --unit=ms

gcloud logging metrics create worker/job_retry_total \
  --description="Worker ジョブリトライ件数" \
  --log-filter='resource.type="cloud_run_revision" jsonPayload.step="retry" severity="WARNING"'
```

### 2. 通知チャンネルの設定

```bash
# Slack チャンネルを通知先として追加する例
gcloud alpha monitoring channels create \
  --channel-labels=url=https://hooks.slack.com/services/XXX/YYY/ZZZ \
  --type=slack \
  --display-name="OCRWebApp Alerts"

# 作成されたチャンネル ID を確認
gcloud alpha monitoring channels list
```

### 3. アラートポリシーの適用

```bash
# alert-policies.yaml の notificationChannels を実際の ID に書き換えてから適用
gcloud alpha monitoring policies create \
  --policy-from-file=infra/monitoring/alert-policies.yaml
```

### 4. ログの確認

Cloud Logging でジョブログを検索：

```text
resource.type="cloud_run_revision"
resource.labels.service_name="ocrwebapp-worker"
jsonPayload.job_id="<JOB_ID>"
```

失敗ジョブのみ絞り込み：

```text
resource.type="cloud_run_revision"
jsonPayload.step="fail"
severity="ERROR"
```

## 監視項目 / Monitoring

| メトリクス | 閾値 | アラート条件 | 通知間隔 |
|---|---|---|---|
| ジョブ失敗件数 | 3 件 / 5 分 | 超過時 | 30 分に 1 回 |
| ジョブ処理件数ゼロ | 0 件 / 15 分 | 継続時 | 1 時間に 1 回 |
| p95 処理時間 | 240,000 ms / 10 分 | 超過時 | 1 時間に 1 回 |

### Cloud Monitoring ダッシュボード

以下のウィジェットを含むダッシュボードを推奨：

1. **ジョブ成功・失敗件数**（時系列グラフ）
   メトリクス: `logging.googleapis.com/user/worker/job_failed_total`、`worker/job_succeeded_total`

2. **ジョブ処理時間（p50 / p95）**（時系列グラフ）
   メトリクス: `logging.googleapis.com/user/worker/job_duration_ms`

3. **リトライ件数**（カウンター）
   メトリクス: `logging.googleapis.com/user/worker/job_retry_total`

ダッシュボードは Cloud Console > Monitoring > Dashboards から手動作成、または
`gcloud monitoring dashboards create` で JSON 定義から一括適用可能。

## ロールバック / Rollback

アラートポリシーを無効化する場合：

```bash
# ポリシー一覧を取得
gcloud alpha monitoring policies list

# 特定ポリシーを無効化
gcloud alpha monitoring policies update <POLICY_ID> --no-enabled

# ログベースメトリクスの削除
gcloud logging metrics delete worker/job_failed_total
```

## 障害時対応 / Incident Response

### ケース 1: ジョブ失敗件数アラート発火

1. Cloud Logging でエラーログを確認（`step=fail`, `error` フィールド参照）
2. エラーが `timeout after 300000ms` の場合 → OCR/LLM プロバイダーの遅延を調査
3. エラーが認証系の場合 → Secret Manager の API キーを確認
4. 復旧後、Cloud Tasks で失敗タスクを再エンキューする

### ケース 2: 処理件数ゼロアラート発火

1. `gcloud run services describe ocrwebapp-worker` で Cloud Run の状態を確認
2. インスタンスが 0 の場合 → Cloud Run の最小インスタンス設定を確認
3. Cloud Tasks キューが一時停止していないか確認

### ケース 3: 処理時間超過アラート発火

1. 処理時間が増加しているジョブの `job_id` と `error` を確認
2. 画像サイズが大きい場合 → クライアント側のアップロード制限（20MB）を確認
3. LLM レスポンスが遅い場合 → プロバイダーのステータスページを確認

## 概要 / Summary (JA)

Worker の構造化 JSON ログ（`apps/worker/src/logger.ts`）を基盤として、
Cloud Logging のログベースメトリクスと Cloud Monitoring アラートポリシーにより
ジョブ失敗率・処理件数・処理時間の 3 指標を可視化・監視する。

各指標の定義ファイルは `infra/monitoring/` に格納し、
`gcloud` CLI で GCP プロジェクトに適用する。

## Summary (EN)

This runbook describes how to set up observability for the OCRWebApp Worker on Cloud Run.
Structured JSON logs emitted by `apps/worker/src/logger.ts` are ingested into Cloud Logging
and converted to log-based metrics (failure count, success count, duration, retry count).
Cloud Monitoring alert policies notify the team when failure rate, zero-throughput, or
high-latency thresholds are exceeded.
Metric and alert definitions are stored in `infra/monitoring/` and applied via the `gcloud` CLI.

## 結論 / Conclusion (JA)

本手順に従ってメトリクスとアラートを適用することで、
SPEC.md §9 の要件「ジョブ失敗率・滞留時間・処理件数を収集し、閾値超過時に通知する」を満たす。
ダッシュボードは Cloud Console から手動作成し、インシデント時はこのランブックに従って対応する。

## Conclusion (EN)

Following this runbook satisfies the SPEC.md §9 monitoring requirement:
"Collect job failure rate, dwell time, and throughput; notify on threshold violations."
Dashboards are created manually in Cloud Console; incidents are handled per this runbook.
