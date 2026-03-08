# Cloud Tasks をジョブディスパッチに採用する / Adopt Cloud Tasks for Job Dispatch

- Title: Cloud Tasks をジョブディスパッチに採用する / Adopt Cloud Tasks for Job Dispatch
- Status: Accepted
- Created: 2026-03-08
- Last Updated: 2026-03-08
- Owner: Repository Maintainers
- Language: JA/EN
- Closes: #43

## Context

`POST /api/documents` でアップロードを受け付けた後、Worker（Cloud Run Service）へ非同期で
処理を依頼する仕組みが必要だった。
候補として **Cloud Tasks** と **Pub/Sub** を検討した。

## Decision

Cloud Tasks を採用し、Worker を HTTP サーバー（Cloud Run Service）として実装する。

- Web アプリ（Vercel）が Cloud Tasks キューへタスクをエンキュー
- Cloud Tasks が Worker の `POST /dispatch` へ OIDC トークン付きで HTTP push
- Worker が受け取ったペイロードで `processPhase0Job` を実行し、完了後 200 を返す
- Cloud Tasks は 5xx / タイムアウト時に自動リトライ

## 比較

| 観点 | Cloud Tasks | Pub/Sub |
|------|-------------|---------|
| 配信保証 | at-least-once（デッドレターキュー対応） | at-least-once |
| リトライ制御 | 最大試行回数・バックオフ設定可能 | サブスクリプションで設定 |
| HTTP push 対応 | ネイティブ | Push サブスクリプションで可 |
| デバッグ | タスク単位で確認可能 | メッセージ単位 |
| 採用コスト | Cloud Run との相性が高く公式推奨 | スキーマ管理が必要 |

Phase 0 の規模・シンプルさを優先し、Cloud Tasks を選択した。

## Consequences

- Web アプリは CLOUD_TASKS_PROJECT / CLOUD_TASKS_QUEUE / WORKER_URL / WORKER_SERVICE_ACCOUNT
  環境変数が未設定の場合はディスパッチをスキップする（ローカル開発ではジョブが自動起動しない）。
- Worker は Cloud Run Service として常時起動（min-instances 0 でコールドスタートあり）。
- タイムアウト上限は Cloud Tasks の最大 30 分以内に収める必要がある（現在 Worker は 360 秒）。
- 将来的にタスクの優先度制御や重複排除が必要になった場合は Pub/Sub への移行を検討する。

## Alternatives

- Pub/Sub を採用し、Worker を Push サブスクリプションで受け取る。
- SQS 等の AWS サービスを利用する（インフラが分散するため不採用）。

## 概要 / Summary (JA)

`POST /api/documents` 後のジョブを Worker へ非同期配信するため、GCP Cloud Tasks を採用した。
Cloud Run との親和性・HTTP push のネイティブ対応・リトライ制御の柔軟性を主な採用理由とする。

## Summary (EN)

Adopted GCP Cloud Tasks to asynchronously dispatch jobs to the Worker after `POST /api/documents`.
Key reasons: native compatibility with Cloud Run, built-in HTTP push support, and flexible retry control.

## 結論 / Conclusion (JA)

Cloud Tasks + Cloud Run HTTP サーバー構成を Phase 0 の標準ジョブディスパッチ方式とする。

## Conclusion (EN)

Cloud Tasks with a Cloud Run HTTP server is the standard job dispatch mechanism for Phase 0.
