# ローカル Docker 擬似起動ガイド / Local Docker Pseudo-Run Guide

- Title: ローカル Docker 擬似起動ガイド / Local Docker Pseudo-Run Guide
- Status: Draft
- Created: 2026-02-28
- Last Updated: 2026-02-28
- Owner: Repository Maintainers
- Language: JA/EN

## 目的 / Objective

Phase 0 の現状実装を、ローカル PC 上で `Docker Compose` により
擬似的に起動し、UI・API・Worker スタブを確認できる状態を作る。

## 対象範囲 / Scope

- `web`: Next.js アプリケーション
- `db`: ローカル PostgreSQL
- `worker`: 単発実行のスタブ Worker

この手順は 2026-02-28 時点の実装を対象とする。現時点での前提は次の通り。

- Web UI はトップページの最小表示のみ
- API は `POST /api/documents` `GET /api/jobs/{jobId}` `GET /api/documents/{documentId}` を確認対象とする
- 認証は暫定的に `x-user-id` ヘッダーで代替する
- Worker は `JOB_PAYLOAD_JSON` を受けてログを出すスタブである
- OCR / LLM / Storage の本実装はローカル擬似起動の必須条件ではない

## 前提条件 / Prerequisites

- Docker Desktop または Docker Engine
- Docker Compose v2

確認例:

```bash
docker compose version
docker version
```

## 起動ファイル / Runtime Files

リポジトリルートに以下を追加している。

- `compose.yaml`: `db` `web` `worker` のローカル構成
- `Dockerfile.dev`: 開発用の Node.js ワークスペースイメージ

`apps/worker/Dockerfile` は Cloud Run 向け想定を維持し、
ローカル擬似起動では使い分ける。

## 初回セットアップ / Initial Setup

イメージをビルドする。

```bash
docker compose build
```

初回のみ、あるいは `package-lock.json` や各 `package.json` を更新した後は
再度 `docker compose build` を実行する。

## DB 起動とマイグレーション / Start DB and Apply Migrations

まず PostgreSQL を起動する。

```bash
docker compose up -d db
```

次に Prisma migration を適用する。

```bash
docker compose run --rm web \
  npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

補足:

- `compose.yaml` 内で `DATABASE_URL` はコンテナ間通信用に `db:5432` を参照する
- ローカルホストから DB に接続する場合は `localhost:5432` を使う

## テストユーザー投入 / Seed a Local User

現状の API は `x-user-id` に指定した UUID が `users.id` に存在する前提で動作する。
最低限の確認用ユーザーを投入する。

```bash
docker compose exec db psql -U postgres -d ocrwebapp -c \
  "insert into users (id, email, name) values ('550e8400-e29b-41d4-a716-446655440000', 'local@example.com', 'Local User') on conflict (id) do nothing;"
```

注記:

- `x-user-id` は UUID v4 形式である必要がある
- 例として `550e8400-e29b-41d4-a716-446655440000` を使う

## Web 起動 / Start Web

```bash
docker compose up web
```

起動後の確認先:

- UI: `http://localhost:3000`
- API: `http://localhost:3000/api/*`
- DB: `localhost:5432`

Next.js のホットリロードは bind mount 上で動作させるため、`compose.yaml` で
ポーリング監視を有効化している。

## API 確認 / API Smoke Test

トップページ確認:

```bash
curl http://localhost:3000
```

文書作成 API:

```bash
curl -X POST http://localhost:3000/api/documents \
  -H 'x-user-id: 550e8400-e29b-41d4-a716-446655440000' \
  -F 'file=@/path/to/sample.jpg'
```

期待結果:

- `document_id`
- `job_id`
- `status: "queued"`

ジョブ取得:

```bash
curl http://localhost:3000/api/jobs/<job_id> \
  -H 'x-user-id: 550e8400-e29b-41d4-a716-446655440000'
```

文書取得:

```bash
curl http://localhost:3000/api/documents/<document_id> \
  -H 'x-user-id: 550e8400-e29b-41d4-a716-446655440000'
```

## Worker スタブ確認 / Worker Stub Check

Worker は常駐起動ではなく単発確認とする。

```bash
docker compose run --rm worker
```

期待結果:

- 標準出力に `phase0 job received (stub)` が出る

別 payload を試す場合:

```bash
docker compose run --rm \
  -e JOB_PAYLOAD_JSON='{"job_id":"22222222-2222-2222-2222-222222222222","attempt":2,"trace_id":"manual"}' \
  worker
```

## 停止とクリーンアップ / Stop and Cleanup

停止:

```bash
docker compose down
```

DB データも削除する場合:

```bash
docker compose down -v
```

## 制約 / Current Limitations

- NextAuth の Google OAuth はローカル擬似起動の必須条件ではない
- OCR / LLM / Storage の外部 API はこの手順では呼ばない
- Worker は `jobs.status` を更新しないため、API 上の状態は通常 `queued` のままである
- 本番向けデプロイ構成そのものを再現するものではなく、Phase 0 の疎通確認に限定する

## 概要 / Summary (JA)

`compose.yaml` と `Dockerfile.dev` により、Phase 0 の現状実装を
`db` `web` `worker` の最小構成でローカル確認できる。
必須手順は DB 起動、Prisma migration、テストユーザー投入、Web 起動である。

## Summary (EN)

The local Docker setup provides a minimal `db`, `web`, and stub `worker`
environment for Phase 0 verification. The required steps are starting the
database, applying Prisma migrations, seeding a test user, and launching the web app.

## 結論 / Conclusion (JA)

ローカル Docker は本番構成の完全再現ではなく、Phase 0 の API と Worker スタブを
素早く試すための擬似実行環境として扱う。

## Conclusion (EN)

The local Docker setup is a pseudo-run environment for quick validation of
the Phase 0 API and stub worker, not a full production replica.
